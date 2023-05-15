import { Button, Container, Table } from 'react-bootstrap';
import './App.css';
import { useNavigate } from 'react-router';
import { FunctionComponent, useState, useEffect } from "react";
import { Document } from './models/Document';
import ApiClient from './api/ApiClient';

type DocumentsProps = {
  apiClient: ApiClient
};

export const Documents: FunctionComponent<DocumentsProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Document[]>([])

  useEffect(() => {
    apiClient.getDocuments().then(response => { setDocs(response) });
  }, [apiClient]);

  const go_to_ver = (id: string, name: string) => navigate("/Versions", { state: { doc_id: id, doc_name: name } });

  const navigateToDocumentCreator = () => navigate('/Versions/new');

  const print_doc_row = (document_name: string, document_id: string, row_id: number) => (
    <tr key={row_id}>
      <td>
        {row_id}
      </td>

      <td align='center'>
        {document_name}
      </td>

      <td align='center'>
        <Button variant='outline-secondary' onClick={() => go_to_ver(document_id, document_name)}>Check versions</Button>
      </td>
    </tr>);

  return (
    <Container>
      <h3>
        Documents
      </h3>
      <Table striped bordered hover size="sm" >
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
          {docs.map((doc: Document, id: number) => print_doc_row(doc.documentName, doc.documentId, id))}
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
