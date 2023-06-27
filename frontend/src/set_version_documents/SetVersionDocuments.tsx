import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import ApiClient from '../api/ApiClient';
import DocumentVersion from '../models/DocumentVersion';
import Document from '../models/Document';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';

type DocumentsSetProps = {
  apiClient: ApiClient
};

const columns = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Name', accessor: 'name', sortable: true, sortByOrder: 'asc',  rowSpan: 2 },
  { label: 'Version', accessor: 'version', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc', rowSpan: 2 }
] as Column[]


export const SetVersionDocuments: FunctionComponent<DocumentsSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const versionSetId = searchParams.get('versionSetId') ?? undefined;

  const [docs, setDocs] = useState<Document[]>([])
  const [vers, setVers] = useState<DocumentVersion[]>([])

  useEffect(() => {
    if (documentSetId === undefined || versionSetId === undefined)
      return;
    apiClient.getSetVersions(documentSetId)
      .then(response => {
        response.forEach(
          setVersion => {
            if (setVersion.setVersionId === versionSetId) {
              setVersion.documentVersionIds.forEach(
                (pair, index) => {
                  apiClient.getDocument(pair[0]).then(doc => setDocs(oldDocs => [...oldDocs, doc]));
                  apiClient.getVersion(pair[0], pair[1]).then(ver => setVers(oldVers => [...oldVers, ver]))
                }
              )
            }
          }
        )
      });
  }, [apiClient, documentSetId, versionSetId]);

  const data = vers.map((ver: DocumentVersion, index: number) => ({
    index: index + 1,
    name: typeof docs[index] !== 'undefined' ? docs[index].documentName : '',
    version: ver.versionName,
    option: (
      <Button variant="outline-secondary" onClick={() => navigate(`/DocVer?documentId=${encodeURIComponent(ver.documentId)}&versionId=${encodeURIComponent(ver.versionId)}`)}>
        Check versions
      </Button>
    )
  }));

  return (
    <Container>
      <h3>
        Set Version Documents
      </h3>
        {(docs.length === vers.length) ? <SortedTable data={data} columns={columns} /> : null}
    </Container>
  );
}
export default SetVersionDocuments;