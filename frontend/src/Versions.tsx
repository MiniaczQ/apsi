import { Table, Button, Container } from 'react-bootstrap';
import './App.css';
import { useLocation } from 'react-router';
import { useEffect, useState } from 'react';

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
  const location = useLocation();
  const [versions, setVersions] = useState<{
    doc_id: Number,
    ver_id: Number,
    versions: String,
    text: String
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


  function returnVersion()
  {
    if(versions != undefined){
    return(
      <>
        {
          versions?.map(ver =>
            <tr >
              <td> {ver.versions} </td>
              <Button onClick={() => console.log("baba")}> Check versions</Button>
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