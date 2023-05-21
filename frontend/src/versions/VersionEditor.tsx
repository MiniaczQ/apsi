import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole, editableMemberRoles, memberRoles } from '../models/DocumentVersionMember';
import UpdateVersion from '../models/UpdateVersion';
import User from '../models/User';
import DocumentNameEditor from './DocumentNameEditor';
import RoleEditor from './RoleEditor';
import VersionContentEditor from './VersionContentEditor';


type VersionEditorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionEditor: FunctionComponent<VersionEditorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const versionId = searchParams.get('versionId') ?? undefined;
  const gotRequiredSearchParams = documentId !== undefined || versionId !== undefined;

  useEffect(() => {
    if (gotRequiredSearchParams)
      return;
    if (documentId !== undefined)
      navigate(`/Versions?documentId=${documentId}`);
    else
      navigate('/');
  }, [documentId, gotRequiredSearchParams, navigate])

  const [, setIsLoading] = useState(true);
  const [baseDocument, setBaseDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>();
  const [users, setUsers] = useState<User[]>();
  const [originalMembers, setOriginalMembers] = useState<DocumentVersionMember[]>();

  useEffect(() => {
    let usersPromise = apiClient.getUsers()
      .then(response => setUsers(response));
    let documentPromise = apiClient.getDocument(documentId!)
      .then(response => setBaseDocument(response));
    let versionsPromise = apiClient.getVersions(documentId!)
      .then(response => setVersions(response));
    let membersPromise = apiClient.getMembers(documentId!, versionId!)
      .then(response => setOriginalMembers(response));
    Promise.all([usersPromise, documentPromise, versionsPromise, membersPromise])
      .then(() => setIsLoading(false));
  }, [apiClient, documentId, versionId]);

  const baseVersion = versions?.find(version => version.versionId === versionId);
  const parents = baseVersion?.parents?.map(parentId => versions?.find(version => version.versionId === parentId));
  const parentNames = parents?.map(parent => parent?.versionName)?.filter(x => x !== undefined)?.join(', ');

  const [updatedVersion, setUpdatedVersion] = useState<UpdateVersion>();
  useEffect(() => {
    if (baseVersion === undefined)
      return;
    setUpdatedVersion({
      versionName: baseVersion.versionName,
      content: baseVersion.content,
    });
  }, [baseVersion]);


  const originalRoles: Record<DocumentVersionMemberRole, string[]> | undefined = useMemo(() => {
    if (originalMembers === undefined)
      return undefined;
    return Object.fromEntries(
      memberRoles.map(role => [
        role,
        originalMembers
          .filter(member => member.roles.includes(role))
          .map(member => member.userId)
      ])
    ) as Record<DocumentVersionMemberRole, string[]>;
  }, [originalMembers]);
  const [grantedRoles, setGrantedRoles] = useState<Record<DocumentVersionMemberRole, string[]>>();
  useEffect(() => setGrantedRoles(originalRoles), [originalRoles]);

  const parentVersionField = (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent versions</Form.Label>
      <Form.Control disabled type="text" value={parentNames ?? ''} />
      <Form.Label>Version name</Form.Label>
      <Form.Control disabled type="text" value={baseVersion?.versionName ?? ''} />
    </Form.Group>
  );

  const updateVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    if (documentId === undefined || versionId === undefined || updatedVersion === undefined)
      return;
    (evt.target as HTMLButtonElement).disabled = true;
    apiClient.updateVersion(documentId, versionId, updatedVersion)
      .then(() => {
        if (originalRoles === undefined || grantedRoles === undefined)
          return;
        editableMemberRoles.forEach(role => {
          const newMembers = grantedRoles[role].filter(member => !originalRoles[role].includes(member));
          const removedMembers = originalRoles[role].filter(member => !grantedRoles[role].includes(member));
          newMembers.forEach(member => apiClient.grantRole(documentId, versionId, member, role));
          removedMembers.forEach(member => apiClient.revokeRole(documentId, versionId, member, role));
        });
        navigate(`/Versions?documentId=${documentId}`);
      });
  };

  if (users === undefined || originalRoles === undefined || updatedVersion === undefined)
    return null;

  return (
    <>
      <DocumentNameEditor disabled defaultValue={baseDocument?.documentName ?? ''} />
      {parentVersionField}
      <RoleEditor options={users} defaultValue={originalRoles} onChange={userIdsPerRole => setGrantedRoles(userIdsPerRole)} />
      <VersionContentEditor defaultValue={updatedVersion.content} onChange={content => setUpdatedVersion({ ...updatedVersion, content })} />
      <Button onClick={updateVersion}>Modify</Button>
    </>
  );
}

export default VersionEditor;
