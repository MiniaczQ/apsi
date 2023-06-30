import { FunctionComponent, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ApiClient from '../api/ApiClient';

import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import { Form } from 'react-bootstrap';

import DocumentSetVersion from '../models/DocumentSetVersion';
import SetDocumentVersion from '../models/SetDocumentVersion';

type VersionCreatorProps = {
  apiClient: ApiClient;
};

export const SetEditor: FunctionComponent<VersionCreatorProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const setVersionId = searchParams.get('setVersionId') ?? undefined;
  const gotRequiredSearchParams = documentSetId !== undefined && setVersionId !== undefined;

  useEffect(() => {
    if (gotRequiredSearchParams) return;
    if (documentSetId !== undefined) navigate(`/set-versions?documentSetId=${documentSetId}`);
    else navigate('/sets');
  }, [documentSetId, gotRequiredSearchParams, navigate]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [versions, setVersions] = useState<{ [key: string]: DocumentVersion[] }>({});
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const [documentSetVersions, setDocumentSetVersions] = useState<DocumentSetVersion[]>();
  const [editedDocumentVersionIds, setEditedDocumentVersionIds] = useState<[string, string][]>([]);

  useEffect(() => {
    if (documentSetId === undefined) return;
    apiClient.getDocuments().then((response) => {
      setDocuments(response);
      Promise.all(
        response.map((document) =>
          apiClient.getVersions(document.documentId).then((versionsResponse) => [document.documentId, versionsResponse])
        )
      ).then((versionsPerDocument) => setVersions(Object.fromEntries(versionsPerDocument)));
    });
    apiClient.getSetVersions(documentSetId).then(setDocumentSetVersions);
  }, [apiClient, documentSetId]);

  const documentSetVersion = documentSetVersions?.find((version) => version.setVersionId === setVersionId);

  useEffect(() => {
    if (documentSetVersion === undefined) return;
    setEditedDocumentVersionIds(documentSetVersion.documentVersionIds.map((x) => [...x]));
  }, [documentSetVersion, setEditedDocumentVersionIds]);

  const parents = documentSetVersion?.parents?.map((parentId) =>
    documentSetVersions?.find((version) => version.setVersionId === parentId)
  );
  const parentNames = parents
    ?.map((parent) => parent?.setVersionName)
    ?.filter((x) => x !== undefined)
    ?.join(', ');

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
    setEditedDocumentVersionIds([...editedDocumentVersionIds, [selectedDocumentId, selectedVersionId]]);
    setSelectedDocumentId('');
    setSelectedVersionId('');
  };

  const handleRemoveElement = (removedDocumentId: string) => {
    setEditedDocumentVersionIds(editedDocumentVersionIds.filter(([documentId, versionId]) => documentId !== removedDocumentId));
  };

  const modifySetVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    if (documentSetVersion === undefined) return;
    (evt.target as HTMLButtonElement).disabled = true;

    const documentsToRemove: string[] = documentSetVersion.documentVersionIds
      .filter(
        ([originalDocumentId]) => editedDocumentVersionIds.find(([documentId]) => documentId === originalDocumentId) === undefined
      )
      .map(([documentId]) => documentId);
    const documentVersionsToAdd: SetDocumentVersion[] = editedDocumentVersionIds
      .filter(
        ([documentId]) =>
          documentSetVersion.documentVersionIds.find(([originalDocumentId]) => originalDocumentId === documentId) === undefined
      )
      .map(([documentId, versionId]) => ({ documentId, versionId }));

    await Promise.all(
      documentsToRemove.map((documentId) =>
        apiClient.removeDocumentFromSetVersion(documentSetVersion.documentSetId, documentSetVersion.setVersionId, documentId)
      )
    );
    await Promise.all(
      documentVersionsToAdd.map((addedData) =>
        apiClient.addDocumentToSetVersion(documentSetVersion.documentSetId, documentSetVersion.setVersionId, addedData)
      )
    );

    navigate(`/set-version?documentSetId=${documentSetId}&versionSetId=${setVersionId}`);
  };

  const parentVersionField = (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent versions</Form.Label>
      <Form.Control disabled type="text" value={parentNames ?? ''} />
      <Form.Label>Version name</Form.Label>
      <Form.Control disabled type="text" value={documentSetVersion?.setVersionName ?? ''} />
    </Form.Group>
  );

  if (documentSetVersions === undefined || documentSetVersion === undefined) return null;

  const documentSelector = (
    <select value={selectedDocumentId} onChange={handleDocumentChange}>
      <option value="" disabled>
        Select document
      </option>
      {documents
        .filter(({ documentId }) => editedDocumentVersionIds.find(([docId]) => docId === documentId) === undefined)
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
      {parentVersionField}
      <div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {documentSelector}
          {versionSelector}
          <button onClick={handleAddElement}>Add element</button>
        </div>

        <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
          <thead>{tableHeadingRow}</thead>
          <tbody>{editedDocumentVersionIds.map(makeElementRow)}</tbody>
        </table>
      </div>

      <Button style={{ marginTop: '20px' }} onClick={modifySetVersion}>
        Save
      </Button>
    </>
  );
};

export default SetEditor;
