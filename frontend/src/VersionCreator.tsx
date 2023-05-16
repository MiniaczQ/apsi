import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Col, Form, ListGroup, Row, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { LoginState } from './App';
import ApiClient from './api/ApiClient';
import CreateDocument from './models/CreateDocument';
import CreateVersion from './models/CreateVersion';
import DocumentVersion from './models/DocumentVersion';


type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  const [createdDocument, setCreatedDocument] = useState<CreateDocument>({
    documentName: '',
  });
  const [createdVersion, setCreatedVersion] = useState<CreateVersion>({
    versionName: '1',
    content: '',
    parents: [],
  });

  const parentVersion = versions?.filter(version => version.versionId === parentVersionId)?.[0];
  const versionsMinusParent = versions?.filter(({ versionId }) => versionId !== parentVersionId);


  useEffect(() => {
    if (documentId === undefined)
      return;
    let documentPromise = apiClient.getDocument(documentId)
      .then(response => setCreatedDocument(doc => ({ ...doc, documentName: response.documentName })));
    let versionsPromise = apiClient.getVersions(documentId)
      .then(response => setVersions(response));
    Promise.all([documentPromise, versionsPromise])
      .then(() => setIsLoading(false));
  }, [apiClient, documentId, parentVersionId]);

  useEffect(() => {
    setCreatedVersion(ver => ({
      ...ver,
      versionName: (Number(parentVersion?.versionName ?? 0) + 1).toString(),
      parents: parentVersion !== undefined ? [parentVersion.versionId] : [],
      content: parentVersion?.content ?? ''
    }));
  }, [parentVersion]);

  const parentVersionField = parentVersion !== undefined ? (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent version</Form.Label>
      <Form.Control disabled type="text" value={parentVersion.versionName} />
    </Form.Group>
  ) : undefined;

  const updateParents = (versionId: string, checked: boolean) => {
    if (checked)
      setCreatedVersion({ ...createdVersion, parents: [...createdVersion.parents, versionId] });
    else
      setCreatedVersion({ ...createdVersion, parents: createdVersion.parents.filter(id => id !== versionId) });
  };
  const isParentChecked = (versionId: string) => createdVersion.parents.indexOf(versionId) >= 0;

  const setDocumentName = (documentName: string) => setCreatedDocument({ ...createdDocument, documentName });
  const setVersionContent = (content: string) => setCreatedVersion({ ...createdVersion, content });

  const createVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    if (documentId === undefined) {
      apiClient.createDocument(createdDocument)
        .then(response => apiClient.createVersion(response.documentId, createdVersion))
        .then(() => navigate('./Documents'));
    } else {
      apiClient.createVersion(documentId, createdVersion)
        .then(() => navigate('./Documents'));
    }
  };

  const mergedVersionsField = parentVersionId !== undefined ? (
    <Form.Group className="mb-3" controlId="merged">
      <Form.Label>Merge versions</Form.Label>
      <Tab.Container id="list-group-tabs-example">
        <Row>
          <Col sm={2}>
            <ListGroup>
              {versionsMinusParent?.map(({ versionId, versionName }) => (
                <ListGroup.Item key={versionId}
                  disabled={versionId === parentVersionId}
                  action href={'#version-' + versionId}
                  variant={isParentChecked(versionId) ? 'primary' : 'secondary'}>
                  <Form.Check checked={isParentChecked(versionId)}
                    onChange={evt => updateParents(versionId, evt.target.checked)}
                    label={versionName}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col sm={8}>
            <Tab.Content>
              {versionsMinusParent?.map(({ versionId, content }) => (
                <Tab.Pane key={versionId} eventKey={'#version-' + versionId}>
                  <Form.Label>Version content preview</Form.Label>
                  <div style={{ whiteSpace: 'pre' }}>
                    {content}
                  </div>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Form.Group>
  ) : undefined;


  return (
    <>
      <Form.Group className="mb-3" controlId="documentName">
        <Form.Label>Document name</Form.Label>
        <Form.Control disabled={parentVersionId !== undefined}
          type="text"
          value={createdDocument.documentName}
          onChange={evt => setDocumentName(evt.target.value)}
          placeholder="Enter document name"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="author">
        <Form.Label>Version owner</Form.Label>
        <Form.Control disabled type="text" value={loginState.username} />
      </Form.Group>
      {parentVersionField}
      {mergedVersionsField}
      <Form.Group className="mb-3" controlId="content">
        <Form.Label>Content</Form.Label>
        <Form.Control as="textarea"
          rows={5}
          value={createdVersion.content}
          onChange={evt => setVersionContent(evt.target.value)}
        />
      </Form.Group>
      <Button onClick={createVersion}>Create</Button>
    </>
  );
}

export default VersionCreator;
