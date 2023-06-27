import { FunctionComponent, useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient, { ConcurrencyConflict } from '../api/ApiClient';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole, editableMemberRoles } from '../models/DocumentVersionMember';
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
  const gotRequiredSearchParams = documentId !== undefined && versionId !== undefined;

  useEffect(() => {
    if (gotRequiredSearchParams)
      return;
    if (documentId !== undefined)
      navigate(`/Versions?documentId=${documentId}`);
    else
      navigate('/');
  }, [documentId, gotRequiredSearchParams, navigate]);

  const [error, setError] = useState<string>();
  const isErrorSet = (error?.length ?? 0) > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [conflictVersion, setConflictVersion] = useState<UpdateVersion>();
  useEffect(() => {
    if (baseVersion === undefined)
      return;
    setUpdatedVersion({
      content: baseVersion.content,
      updatedAt: baseVersion.updatedAt,
    });
  }, [baseVersion]);

  const [grantedRoles, setGrantedRoles] = useState<Record<DocumentVersionMemberRole, string[]>>();
  const [revokedRoles, setRevokedRoles] = useState<Record<DocumentVersionMemberRole, string[]>>();

  const parentVersionField = (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent versions</Form.Label>
      <Form.Control disabled type="text" value={parentNames ?? ''} />
      <Form.Label>Version name</Form.Label>
      <Form.Control disabled type="text" value={baseVersion?.versionName ?? ''} />
    </Form.Group>
  );

  const updateVersion = async () => {
    if (documentId === undefined || versionId === undefined || updatedVersion === undefined)
      return;
    setError(undefined);
    setConflictVersion(undefined);
    setIsSubmitting(true);
    try {
      await apiClient.updateVersion(documentId, versionId, updatedVersion);
      if (grantedRoles !== undefined && revokedRoles !== undefined) {
        editableMemberRoles.forEach(role => {
          grantedRoles[role].forEach(member => apiClient.grantRole(documentId, versionId, member, role));
          revokedRoles[role].forEach(member => apiClient.revokeRole(documentId, versionId, member, role));
        });
      }
      navigate(`/Versions?documentId=${documentId}`);
    } catch (e) {
      setIsSubmitting(false);
      const prefix = 'Error modifying version: ';
      if (e instanceof ConcurrencyConflict) {
        const anotherVersion = e.value as DocumentVersion;
        setConflictVersion(anotherVersion);
        setUpdatedVersion({ ...updatedVersion, updatedAt: anotherVersion.updatedAt });
        setError(prefix + 'another modification has been submitted! Compare changes and resubmit.');
      } else {
        setError(prefix + ((e as Error)?.message ?? e?.toString() ?? 'Unknown error. Try again.'));
      }
    }
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    try {
      await updateVersion();
    } catch (e) {
      console.error(e);
      (evt.target as HTMLButtonElement).disabled = false;
    }
  };

  if (users === undefined || originalMembers === undefined || updatedVersion === undefined)
    return null;

  return (<>
    <Alert variant="danger" show={isErrorSet} onClose={() => setError(undefined)} dismissible>
      {error}
    </Alert>
    <Form>
      <DocumentNameEditor disabled defaultValue={baseDocument?.documentName ?? ''} />
      {parentVersionField}
      <RoleEditor options={users} defaultValue={originalMembers} onChange={(granted, revoked) => { setGrantedRoles(granted); setRevokedRoles(revoked); }} />
      {conflictVersion !== undefined
        ? <VersionContentEditor disabled name={'Conflicting content'} value={conflictVersion.content} />
        : <></>}
      <VersionContentEditor defaultValue={updatedVersion.content} onChange={content => setUpdatedVersion({ ...updatedVersion, content })} />
      <Button disabled={isSubmitting} onClick={handleClick}>Modify</Button>
    </Form>
  </>);
}

export default VersionEditor;
