import { FunctionComponent, MouseEventHandler, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Button, Badge, Container } from 'react-bootstrap';
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


  const changeState: MouseEventHandler<HTMLButtonElement> = async () => {
    if (version === undefined) {
      return
    }
    const stateLUT: {[index: string]: string} = {
      'inProgress': 'readyForReview',
      'readyForReview': 'Reviewed',
      'Reviewed': 'Published',
      'Published': 'Published'
    };
    setVersion({...version, versionState: stateLUT[version?.versionState]})
  }

  function getNextStateActionButton(state: string|undefined) {
    if (state === undefined || state == 'Published') {
      return <></>
    }
    const stateLUT: {[index: string]: string} = {
      'inProgress': 'Mark as Ready for Review',
      'readyForReview': 'Review',
      'Reviewed': 'Publish',
      'Published': ''
    };
    return <Button variant="outline-danger" onClick={changeState}>
      {stateLUT[state]}
    </Button>
  }

  function getStateBadge(state: string|undefined) {
    if (state === undefined) {
      return <></>
    }
    const stateNameLUT: {[index: string]: string} = {
      'inProgress': 'In Progress',
      'readyForReview': 'Ready For Review',
      'Reviewed': 'Reviewed',
      'Published': 'Published',
    };
    const stateStyleLUT: {[index: string]: string} = {
      'inProgress': 'primary',
      'readyForReview': 'danger',
      'Reviewed': 'warning',
      'Published': 'success',
    };
    return <Badge pill bg={stateStyleLUT[state]} style={{marginLeft: "1em"}}>
      {stateNameLUT[state]}
    </Badge>
  }

  useEffect(() => {
    if (documentId === undefined || versionId === undefined)
      return;
    apiClient.getDocument(documentId)
      .then(response => setDocument(response));
    apiClient.getVersion(documentId, versionId)
      .then(response => setVersion(response))
  }, [apiClient, documentId, versionId]);

  const showDate = (dateString: string) => new Date(dateString).toDateString();
  const navigateToVersionCreator = (documentId: string, versionId: string) =>
    navigate(`/versions/new?documentId=${encodeURIComponent(documentId)}&parentVersionId=${encodeURIComponent(versionId)}`);

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
              {getStateBadge(version?.versionState)}
            </p>
            <h5 className={styles.pblue}>
                Creation date
            </h5>
            <p className={styles.textblack}>
              {showDate(version?.createdAt ?? '')}
            </p>
            <h5 className={styles.pblue}>
              Content
            </h5>
            <div className={styles.textblack} style={{ whiteSpace: 'pre' }}>
              {version?.content}
            </div>
            <Button variant="outline-primary"
                onClick={() => navigateToVersionCreator(documentId, versionId)}
            >
              Create New Document Version
            </Button>
            {getNextStateActionButton(version?.versionState)}
          </div>
        </Tab>
        <Tab eventKey="comments" title="Comments">
        </Tab>
        <Tab eventKey="files" title="File Attachments">
          <Attachments apiClient={apiClient} documentId={documentId} versionId={versionId} />
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
