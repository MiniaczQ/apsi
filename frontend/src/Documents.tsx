import { Button, Container, Table } from 'react-bootstrap';
import './App.css';
import { useNavigate } from 'react-router';

function Documents() {
  const navigate = useNavigate();

  const docs = [
    {
      doc_id: 1,
      document_name: "Network Mail Transportation Protocol"
    },
    {
      doc_id: 2,
      document_name: "User Guide for Mid and Beginners"
    },
    {
      doc_id: 3,
      document_name: "Health Assosiation Commision Agreement"
    },
    {
      doc_id: 4,
      document_name: "Fire Schedule Evacution Procedures"
    },
    {
      doc_id: 5,
      document_name: "Cake Day"
    },
    {
      doc_id: 6,
      document_name: "Emergency Protocol"
    },
  ];

  const go_to_ver = (id: number, name: string) => navigate("/Versions", {state:{ doc_id : id, doc_name: name}});

  const navigateToDocumentCreator = () => navigate('/versions/new');

  const print_doc_row = (document_name: string, document_id: number, row_id: number) => (
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
        {docs.map( (doc,id) =>
          print_doc_row(doc.document_name, doc.doc_id, id))
        }
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
