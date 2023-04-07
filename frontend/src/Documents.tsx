import { Button, Container, Table } from 'react-bootstrap';
import './App.css';
import { useNavigate } from 'react-router';

function Documents() {

  const navigate = useNavigate();

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

  function go_to_ver(id :number, name:string)
  {
    navigate("/Versions", {state:{ doc_id : id, doc_name: name}})
  }


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

            <Button onClick={() => go_to_ver(doc.doc_id, doc.document_name)}> Check versions</Button>
          </tr>
        )}
      </tbody>

      </Table>
    </Container>
  );
}

export default Documents;
