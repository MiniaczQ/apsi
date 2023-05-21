import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient from '../api/ApiClient';
import CreateDocument from '../models/CreateDocument';
import CreateVersion from '../models/CreateVersion';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import User from '../models/User';
import VersionMergingOptions from './VersionMergingOptions';
import VersionNameChooser from './VersionNameChooser';
import VersionContentEditor from './VersionContentEditor';
import RoleEditor from './RoleEditor';
import DocumentNameEditor from './DocumentNameEditor';
import DocumentVersionMember, { DocumentVersionMemberRole, editableMemberRoles } from '../models/DocumentVersionMember';


type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;
  const isCreatingNewDocument = documentId === undefined && parentVersionId === undefined;
  const isCreatingNewVersion = documentId !== undefined && parentVersionId !== undefined;
  const gotRequiredSearchParams = isCreatingNewDocument || isCreatingNewVersion;

  useEffect(() => {
    if (gotRequiredSearchParams)
      return;
    if (documentId !== undefined)
      navigate(`/Versions?documentId=${documentId}`);
    else
      navigate(`/`);
  }, [documentId, gotRequiredSearchParams, navigate]);

  const [, setIsLoading] = useState(true);
  const [document, setDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>();
  const [users, setUsers] = useState<User[]>();

  useEffect(() => {
    let usersPromise = apiClient.getUsers()
      .then(response => setUsers(response));
    let promises = [usersPromise];
    if (isCreatingNewVersion) {
      let documentPromise = apiClient.getDocument(documentId)
        .then(response => setDocument(response));
      let versionsPromise = apiClient.getVersions(documentId)
        .then(response => setVersions(response));
      promises = [...promises, documentPromise, versionsPromise];
    }
    Promise.all(promises)
      .then(() => setIsLoading(false));
  }, [apiClient, isCreatingNewVersion, documentId, parentVersionId]);

  const parentVersion = versions?.find(version => version.versionId === parentVersionId);
  const versionsMinusParent = versions?.filter(({ versionId }) => versionId !== parentVersionId);

  const [createdDocument, setCreatedDocument] = useState<CreateDocument>({
    documentName: '',
    initialVersion: {
      versionName: '1',
      content: '',
    }
  });
  const [createdVersion, setCreatedVersion] = useState<CreateVersion>({
    versionName: '1',
    content: '',
    parents: [],
  });

  const defaultRoles: DocumentVersionMember[] | undefined = useMemo(() => {
    if (loginState.userId === undefined || loginState.username === undefined)
      return undefined;
    return [
      { userId: loginState.userId, username: loginState.username, roles: ['owner'] },
    ];
  }, [loginState]);
  const [grantedRoles, setGrantedRoles] = useState<Record<DocumentVersionMemberRole, string[]> | undefined>();

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
      if (grantedRoles === undefined)
        return;
      editableMemberRoles.forEach(
        role => grantedRoles[role]
          .forEach(member => apiClient.grantRole(version.documentId, version.versionId, member, role))
      );
      navigate(`/Versions?documentId=${version.documentId}`);
    });
  };


  if (users === undefined || defaultRoles === undefined)
    return null;

  if (isCreatingNewDocument)
    return (<>
      <DocumentNameEditor disabled={parentVersionId !== undefined} defaultValue={document?.documentName} onChange={documentName => setCreatedDocument({ ...createdDocument, documentName })} />
      <RoleEditor options={users} defaultValue={defaultRoles} onChange={userIdsPerRole => setGrantedRoles(userIdsPerRole)} />
      <VersionContentEditor defaultValue={parentVersion?.content} onChange={content => setCreatedVersion({ ...createdVersion, content })} />
      <Button onClick={createVersion}>Create</Button>
    </>);

  if (versions === undefined || versionsMinusParent === undefined || parentVersion === undefined)
    return null;

  return (<>
    <DocumentNameEditor disabled={parentVersionId !== undefined} defaultValue={document?.documentName} onChange={documentName => setCreatedDocument({ ...createdDocument, documentName })} />
    <RoleEditor options={users} defaultValue={defaultRoles} onChange={userIdsPerRole => setGrantedRoles(userIdsPerRole)} />
    <VersionNameChooser versions={versions} parentVersion={parentVersion} onChange={versionName => setCreatedVersion({ ...createdVersion, versionName })} />
    <VersionMergingOptions versions={versionsMinusParent} onChange={parents => setCreatedVersion({ ...createdVersion, parents: [parentVersion.versionId, ...parents] })} />
    <VersionContentEditor defaultValue={parentVersion?.content} onChange={content => setCreatedVersion({ ...createdVersion, content })} />
    <Button onClick={createVersion}>Create</Button>
  </>);
}

export default VersionCreator;
