import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import ApiClient, { PermissionError } from '../api/ApiClient';
import DocumentVersion from '../models/DocumentVersion';
import Document from '../models/Document';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';
import DocumentSetVersion from '../models/DocumentSetVersion';
import DocumentSet from '../models/DocumentSet';

type DocumentsSetProps = {
  apiClient: ApiClient;
};

const columns = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Name', accessor: 'name', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Version', accessor: 'version', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
] as Column[];

export const SetVersionDocuments: FunctionComponent<DocumentsSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const versionSetId = searchParams.get('versionSetId') ?? undefined;
  const gotRequiredSearchParams = documentSetId !== undefined && versionSetId !== undefined;

  const navigateToSetVersionCreator = (setId: string, setVersionId: string) =>
    navigate(`/set-versions/new?documentSetId=${encodeURIComponent(setId)}&parentVersionId=${encodeURIComponent(setVersionId)}`);
  const navigateToSetVersionEditor = (setId: string, setVersionId: string) =>
    navigate(`/set-version/edit?documentSetId=${encodeURIComponent(setId)}&setVersionId=${encodeURIComponent(setVersionId)}`);

  useEffect(() => {
    if (gotRequiredSearchParams) return;
    if (documentSetId !== undefined) navigate(`/set-versions?documentSetId=${documentSetId}`);
    else navigate('/sets');
  }, [documentSetId, gotRequiredSearchParams, navigate]);

  const [documentSet, setDocumentSet] = useState<DocumentSet>();
  const [documentSetVersion, setDocumentSetVersion] = useState<DocumentSetVersion>();
  const [docs, setDocs] = useState<Document[]>([]);
  const [vers, setVers] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    if (!gotRequiredSearchParams) return;
    apiClient
      .getSetVersions(documentSetId)
      .then((response) => {
        const currentSetVersion = response.find((setVersion) => setVersion.setVersionId === versionSetId);
        if (currentSetVersion === undefined) throw new Error('No such version');
        setDocumentSetVersion(currentSetVersion);
      })
      .catch(() => {
        if (documentSetId !== undefined) navigate(`/set-versions?documentSetId=${documentSetId}`);
        else navigate('/sets');
      });
    apiClient
      .getSet(documentSetId)
      .then((result) => setDocumentSet(result))
  }, [apiClient, documentSetId, versionSetId, gotRequiredSearchParams, navigate]);

  const filterOutPermissionError = (e: Error) => {
    if (e instanceof PermissionError) return null;
    throw e;
  };

  useEffect(() => {
    if (documentSetVersion === undefined) return;
    const promises = documentSetVersion.documentVersionIds.map(([docId, verId]) => [
      apiClient.getDocument(docId).catch(filterOutPermissionError),
      apiClient.getVersion(docId, verId).catch(filterOutPermissionError),
    ]);
    Promise.all(promises.map(([docPromise]) => docPromise as Promise<Document>)).then(setDocs);
    Promise.all(promises.map(([, verPromise]) => verPromise as Promise<DocumentVersion>)).then(setVers);
  }, [apiClient, documentSetVersion]);

  const data = vers.map((ver: DocumentVersion, index: number) => ({
    index: index + 1,
    name: docs[index]?.documentName ?? 'Unknown document',
    version: ver?.versionName ?? 'Unknown version',
    option:
      docs[index] !== null && ver !== null ? (
        <Button
          variant="outline-secondary"
          onClick={() =>
            navigate(`/version?documentId=${encodeURIComponent(ver.documentId)}&versionId=${encodeURIComponent(ver.versionId)}`)
          }
        >
          Inspect
        </Button>
      ) : (
        <Button disabled variant="outline-danger">
          Inspect
        </Button>
      ),
  }));

  return (
    <Container>
      <h3>{documentSet?.documentSetName} {documentSetVersion?.setVersionName}</h3>
      {docs.length === vers.length ? <SortedTable data={data} columns={columns} /> : null}
      <Button
        className="ms-3"
        variant="outline-primary"
        onClick={() => navigateToSetVersionCreator(documentSetId!, versionSetId!)}
      >
        Create new document set version
      </Button>
      <Button
        className="ms-3"
        variant="outline-primary"
        onClick={() => navigateToSetVersionEditor(documentSetId!, versionSetId!)}
      >
        Modify
      </Button>
    </Container>
  );
};
export default SetVersionDocuments;
