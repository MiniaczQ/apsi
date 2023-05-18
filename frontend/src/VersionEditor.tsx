import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import Select from 'react-select';

import { LoginState } from './App';
import ApiClient from './api/ApiClient';
import Document from './models/Document';
import DocumentVersion from './models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole } from './models/DocumentVersionMember';
import UpdateVersion from './models/UpdateVersion';
import User from './models/User';


type VersionEditorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionEditor: FunctionComponent<VersionEditorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const versionId = searchParams.get('versionId') ?? undefined;

  const [, setIsLoading] = useState(true);
  const [baseDocument, setBaseDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [updatedVersion, setUpdatedVersion] = useState<UpdateVersion>({
    versionName: '',
    content: '',
  });
  const [originalMembers, setOriginalMembers] = useState<DocumentVersionMember[]>([]);
  const [viewers, setViewers] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [reviewers, setReviewers] = useState<string[]>([]);

  const baseVersion = versions?.filter(version => version.versionId === versionId)?.[0];
  const parents = baseVersion?.parents?.map(parentId => versions?.filter(version => version.versionId === parentId)?.[0]);

  const userOptions = users?.map(user => ({ value: user.userId, label: user.username }));
  const originalViewers = originalMembers.filter(member => member.roles.includes('viewer')).map(member => member.userId);
  const originalViewersOptions = userOptions?.filter(option => originalViewers.includes(option.value));
  const originalEditors = originalMembers.filter(member => member.roles.includes('editor')).map(member => member.userId);
  const originalEditorsOptions = userOptions?.filter(option => originalEditors.includes(option.value));
  const originalReviewers = originalMembers.filter(member => member.roles.includes('reviewer')).map(member => member.userId);
  const originalReviewersOptions = userOptions?.filter(option => originalReviewers.includes(option.value));

  useEffect(() => {
    console.log('viewers', originalViewers, viewers);
    console.log('editors', originalEditors, editors);
    console.log('reviewers', originalReviewers, reviewers);
  }, [originalViewers, originalEditors, originalReviewers, viewers, editors, reviewers]);

  useEffect(() => {
    let usersPromise = apiClient.getUsers()
      .then(response => setUsers(response));
    let documentPromise = apiClient.getDocument(documentId!)
      .then(response => setBaseDocument(response));
    let versionsPromise = apiClient.getVersions(documentId!)
      .then(response => setVersions(response));
    let membersPromise = apiClient.getMembers(documentId!, versionId!)
      .then(response => {
        console.log(response);
        setOriginalMembers(response);
      });
    Promise.all([usersPromise, documentPromise, versionsPromise, membersPromise])
      .then(() => setIsLoading(false));
  }, [apiClient, documentId, versionId]);

  useEffect(() => {
    setUpdatedVersion({ versionName: baseVersion?.versionName, content: baseVersion?.content });
  }, [baseVersion]);

  const parentVersionField = (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent versions</Form.Label>
      <Form.Control disabled type="text" value={parents?.map(parent => parent.versionName)?.join(', ') ?? ''} />
      <Form.Label>Version name</Form.Label>
      <Form.Control disabled type="text" value={baseVersion?.versionName ?? ''} />
    </Form.Group>
  );

  const setVersionContent = (content: string) => setUpdatedVersion({ ...updatedVersion, content });

  const updateVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    if (documentId === undefined || versionId === undefined)
      return;
    (evt.target as HTMLButtonElement).disabled = true;
    apiClient.updateVersion(documentId, versionId, updatedVersion)
      .then(() => {
        const roles: DocumentVersionMemberRole[] = ['viewer', 'editor', 'reviewer'];
        [
          [originalViewers, viewers],
          [originalEditors, editors],
          [originalReviewers, reviewers],
        ].forEach(([original, current], index) => {
          const newMembers = current.filter(member => !original.includes(member));
          const removedMembers = original.filter(member => !current.includes(member));
          console.log('original/current', original, current);
          console.log('new/removed', newMembers, removedMembers);
          newMembers.forEach(member => apiClient.grantRole(documentId, versionId, member, roles[index]));
          removedMembers.forEach(member => apiClient.revokeRole(documentId, versionId, member, roles[index]));
        });
        navigate(`/Versions?documentId=${documentId}`);
      });
  };


  return (
    <>
      <Form.Group className="mb-3" controlId="documentName">
        <Form.Label>Document name</Form.Label>
        <Form.Control disabled type="text" value={baseDocument?.documentName ?? ''} />
      </Form.Group>
      {parentVersionField}
      <Form.Group className="mb-3" controlId="roles">
        <Form.Label>Version owner</Form.Label>
        <p>{loginState.username}</p>
        <Form.Label>Viewers</Form.Label>
        <Select isMulti defaultValue={originalViewersOptions} options={userOptions} onChange={newValue => setViewers(newValue.map(x => x.value))} />
        <Form.Label>Editors</Form.Label>
        <Select isMulti defaultValue={originalEditorsOptions} options={userOptions} onChange={newValue => setEditors(newValue.map(x => x.value))} />
        <Form.Label>Reviewers</Form.Label>
        <Select isMulti defaultValue={originalReviewersOptions} options={userOptions} onChange={newValue => setReviewers(newValue.map(x => x.value))} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="content">
        <Form.Label>Content</Form.Label>
        <Form.Control as="textarea"
          rows={5}
          value={updatedVersion.content}
          onChange={evt => setVersionContent(evt.target.value)}
        />
      </Form.Group>
      <Button onClick={updateVersion}>Modify</Button>
    </>
  );
}

export default VersionEditor;
