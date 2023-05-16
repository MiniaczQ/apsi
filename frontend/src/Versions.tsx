import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Badge, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import './App.css';
import './TableStyle.css';
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


  function getStateBadge(state: string|undefined) {
    if (state === undefined) {
      return <></>
    }
    const stateNameLUT: {[index: string]: string} = {
      'inProgress': 'In Progress',
      'readyForReview': 'Ready For Review',
      'Reviewed': 'Reviewed',
      'Published': 'Published',
    };
    const stateStyleLUT: {[index: string]: string} = {
      'inProgress': 'primary',
      'readyForReview': 'danger',
      'Reviewed': 'warning',
      'Published': 'success',
    };
    return <Badge pill bg={stateStyleLUT[state]} style={{marginLeft: "1em"}}>
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

  const versionRows = versions?.map(({ documentId, versionId, versionName, versionState }: DocumentVersion) =>
    <tr key={versionId}>
      <td>
        {versionName}
        {getStateBadge(versionState)}
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
