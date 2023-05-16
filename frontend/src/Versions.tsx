import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import './App.css';
import ApiClient from './api/ApiClient';
import Document from './models/Document';
import DocumentVersion from './models/DocumentVersion';


type VersionsProps = {
  apiClient: ApiClient
};

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

  const versionRows = versions?.map(({ documentId, versionId, versionName }: DocumentVersion, index: number) =>
    <tr key={versionId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {versionName}
      </td>
      <td align="center">
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
              #
            </th>
            <th>
              Version
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
