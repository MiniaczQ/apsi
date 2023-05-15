import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Col, Form, ListGroup, Row, Tab } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { LoginState } from './App';
import CreateDocument from './models/CreateDocument';
import CreateVersion from './models/CreateVersion';
import ApiClient from './api/ApiClient';
import DocumentVersion from './models/DocumentVersion';

type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const [_, setIsLoading] = useState(true);
  const [versionText, setVersionText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [versionName, setVersionName] = useState('1');

  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('document') ?? undefined;
  const parentId = searchParams.get('parentVersion') ?? undefined;
  const documentNameOld = searchParams.get('documentName') ?? undefined;

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [parentName, setParentName] = useState<string>('');
  const [parents, setParents] = useState<string[]>([]);

  useEffect(() => {
    if (documentId === undefined)
      return;
    apiClient.getVersions(documentId)
      .then(response => {
        setVersions(response);
        setParentName(response.filter(version => version.versionId === parentId)[0].versionName)
      });
  }, [documentId, apiClient, parentId]);

  const _createVersion = async () => {
    if (parentId === undefined)
      return;
    let cd: CreateDocument = { documentName: documentName };
    let cv: CreateVersion = { versionName: versionName, content: versionText, parents: [...parents, parentId] };
    if (documentId === undefined) {
      apiClient.createDocument(cd)
        .then(response => apiClient.createVersion(response.documentId, cv))
        .then(() => navigate('./Documents'));
    } else {
      apiClient.createVersion(documentId!, cv)
        .then(() => navigate('./Documents'));
    }
  };

  useEffect(() => {
    if (parentId !== undefined) {
      (async () => {
        setVersionText((await apiClient.getVersion(documentId!, parentId)).content);
        setDocumentName(documentNameOld!);
        setVersionName((+(parentName!) + 1).toString());
        setIsLoading(false);
      })();
    } else {
      setIsLoading(false);
    }
  }, [apiClient, documentId, documentNameOld, parentId, parentName]);

  const parentVersionField = parentId !== undefined ? (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent version</Form.Label>
      <Form.Control disabled type="text" value={parentName} />
    </Form.Group>
  ) : undefined;

  const updateParents = (versionId: string, checked: boolean) => {
    if (checked)
      setParents([...parents, versionId]);
    else
      setParents(parents.filter(id => id !== versionId));
  };

  const mergedVersionsField = parentId !== undefined ? (
    <Form.Group className="mb-3" controlId="merged">
      <Form.Label>Merge versions</Form.Label>
      <Tab.Container id="list-group-tabs-example">
        <Row>
          <Col sm={2}>
            <ListGroup>
              {versions?.filter(version => version.versionId !== parentId)?.map(version => (
                <ListGroup.Item key={version.versionId}
                  disabled={version.versionId === parentId}
                  action href={'#version-' + version.versionId}
                  variant={parents.indexOf(version.versionId) >= 0 ? 'primary' : 'secondary'}>
                  <Form.Check checked={parents.indexOf(version.versionId) >= 0} onChange={evt => updateParents(version.versionId, evt.target.checked)} label={version.versionName} />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col sm={8}>
            <Tab.Content>
              {versions?.filter(version => version.versionId !== parentId)?.map(version => (
                <Tab.Pane key={version.versionId} eventKey={'#version-' + version.versionId}>
                  <Form.Label>Content</Form.Label>
                  <div style={{ whiteSpace: 'pre' }}>
                    {version.content}
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
        <Form.Control disabled={parentId !== undefined} type="text" value={documentName} onChange={evt => setDocumentName(evt.target.value)} placeholder="Enter document name" />
      </Form.Group>
      <Form.Group className="mb-3" controlId="author">
        <Form.Label>Version owner</Form.Label>
        <Form.Control disabled type="text" value={loginState.username} />
      </Form.Group>
      {parentVersionField}
      {mergedVersionsField}
      <Form.Group className="mb-3" controlId="content">
        <Form.Label>Content</Form.Label>
        <Form.Control as="textarea" rows={5} value={versionText} onChange={evt => setVersionText(evt.target.value)} />
      </Form.Group>
      <Button onClick={_createVersion}>Create</Button>
    </>
  );
}

export default VersionCreator;
