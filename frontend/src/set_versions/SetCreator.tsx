import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ApiClient from '../api/ApiClient';

import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import SetNameEditor from './SetNameEditor';
import CreateSet from '../models/CreateSet';
import CreateSetVersion from '../models/CreateSetVersion';

import DocumentSet from '../models/DocumentSet';
import DocumentSetVersion from '../models/DocumentSetVersion';
import SetVersionNameChooser from './SetVersionNameChooser';

type VersionCreatorProps = {
  apiClient: ApiClient;
};

const SetCreator: FunctionComponent<VersionCreatorProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;
  const isCreatingNewSet = documentSetId === undefined && parentVersionId === undefined;
  const isCreatingNewVersion = documentSetId !== undefined && parentVersionId !== undefined;
  const gotRequiredSearchParams = isCreatingNewSet || isCreatingNewVersion;

  useEffect(() => {
    if (gotRequiredSearchParams) return;
    if (documentSetId !== undefined) navigate(`/set-versions?documentSetId=${documentSetId}`);
    else navigate('/sets');
  }, [documentSetId, gotRequiredSearchParams, navigate]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [versions, setVersions] = useState<{ [key: string]: DocumentVersion[] }>({});
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const [documentSets, setDocumentSets] = useState<DocumentSet[]>();
  const [documentSetVersions, setDocumentSetVersions] = useState<DocumentSetVersion[]>();
  const [createdSet, setCreatedSet] = useState<CreateSet>({
    documentSetName: '',
    initialVersion: {
      setVersionName: '1',
      documentVersionIds: [],
    },
  });
  const [createdSetVersion, setCreatedSetVersion] = useState<CreateSetVersion>({
    setVersionName: '',
    documentVersionIds: [],
    parents: [],
  });

  const changeVersion = useCallback(
    (setVersionName: string) => setCreatedSetVersion((createdVersion) => ({ ...createdVersion, setVersionName })),
    []
  );

  useEffect(() => {
    apiClient.getDocuments().then((response) => {
      setDocuments(response);
      Promise.all(
        response.map((document) =>
          apiClient.getVersions(document.documentId).then((versionsResponse) => [document.documentId, versionsResponse])
        )
      ).then((versionsPerDocument) => setVersions(Object.fromEntries(versionsPerDocument)));
    });
    apiClient.getSets().then(setDocumentSets);
    if (documentSetId === undefined) return;
    apiClient.getSetVersions(documentSetId).then(setDocumentSetVersions);
  }, [apiClient, documentSetId]);

  const parentSet = documentSets?.find((set) => set.documentSetId === documentSetId);
  const parentSetVersion = documentSetVersions?.find((version) => version.setVersionId === parentVersionId);

  useEffect(() => {
    if (parentSetVersion === undefined) return;
    setCreatedSetVersion((version) => ({
      ...version,
      documentVersionIds: parentSetVersion.documentVersionIds.map((x) => [...x]),
      parents: [parentSetVersion.setVersionId],
    }));
  }, [parentSetVersion, setCreatedSetVersion]);

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    setSelectedDocumentId(selectedId);
    setSelectedVersionId('');
  };

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVersion = event.target.value;
    setSelectedVersionId(selectedVersion);
  };

  const handleAddElement = () => {
    if (selectedDocumentId === '' || selectedVersionId === '') return;
    setCreatedSetVersion({
      ...createdSetVersion,
      documentVersionIds: [...createdSetVersion.documentVersionIds, [selectedDocumentId, selectedVersionId]],
    });
    setSelectedDocumentId('');
    setSelectedVersionId('');
  };

  const handleRemoveElement = (removedDocumentId: string) => {
    setCreatedSetVersion({
      ...createdSetVersion,
      documentVersionIds: createdSetVersion.documentVersionIds.filter(([documentId]) => documentId !== removedDocumentId),
    });
  };

  const createSetVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    if (documentSetId === undefined) return;
    (evt.target as HTMLButtonElement).disabled = true;
    const createdVersion = await apiClient.createSetVersion(documentSetId, createdSetVersion);
    navigate(`/set-version?documentSetId=${createdVersion.documentSetId}&versionSetId=${createdVersion.setVersionId}`);
  };

  const createSet: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    const createdDocument = await apiClient.createSet({
      ...createdSet,
      initialVersion: { ...createdSet.initialVersion, documentVersionIds: createdSetVersion.documentVersionIds },
    });
    const createdVersion = createdDocument.initialVersion;
    navigate(`/set-version?documentSetId=${createdVersion.documentSetId}&versionSetId=${createdVersion.setVersionId}`);
  };

  const documentSelector = (
    <select value={selectedDocumentId} onChange={handleDocumentChange}>
      <option value="" disabled>
        Select document
      </option>
      {documents
        .filter(({ documentId }) => createdSetVersion.documentVersionIds.find(([docId]) => docId === documentId) === undefined)
        .map((document) => (
          <option key={document.documentId} value={document.documentId}>
            {document.documentName}
          </option>
        ))}
    </select>
  );

  const versionSelector = (
    <select value={selectedVersionId} onChange={handleVersionChange}>
      <option value="" disabled>
        Select version
      </option>
      {selectedDocumentId !== '' ? (
        versions[selectedDocumentId]?.map((version) => (
          <option key={version.versionId} value={version.versionId}>
            {version.versionName}
          </option>
        ))
      ) : (
        <></>
      )}
    </select>
  );

  const tableHeadingRow = (
    <tr>
      <th>#</th>
      <th>Document</th>
      <th>Version</th>
      <th>Actions</th>
    </tr>
  );

  const makeElementRow = (data: [string, string], index: number) => (
    <tr key={data[0]}>
      <td>{index + 1}</td>
      <td>{documents.find(({ documentId }) => documentId === data[0])?.documentName}</td>
      <td>{versions[data[0]]?.find(({ versionId }) => versionId === data[1])?.versionName}</td>
      <td>
        {' '}
        <button onClick={() => handleRemoveElement(data[0])}>Remove</button>{' '}
      </td>
    </tr>
  );

  return (
    <>
      <SetNameEditor
        key={parentSet?.documentSetId ?? ''}
        disabled={parentVersionId !== undefined}
        defaultValue={parentSet?.documentSetName}
        onChange={(documentSetName) => setCreatedSet({ ...createdSet, documentSetName })}
      />
      {isCreatingNewVersion && documentSetVersions !== undefined && parentSetVersion !== undefined ? (
        <SetVersionNameChooser versions={documentSetVersions} parentVersion={parentSetVersion} onChange={changeVersion} />
      ) : (
        <></>
      )}

      <div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {documentSelector}
          {versionSelector}
          <button onClick={handleAddElement}>Add element</button>
        </div>
        <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
          <thead>{tableHeadingRow}</thead>
          <tbody>{createdSetVersion.documentVersionIds.map(makeElementRow)}</tbody>
        </table>
      </div>

      <Button
        style={{ marginTop: '20px' }}
        onClick={isCreatingNewSet ? createSet : isCreatingNewVersion ? createSetVersion : undefined}
      >
        Create {isCreatingNewSet ? 'a set' : isCreatingNewVersion ? 'a version' : undefined}
      </Button>
    </>
  );
};

export default SetCreator;
