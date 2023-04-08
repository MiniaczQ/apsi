import { useEffect, useState } from 'react';
import './App.css';
import { useLocation } from 'react-router';
import { Container } from 'react-bootstrap';

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


function DocVer(){
    const location = useLocation();

    const [doc_ver, setVersions] = useState<{
        doc_id: number,
        ver_id: number,
        versions: string,
        text: string
      }>();

    useEffect(() => {
        for(var doc of docs){
          if(doc.doc_id === location.state.doc_id && doc.ver_id === location.state.ver_id){
            setVersions(doc);
        }
        }
      })    

    return (
    <Container>
      <h3>
        Document {doc_ver?.doc_id}
      </h3>
      <h3>
        Version { doc_ver?.versions}
      </h3>

      <text>
        { doc_ver?.text}
      </text>
    </Container>
    )
}

export default DocVer;