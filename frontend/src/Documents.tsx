import { Button, Container, ListGroup, Table } from 'react-bootstrap';
import './App.css';

function Documents() {

  var docs =[
    {
        doc_id: 1,
        document_name: "Star Wars"
    },
    {
        doc_id: 2,
        document_name: "Makafon"
    },
    {
        doc_id: 3,
        document_name: "Homofobia"
    },
  ] 


  return (
    <Container>
      <Table size='xxl' responsive="sm">
        <thead>
          <tr>
            <th>
              Document Name
            </th>
          
            <th>
              Options
            </th>
          </tr>
        </thead>

        <tbody>

        {docs.map(doc =>
          <tr key = {doc.doc_id}>
            <td> {doc.document_name} </td>

            <Button onClick={() => console.log("dupa")}> Check versions</Button>
          </tr>
        )}
      </tbody>

      </Table>
    </Container>
  );
}

export default Documents;
