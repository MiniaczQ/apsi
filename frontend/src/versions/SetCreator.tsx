import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

import ApiClient from '../api/ApiClient';

import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import SetNameEditor from './SetNameEditor';
import CreateSet from '../models/CreateSet';
import CreateSetVersion from '../models/CreateSetVersion';

import Set from '../models/Set';
import SetVersion from '../models/SetVersion';
import SetVersionNameChooser from './SetVersionNameChooser';

type VersionCreatorProps = {
  apiClient: ApiClient;
};

export const SetCreator: FunctionComponent<VersionCreatorProps> = ({ apiClient }) => {
  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;
  const isCreatingNewDocument = documentSetId === undefined && parentVersionId === undefined;
  const isCreatingNewVersion = documentSetId !== undefined && parentVersionId !== undefined;

  const [, setIsLoading] = useState(true);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [version, setVersion] = useState<DocumentVersion[]>([]);
  const [tableData, setTableData] = useState<[string, string][]>([]);
  const [tableData1, setTableData1] = useState<[string, string][]>([]);

  const [documentsets, setdocumentSets] = useState<Set[]>();
  const [documentSetVersion, setSetVersion] = useState<SetVersion[]>();

  useEffect(() => {
    let usersPromise = apiClient.getDocuments().then((response) => setDocuments(response));
    let promises = [usersPromise];
    if (isCreatingNewVersion) {
      let setsPromise = apiClient.getSetSet().then((response) => setdocumentSets(response));

      let docsetsPromise = apiClient.getSetVersionsSet(documentSetId).then((response) => setSetVersion(response));
      promises = [...promises, setsPromise, docsetsPromise];
    }
    Promise.all(promises).then(() => setIsLoading(false));
  }, [apiClient, isCreatingNewVersion, documentSetId]);

  const parentVersion = documentSetVersion?.find((version) => version.setVersionId === parentVersionId);

  const parentSet = documentsets?.find((set) => set.documentSetId === documentSetId);

  useEffect(() => {
    if (parentVersion === undefined) return;

    setCreatedVersion((createdVersion) => ({
      ...createdVersion,
      parents: [parentVersion.setVersionId],
    }));

    if (isCreatingNewVersion) {
      setSet(parentSet);
    }
  }, [isCreatingNewVersion, parentSet, parentVersion]);

  const [set, setSet] = useState<Set>();

  const [createdSet, setCreatedSet] = useState<CreateSet>({
    documentSetName: 'frontendowy',
    initialVersion: {
      setVersionName: '1',
      documentVersionIds: [],
    },
  });
  const [createdVersion, setCreatedVersion] = useState<CreateSetVersion>({
    setVersionName: '1',
    documentVersionIds: [],
    parents: [],
  });

  const changeVersion = useCallback(
    (setVersionName: string) => setCreatedVersion((createdVersion) => ({ ...createdVersion, setVersionName })),
    []
  );

  const docs = {
    documentId: '',
    versionId: '',
  };

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    apiClient.getDocuments().then((response) => {
      const filteredResponse = response.filter((item) => {
        return !tableData.some((tableItem) => tableItem[0] === item.documentName);
      });

      setDocuments(filteredResponse);
    });

    const selectedId = event.target.value;
    setSelectedDocumentId(selectedId);

    if (selectedId !== '') {
      try {
        const response = await apiClient.getVersions(selectedId);
        setVersion(response);
      } catch (error) {
        console.error('Błąd pobierania wersji dokumentu:', error);
      }
    } else {
      setVersion([]);
    }
  };

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (selectedDocumentId !== '') {
      const selectedVersion = event.target.value;

      setSelectedVersionId(selectedVersion);
    } else {
      setSelectedVersionId('');
      setVersion([]);
    }
  };

  const handleAddElement = () => {
    apiClient.getDocuments().then((response) => {
      const filteredResponse = response.filter((item) => {
        return !tableData.some((tableItem) => tableItem[0] === item.documentName);
      });

      setDocuments(filteredResponse);
    });

    if (selectedDocumentId) {
      const selectedDocument = documents.find((doc) => doc.documentId === selectedDocumentId);
      const selectedVersion = version.find((ver) => ver.versionId === selectedVersionId);

      if (selectedDocument && selectedVersion) {
        const newData: [string, string] = [selectedDocument.documentName, selectedVersion.versionName];
        setTableData((prevData) => [...prevData, newData]);

        const newData1: [string, string] = [selectedDocument.documentId, selectedVersion.versionId];
        setTableData1((prevData) => [...prevData, newData1]);
      }
    }

    setSelectedDocumentId('');
    setSelectedVersionId('');
  };

  const handleDelete = (index: number) => {
    const updatedTableData = [...tableData];
    updatedTableData.splice(index, 1);
    setTableData(updatedTableData);

    const updatedTableData1 = [...tableData1];
    updatedTableData1.splice(index, 1);
    setTableData1(updatedTableData1);
  };

  const createVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    let creationPromise;
    if (documentSetId === undefined) {
      let doc = createdSet;

      creationPromise = apiClient.createSet(doc).then((response) => response.initialVersion);
    } else {
      setCreatedVersion((createdVersion) => ({
        ...createdVersion,
        documentVersionIds: tableData1,
      }));

      console.log(documentSetId);
      console.log(createdVersion);
      creationPromise = apiClient.createSetVersion(documentSetId, createdVersion);
      console.log(creationPromise);
    }
    creationPromise.then((version) => {
      if (tableData1 === undefined) return version;
      tableData1.forEach((member) => {
        docs.documentId = member[0];
        docs.versionId = member[1];

        apiClient.addDocumentVersion(version.documentSetId, version.setVersionId, docs);
      });

      return version;
    });
  };

  if (isCreatingNewDocument) {
    return (
      <>
        <SetNameEditor
          disabled={parentVersionId !== undefined}
          defaultValue={set?.documentSetName}
          onChange={(documentSetName) => setCreatedSet({ ...createdSet, documentSetName })}
        />

        <div>
          <div>
            <select value={selectedDocumentId} onChange={handleDocumentChange}>
              <option value="">Wybierz dokument</option>
              {documents.map((document) => (
                <option key={document.documentId} value={document.documentId}>
                  {document.documentName}
                </option>
              ))}
            </select>

            <select value={selectedVersionId} onChange={handleVersionChange}>
              <option value="">Wybierz wersję</option>
              {version.map((version) => (
                <option key={version.versionId} value={version.versionId}>
                  {version.versionName}
                </option>
              ))}
            </select>

            <button onClick={handleAddElement}>Dodaj element</button>
          </div>

          {tableData.length > 0 && (
            <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th>Nr</th>
                  <th>Plik</th>
                  <th>Wersja</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((data, index) => (
                  <tr key={index}>
                    <td>{index}</td>
                    <td>{data[0]}</td>
                    <td>{data[1]}</td>
                    <td>
                      {' '}
                      <button onClick={() => handleDelete(index)}>Usuń</button>{' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Button style={{ marginTop: '20px' }} onClick={createVersion}>
          Create
        </Button>
      </>
    );
  }

  if (documentSetVersion === undefined || parentVersion === undefined) return null;

  return (
    <>
      <SetNameEditor
        disabled={parentVersionId !== undefined}
        defaultValue={set?.documentSetName}
        onChange={(documentSetName) => setCreatedSet({ ...createdSet, documentSetName })}
      />
      <SetVersionNameChooser versions={documentSetVersion} parentVersion={parentVersion} onChange={changeVersion} />

      <div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={selectedDocumentId} onChange={handleDocumentChange}>
            <option value="">Wybierz dokument</option>
            {documents.map((document) => (
              <option key={document.documentId} value={document.documentId}>
                {document.documentName}
              </option>
            ))}
          </select>

          <select value={selectedVersionId} onChange={handleVersionChange}>
            <option value="">Wybierz wersję</option>
            {version.map((version) => (
              <option key={version.versionId} value={version.versionId}>
                {version.versionName}
              </option>
            ))}
          </select>

          <button onClick={handleAddElement}>Dodaj element</button>
        </div>

        {tableData.length > 0 && (
          <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Nr</th>
                <th>Plik</th>
                <th>Wersja</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((data, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{data[0]}</td>
                  <td>{data[1]}</td>
                  <td>
                    {' '}
                    <button onClick={() => handleDelete(index)}>Usuń</button>{' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Button style={{ marginTop: '20px' }} onClick={createVersion}>
        Create
      </Button>
    </>
  );
};

export default SetCreator;
