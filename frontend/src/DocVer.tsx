import { FunctionComponent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

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

  function formatDatetime(datetime: string|undefined): string|undefined {
    // YYYY-MM-DDTHH:mm:ss.uuuuuZ into HH:mm:ss, DD-MM-YYYY
    if (datetime === undefined) {
      return undefined
    }
    let [date, time] = datetime.split('T')
    time = time.split('.')[0]
    date = date.split('-').reverse().join('.')
    return [time, date].join(', ')
  }

  useEffect(() => {
    if (documentId === undefined || versionId === undefined)
      return;
    apiClient.getDocument(documentId)
      .then(response => setDocument(response));
    apiClient.getVersion(documentId, versionId)
      .then(response => setVersion(response))
  }, [apiClient, documentId, versionId]);


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
            Creation time
          </h5>
          <p className={styles.textblack}>
            {formatDatetime(version?.createdAt)}
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
