import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Col, Form, ListGroup, Row, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import Select from 'react-select';

import { LoginState } from './App';
import ApiClient from './api/ApiClient';
import CreateDocument from './models/CreateDocument';
import CreateVersion from './models/CreateVersion';
import DocumentVersion from './models/DocumentVersion';
import User from './models/User';


type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;


  const [, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [createdDocument, setCreatedDocument] = useState<CreateDocument>({
    documentName: '',
    initialVersion: { versionName: '1', content: '' }
  });
  const [createdVersion, setCreatedVersion] = useState<CreateVersion>({
    versionName: '1',
    content: '',
    parents: [],
  });
  const [viewers, setViewers] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [reviewers, setReviewers] = useState<string[]>([]);

  const parentVersion = versions?.filter(version => version.versionId === parentVersionId)?.[0];
  const versionsMinusParent = versions?.filter(({ versionId }) => versionId !== parentVersionId);
  const userOptions = users?.map(user => ({ value: user.userId, label: user.username }));

  const getNextVersion = (prefix: string) => prefix + (1 + versions
    .map(version => version.versionName.match(`^${prefix.replaceAll('.', '\\.')}(\\d+)$`)?.[1])
    .filter(number => number)
    .map(number => Number(number))
    .reduce((acc, val) => Math.max(acc, val), 0));

  const getNestedVersionName = (versionName: string) => getNextVersion(versionName + '.');
  const getSameLevelVersionName = (versionName: string) => {
    const lastDotIndex = versionName.lastIndexOf('.');
    const prefix = lastDotIndex === -1 ? '' : versionName.substring(0, lastDotIndex + 1);
    return getNextVersion(prefix);
  };
  const getParentLevelVersionNames = (versionName: string) => {
    const splittedVersion = versionName.split('.');
    const parentVersions = [];
    for (let i = 1; i < splittedVersion.length; i++)
      parentVersions.push(splittedVersion.slice(0, -i).join('.'));
    return parentVersions.map(version => getSameLevelVersionName(version));
  };

  const possibleNames = parentVersion !== undefined ?
    [getNestedVersionName(parentVersion.versionName)].concat([getSameLevelVersionName(parentVersion.versionName)])
      .concat(getParentLevelVersionNames(parentVersion.versionName))
      .map(name => ({ value: name, label: name }))
    : undefined;


  useEffect(() => {
    let usersPromise = apiClient.getUsers()
      .then(response => setUsers(response));
    let promises = [usersPromise];
    if (documentId !== undefined) {
      let documentPromise = apiClient.getDocument(documentId)
        .then(response => setCreatedDocument(doc => ({ ...doc, documentName: response.documentName })));
      let versionsPromise = apiClient.getVersions(documentId)
        .then(response => setVersions(response));
      promises = [...promises, documentPromise, versionsPromise];
    }
    Promise.all(promises)
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
      <Form.Label>Parent version name</Form.Label>
      <Form.Control disabled type="text" value={parentVersion.versionName} />
      <Form.Label>New version name</Form.Label>
      <Select options={possibleNames} required defaultValue={possibleNames?.[0]} onChange={selected => setCreatedVersion(v => ({ ...v, versionName: selected?.value ?? '1' }))} />
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
    let creationPromise;
    if (documentId === undefined) {
      let doc = createdDocument
      doc.initialVersion.content = createdVersion.content
      creationPromise = apiClient.createDocument(doc)
        .then(response => response.initialVersion);
    } else {
      creationPromise = apiClient.createVersion(documentId, createdVersion);
    }
    creationPromise.then(version => {
      viewers?.forEach(viewer => apiClient.grantRole(version.documentId, version.versionId, viewer, 'viewer'));
      editors?.forEach(editor => apiClient.grantRole(version.documentId, version.versionId, editor, 'editor'));
      reviewers?.forEach(reviewer => apiClient.grantRole(version.documentId, version.versionId, reviewer, 'reviewer'));
      navigate(`/Versions?documentId=${version.documentId}`);
    });
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
                    id={'checkbox-' + versionId}
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
      <Form.Group className="mb-3" controlId="roles">
        <Form.Label>Version owner</Form.Label>
        <p>{loginState.username}</p>
        <Form.Label>Viewers</Form.Label>
        <Select isMulti options={userOptions} onChange={newValue => setViewers(newValue.map(x => x.value))} />
        <Form.Label>Editors</Form.Label>
        <Select isMulti options={userOptions} onChange={newValue => setEditors(newValue.map(x => x.value))} />
        <Form.Label>Reviewers</Form.Label>
        <Select isMulti options={userOptions} onChange={newValue => setReviewers(newValue.map(x => x.value))} />
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
