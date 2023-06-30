import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import { StateBadge } from '../models/StateBadge';
import { DocumentVersion } from '../models/DocumentVersion';
import { Column } from '../table/TableBody';
import { SortedTable } from '../table/SortedTable';

type VersionsProps = {
  apiClient: ApiClient;
};

export function compare_names(a_name: string, b_name: string) {
  // MIND THE MINUS, WE WANT THE NEWEST TO APPEAR ON TOP
  return -String(a_name).localeCompare(b_name, undefined, { numeric: true, sensitivity: 'base' });
}

const columns: Column[] = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc' },
  { label: 'Version', accessor: 'version', sortable: true, sortByOrder: 'asc' },
  { label: 'State', accessor: 'state', sortable: false, sortByOrder: 'asc' },
  { label: 'Created', isDate: true, accessor: 'created', sortable: true, sortByOrder: 'asc' },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc' },
];

export const Versions: FunctionComponent<VersionsProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;

  const [document, setDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    if (documentId === undefined) return;
    apiClient.getDocument(documentId).then((response) => setDocument(response));
    apiClient.getVersions(documentId).then((response) => {
      setVersions(response);
    });
  }, [apiClient, documentId]);

  function compareVersions(a: DocumentVersion, b: DocumentVersion): number {
    return compare_names(a.versionName, b.versionName);
  }

  const data: any[] = versions
    ?.sort(compareVersions)
    .map(({ documentId, versionId, versionName, versionState, createdAt }: DocumentVersion, index: number) => ({
      index: index + 1,
      version: versionName,
      state: <StateBadge state={versionState} />,
      created: createdAt,
      option: (
        <Button
          variant="outline-secondary"
          onClick={() =>
            navigate(`/version?documentId=${encodeURIComponent(documentId)}&versionId=${encodeURIComponent(versionId)}`)
          }
        >
          Inspect version
        </Button>
      ),
    }));

  return (
    <Container>
      <h3>{document?.documentName}</h3>
      <SortedTable data={data} columns={columns} />
    </Container>
  );
};

export default Versions;
