import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Container } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import styles from './docVer.module.css';

var docs =[
  {
      doc_id: 1,
      ver_id: 1,
      versions: "1",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    doc_id: 1,
    ver_id: 2,
    versions: "1.1",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
},
{
  doc_id: 1,
  ver_id:3,
  versions: "1.2",
  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
},
{
  doc_id: 1,
  ver_id: 4,
  versions: "1.2.1",
  text: "Miała matka syna syna jedynego\n Chciała go wychować na pana wielkiego \n Niech żyje wolność wolność i swoboda \nNiech żyje zabawa i dziewczyna młoda"
},
{
  doc_id: 1,
  ver_id: 5,
  versions: "1.2.2",
  text: "Syna jedynego"
},
{
  doc_id: 1,
  ver_id: 5,
  versions: "1.3",
  text: "Syna jedynego"
},
{
  doc_id: 1,
  ver_id: 5,
  versions: "2",
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
      <Tabs
        defaultActiveKey="details"
        id="noanim-tab-example"
        className="mb-3"
        fill
        justify

      >
        <Tab eventKey="details" title="Details">
          <h4 className={styles.pblue}>
            Document name
          </h4>
          <p className={styles.textblack}>
            {doc_ver?.doc_id}
          </p>

          <h5 className={styles.pblue}>
            Version
          </h5>
          <p className={styles.textblack}>
            {doc_ver?.versions}
          </p>

        </Tab>
        <Tab eventKey="text" title="Text">
          <text className={styles.textblack}>
            {doc_ver?.text}
          </text>
        </Tab>
        <Tab eventKey="past" title="Past Version" disabled>
        </Tab>
        <Tab eventKey="future" title="Future versions" disabled>
        </Tab>
      </Tabs>
    </Container>
    )
}

export default DocVer;