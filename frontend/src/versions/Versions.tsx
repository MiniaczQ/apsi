import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Badge, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import { DocumentVersion, DocumentVersionState, DocumentVersionStateMap } from '../models/DocumentVersion';


type VersionsProps = {
  apiClient: ApiClient
};

const getFormattedDate = (createdAt: string) => {
  const date = new Date(createdAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

export const Versions: FunctionComponent<VersionsProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;

  const [document, setDocument] = useState<Document>();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);


  function getStateBadge(state: DocumentVersionState | undefined) {
    if (state === undefined) {
      return <></>
    }
    const stateNameLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'In Progress',
      'readyForReview': 'Ready For Review',
      'reviewed': 'Reviewed',
      'published': 'Published',
    };
    const stateStyleLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'primary',
      'readyForReview': 'danger',
      'reviewed': 'warning',
      'published': 'success',
    };
    return <Badge pill bg={stateStyleLUT[state]} className="ms-3">
      {stateNameLUT[state]}
    </Badge>
  }

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
        {getStateBadge(versionState)}
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


  return (
    <Container>
      <h3>
        {document?.documentName}
      </h3>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>
              Version
            </th>
            <th >
              Created
            </th>
            <th>
              Options
            </th>
          </tr>
        </thead>
        <tbody>
          {versionRows}
        </tbody>
      </Table>
    </Container>
  );
}

export default Versions;
