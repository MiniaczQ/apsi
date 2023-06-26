import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Badge, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import { StateBadge } from '../models/StateBadge';
import { DocumentVersion, DocumentVersionState, DocumentVersionStateMap } from '../models/DocumentVersion';
import { Column } from '../table/TableBody';
import { SortedTable } from '../table/SortedTable';


type VersionsProps = {
  apiClient: ApiClient
};

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

const columns = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc'},
  { label: 'Version', accessor: 'version', sortable: true, sortByOrder: 'asc'},
  { label: 'State', accessor: 'state', sortable: false, sortByOrder: 'asc'},
  { label: 'Created', accessor: 'created', sortable: true, sortByOrder: 'asc'}, 
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc'}   
] as Column[]

export const Versions: FunctionComponent<VersionsProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;

  const [document, setDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    if (documentId === undefined)
      return;
    apiClient.getDocument(documentId)
      .then(response => setDocument(response));
    apiClient.getVersions(documentId)
      .then(response => { setVersions(response) });
  }, [apiClient, documentId]);

  function compareVersions(a: DocumentVersion, b: DocumentVersion): number {
    // MIND THE MINUS, WE WANT THE NEWEST TO APPEAR ON TOP
    return -String(a.versionName).localeCompare(b.versionName, undefined, { numeric: true, sensitivity: 'base' });
  }

  const versionRows = versions?.sort(compareVersions).map(({ documentId, versionId, versionName, versionState, createdAt }: DocumentVersion) =>
    <tr key={versionId}>
      <td>
        {versionName}
        <StateBadge state={versionState}/>
      </td>
      <td>
        {getFormattedDate(createdAt)}
      </td>
      <td>
        <Button variant="outline-secondary"
          onClick={() => navigate(`/DocVer?documentId=${encodeURIComponent(documentId)}&versionId=${encodeURIComponent(versionId)}`)}
        >
          Inspect version
        </Button>
      </td>
    </tr>
  );

   const data: any[] =versions?.sort(compareVersions).map(({ documentId, versionId, versionName, versionState, createdAt }: DocumentVersion, index: number) => ({
      index: index + 1,
      version: versionName,
      state: getStateBadge(versionState),
      created: getFormattedDate(createdAt),
      option: (<Button variant="outline-secondary" onClick={() => navigate(`/DocVer?documentId=${encodeURIComponent(documentId)}&versionId=${encodeURIComponent(versionId)}`)}>
      Inspect version
    </Button>)
    }
  ));

  return (
    <Container>
      <h3>
        {document?.documentName}
      </h3>
      <SortedTable data={data} columns={columns}/>
    </Container>
  );
}

export default Versions;
