import { Table, Button, Container } from 'react-bootstrap';
import './App.css';
import { useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

var docs =[
  {
      doc_id: 1,
      ver_id: 1,
      versions: "17-5",
      text: "Babbui"
  },
  {
    doc_id: 1,
    ver_id: 2,
    versions: "1",
    text: "Miała madka syna"
},
{
  doc_id: 1,
  ver_id:3,
  versions: "2",
  text: "Syna jedynego"
},
{
  doc_id: 1,
  ver_id: 4,
  versions: "3.5",
  text: "Syna jedynego"
},
{
  doc_id: 2,
  ver_id: 4,
  versions: "1.0.0.0",
  text: "Lot w kosmos Jerzyku"
},
] 


function Versions() {
  const navigate = useNavigate();
  const location = useLocation();

  const [versions, setVersions] = useState<{
    doc_id: number,
    ver_id: number,
    versions: string,
    text: string
  }[]>();

  useEffect(() => {
    var listed = [];
    for(var doc of docs){
      if(doc.doc_id == location.state.doc_id){
        listed.push(doc);
      }
    }
    setVersions(listed);
  })


  function go_to_doc_ver(document_id :number, version_id:number)
  {
    navigate("/DocVer", {state:{ doc_id : document_id, ver_id: version_id}})
  }


  function returnVersion()
  {
    if(versions != undefined){
    return(
      <>
        {
          versions?.map(ver =>
            <tr >
              <td> {ver.versions} </td>
              <Button onClick={() => go_to_doc_ver(ver.doc_id, ver.ver_id)}> Check versions</Button>
            </tr>)
        }
      
      </>
    )
    }
  }



  return (
    <Container>
      <Table size='xxl' responsive="sm">
        <thead>
          <tr>
            <th>
              Versions
            </th>
          
            <th>
              Options
            </th>
          </tr>
        </thead>

        <tbody>
        { returnVersion()}
      </tbody>

      </Table>
    </Container>
  );
}

export default Versions;