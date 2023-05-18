import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';

import { LoginState } from './App';
import ApiClient from './api/ApiClient';
import Document from './models/Document';
import DocumentVersion from './models/DocumentVersion';
import DocumentVersionMember from './models/DocumentVersionMember';
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
  const [viewersOptions, setViewersOptions] = useState<MultiValue<{ label: string, value: string }>>([]);
  const [editorsOptions, setEditorsOptions] = useState<MultiValue<{ label: string, value: string }>>([]);
  const [reviewersOptions, setReviewersOptions] = useState<MultiValue<{ label: string, value: string }>>([]);

  const baseVersion = versions?.filter(version => version.versionId === versionId)?.[0];
  const parents = baseVersion?.parents?.map(parentId => versions?.filter(version => version.versionId === parentId)?.[0]);

  const userOptions = users?.map(user => ({ value: user.userId, label: user.username }));
  const viewers = viewersOptions.map(option => option.value);
  const editors = editorsOptions.map(option => option.value);
  const reviewers = reviewersOptions.map(option => option.value);

  useEffect(() => {
    const originalViewers = originalMembers.filter(member => member.roles.includes('viewer')).map(member => member.userId);
    const originalEditors = originalMembers.filter(member => member.roles.includes('editor')).map(member => member.userId);
    const originalReviewers = originalMembers.filter(member => member.roles.includes('reviewer')).map(member => member.userId);
    setViewersOptions(userOptions?.filter(option => originalViewers.includes(option.value)));
    setEditorsOptions(userOptions?.filter(option => originalEditors.includes(option.value)));
    setReviewersOptions(userOptions?.filter(option => originalReviewers.includes(option.value)));
  }, [userOptions, originalMembers]);

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
        const originalViewers = originalMembers.filter(member => member.roles.includes('viewer')).map(member => member.userId);
        const originalEditors = originalMembers.filter(member => member.roles.includes('editor')).map(member => member.userId);
        const originalReviewers = originalMembers.filter(member => member.roles.includes('reviewer')).map(member => member.userId);
        console.log(originalViewers);
        console.log(viewers);
        const newViewers = viewers.filter(viewer => !originalViewers.includes(viewer));
        newViewers.forEach(viewer => apiClient.grantRole(documentId, versionId, viewer, 'viewer'));
        console.log(newViewers);
        const noLongerViewers = originalViewers.filter(originalViewer => !viewers.includes(originalViewer));
        console.log(noLongerViewers);
        noLongerViewers.forEach(viewer => apiClient.revokeRole(documentId, versionId, viewer, 'viewer'));
        const newEditors = editors.filter(editor => !originalEditors.includes(editor));
        newEditors.forEach(editor => apiClient.grantRole(documentId, versionId, editor, 'editor'));
        const noLongerEditors = originalEditors.filter(originalEditor => !editors.includes(originalEditor));
        noLongerEditors.forEach(editor => apiClient.revokeRole(documentId, versionId, editor, 'editor'));
        const newReviewers = reviewers.filter(reviewer => !originalReviewers.includes(reviewer));
        newReviewers.forEach(reviewer => apiClient.grantRole(documentId, versionId, reviewer, 'reviewer'));
        const noLongerReviewers = originalReviewers.filter(originalReviewer => !reviewers.includes(originalReviewer));
        noLongerReviewers.forEach(reviewer => apiClient.revokeRole(documentId, versionId, reviewer, 'reviewer'));
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
        <Select isMulti value={viewersOptions} options={userOptions} onChange={setViewersOptions} />
        <Form.Label>Editors</Form.Label>
        <Select isMulti value={editorsOptions} options={userOptions} onChange={setEditorsOptions} />
        <Form.Label>Reviewers</Form.Label>
        <Select isMulti value={reviewersOptions} options={userOptions} onChange={setReviewersOptions} />
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
