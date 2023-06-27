import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Form, useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient, { ConcurrencyConflict } from '../api/ApiClient';
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
  loginState: LoginState;
  apiClient: ApiClient;
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
    if (gotRequiredSearchParams) return;
    if (documentId !== undefined) navigate(`/Versions?documentId=${documentId}`);
    else navigate(`/`);
  }, [documentId, gotRequiredSearchParams, navigate]);

  const [error, setError] = useState<string>();
  const isErrorSet = (error?.length ?? 0) > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsLoading] = useState(true);

  const [document, setDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>();
  const [users, setUsers] = useState<User[]>();

  useEffect(() => {
    let usersPromise = apiClient.getUsers().then((response) => setUsers(response));
    let promises = [usersPromise];
    if (isCreatingNewVersion) {
      let documentPromise = apiClient.getDocument(documentId).then((response) => setDocument(response));
      let versionsPromise = apiClient.getVersions(documentId).then((response) => setVersions(response));
      promises = [...promises, documentPromise, versionsPromise];
    }
    Promise.all(promises).then(() => setIsLoading(false));
  }, [apiClient, isCreatingNewVersion, documentId, parentVersionId]);

  const parentVersion = versions?.find((version) => version.versionId === parentVersionId);
  const versionsMinusParent = versions?.filter(({ versionId }) => versionId !== parentVersionId);
  useEffect(() => {
    if (parentVersion === undefined) return;
    setCreatedVersion((createdVersion) => ({
      ...createdVersion,
      content: createdVersion.content.length > 0 ? createdVersion.content : parentVersion.content,
      parents: createdVersion.parents.length > 0 ? createdVersion.parents : [parentVersion.versionId],
    }));
  }, [parentVersion]);

  const [createdDocument, setCreatedDocument] = useState<CreateDocument>({
    documentName: '',
    initialVersion: {
      versionName: '1',
      content: '',
    },
  });
  const [createdVersion, setCreatedVersion] = useState<CreateVersion>({
    versionName: '1',
    content: '',
    parents: [],
  });

  const defaultRoles: DocumentVersionMember[] | undefined = useMemo(() => {
    if (loginState.userId === undefined || loginState.username === undefined) return undefined;
    return [{ userId: loginState.userId, username: loginState.username, roles: ['owner'] }];
  }, [loginState]);
  const [grantedRoles, setGrantedRoles] = useState<Record<DocumentVersionMemberRole, string[]>>();

  const createVersion = async () => {
    setError(undefined);
    setIsSubmitting(true);
    let creationPromise;
    if (documentId === undefined) {
      let doc = { ...createdDocument };
      doc.initialVersion.content = createdVersion.content;
      creationPromise = apiClient.createDocument(doc).then((response) => response.initialVersion);
    } else {
      creationPromise = apiClient.createVersion(documentId, createdVersion);
    }
    try {
      const response = await creationPromise;
      if (grantedRoles !== undefined) {
        editableMemberRoles.forEach((role) =>
          grantedRoles[role].forEach((member) => apiClient.grantRole(response.documentId, response.versionId, member, role))
        );
      }
      navigate(`/Versions?documentId=${response.documentId}`);
    } catch (e) {
      setIsSubmitting(false);
      const prefix = isCreatingNewVersion
        ? 'Error while creating a new version: '
        : isCreatingNewDocument
        ? 'Error while creating a new document: '
        : 'Error: ';
      if (e instanceof ConcurrencyConflict) {
        if (isCreatingNewVersion) {
          setError(prefix + 'chosen version name is already taken! Resubmit with another version name.');
          setVersions(await apiClient.getVersions(documentId));
        }
        if (isCreatingNewDocument) {
          setError(prefix + 'chosen document name is already taken! Resubmit with another document name.');
        }
      } else {
        setError(prefix + ((e as Error)?.message ?? e?.toString() ?? 'Unknown error. Try again.'));
      }
    }
  };

  const changeVersion = useCallback(
    (versionName: string) => setCreatedVersion((createdVersion) => ({ ...createdVersion, versionName })),
    []
  );

  const rolesDefined = users !== undefined && defaultRoles !== undefined;
  const parentVersionDefined = versions !== undefined && versionsMinusParent !== undefined && parentVersion !== undefined;

  return rolesDefined && (isCreatingNewDocument || (isCreatingNewVersion && parentVersionDefined)) ? (
    <>
      <Alert variant="danger" show={isErrorSet} onClose={() => setError(undefined)} dismissible>
        {error}
      </Alert>
      <Form>
        <DocumentNameEditor
          disabled={parentVersionId !== undefined}
          defaultValue={document?.documentName}
          onChange={(documentName) => setCreatedDocument({ ...createdDocument, documentName })}
        />
        <RoleEditor options={users} defaultValue={defaultRoles} onChange={(userIdsPerRole) => setGrantedRoles(userIdsPerRole)} />
        {isCreatingNewVersion && parentVersionDefined ? (
          <>
            <VersionNameChooser versions={versions} parentVersion={parentVersion} onChange={changeVersion} />
            <VersionMergingOptions
              versions={versionsMinusParent}
              onChange={(parents) => setCreatedVersion({ ...createdVersion, parents: [parentVersion.versionId, ...parents] })}
            />
          </>
        ) : (
          <></>
        )}
        <VersionContentEditor
          defaultValue={parentVersion?.content}
          onChange={(content) => setCreatedVersion({ ...createdVersion, content })}
        />
        <Button disabled={isSubmitting} className="w-100" type="submit" onClick={createVersion}>
          Create
        </Button>
      </Form>
    </>
  ) : (
    <></>
  );
};

export default VersionCreator;
