import { FunctionComponent, useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router';
import { Button, Container } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import styles from './docVer.module.css';
import DocumentVersion from "./models/DocumentVersion";
import ApiClient from "./api/ApiClient";

type DocVerProps = {
  apiClient: ApiClient
};

interface DocumentVersionWithContent {
  dv: DocumentVersion,
  content: string
}

export const DocVer: FunctionComponent<DocVerProps> = ({ apiClient }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [doc_ver, setVersions] = useState<DocumentVersionWithContent>();

  useEffect(() => {
    apiClient.getVersion(location.state.ver.documentId, location.state.ver.versionId)
      .then(response => setVersions({ dv: location.state.ver, content: response.content }))
  }, [location.state.ver, apiClient]);

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
            {location.state.doc_name}
          </p>

          <h5 className={styles.pblue}>
            Version
          </h5>
          <p className={styles.textblack}>
            {doc_ver?.dv.versionName}
          </p>

          <h5 className={styles.pblue}>
            Content
          </h5>
          <div className={styles.textblack} style={{ whiteSpace: 'pre' }}>
            {doc_ver?.content}
          </div>
          <Button variant="outline-primary" onClick={() => navigate(`/versions/new?document=${doc_ver?.dv.documentId}&parentVersion=${doc_ver?.dv.versionId}&documentName=${location.state.doc_name}&parentName=${doc_ver?.dv.versionName}`)}>
            Create New Document Version
          </Button>
        </Tab>

        <Tab eventKey="past" title="Past Versions" disabled>
        </Tab>
        <Tab eventKey="future" title="Derived Versions" disabled>
        </Tab>
      </Tabs>
    </Container>
  )
}

export default DocVer;
