import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { StateBadge } from '../models/StateBadge';


type VersionsProps = {
  apiClient: ApiClient
};

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

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
