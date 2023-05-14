import { FunctionComponent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import Attachments from "./Attachments";
import styles from './docVer.module.css';
import ApiClient from './api/ApiClient';
import Document from './models/Document';
import DocumentVersion from './models/DocumentVersion';


type DocVerProps = {
  apiClient: ApiClient
};

export const DocVer: FunctionComponent<DocVerProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const versionId = searchParams.get('versionId') ?? undefined;

  const [document, setDocument] = useState<Document>();
  const [version, setVersion] = useState<DocumentVersion>();


  useEffect(() => {
    if (documentId === undefined || versionId === undefined)
      return;
    apiClient.getDocument(documentId)
      .then(response => setDocument(response));
    apiClient.getVersion(documentId, versionId)
      .then(response => setVersion(response))
  }, [apiClient, documentId, versionId]);


  function show_date(date_string: string) {
    let date = new Date(date_string)
    return date.toDateString()
  }

  return (documentId !== undefined && versionId !== undefined) ? (
    <Container>
      <Tabs
        defaultActiveKey="details"
        id="noanim-tab-example"
        className="mb-3"
        fill
        justify
      >
        <Tab eventKey="details" title="Details">
          <div className="container" style={{ width: "80%" }}>
            <h4 className={styles.pblue}>
              Document name
            </h4>
            <p className={styles.textblack}>
              {document?.documentName}
            </p>

            <h5 className={styles.pblue}>
              Version
            </h5>
            <p className={styles.textblack}>
              {version?.versionName}
            </p>

            <h5 className={styles.pblue}>
              Creation date
            </h5>
            <p className={styles.textblack}>
              {show_date(version?.createdAt ?? '')}
            </p>

            <h5 className={styles.pblue}>
              Content
            </h5>
            <div className={styles.textblack} style={{ whiteSpace: 'pre' }}>
              {version?.content}
            </div>
            <Button variant="outline-primary"
              onClick={() => navigate(`/versions/new?documentId=${encodeURIComponent(documentId)}&parentVersionId=${encodeURIComponent(versionId)}`)}
            >
              Create New Document Version
            </Button>
          </div>
        </Tab>

        <Tab eventKey="comments" title="Comments">
        </Tab>

        <Tab eventKey="attachments" title="Attachments">
          <Attachments loginState={loginState} />
        </Tab>
        <Tab eventKey="past" title="Past Versions" disabled>
        </Tab>
        <Tab eventKey="future" title="Derived Versions" disabled>
        </Tab>
      </Tabs>
    </Container>
  ) : <></>;
}

export default DocVer;
