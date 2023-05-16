import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import './App.css';
import ApiClient from './api/ApiClient';
import { Document } from './models/Document';


type DocumentsProps = {
  apiClient: ApiClient
};

export const Documents: FunctionComponent<DocumentsProps> = ({ apiClient }) => {
  const navigate = useNavigate();

  const [docs, setDocs] = useState<Document[]>([])


  useEffect(() => {
    apiClient.getDocuments()
      .then(response => setDocs(response));
  }, [apiClient]);

  const navigateToVersionList = (documentId: string) => navigate(`/Versions?documentId=${encodeURIComponent(documentId)}`);
  const navigateToDocumentCreator = () => navigate('/Versions/new');

  const documentRows = docs?.map(({ documentId, documentName }: Document, index: number) => (
    <tr key={documentId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {documentName}
      </td>
      <td align='center'>
        <Button variant="outline-secondary" onClick={() => navigateToVersionList(documentId)}>
          Check versions
        </Button>
      </td>
    </tr>
  ));


  return (
    <Container>
      <h3>
        Documents
      </h3>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th >
              #
            </th>
            <th >
              Name
            </th>
            <th >
              Options
            </th>
          </tr>
        </thead>
        <tbody>
          {documentRows}
        </tbody>
      </Table>
      <p>
        <Button variant="outline-primary" onClick={navigateToDocumentCreator}>
          Create Document
        </Button>
      </p>
    </Container>
  );
}

export default Documents;
