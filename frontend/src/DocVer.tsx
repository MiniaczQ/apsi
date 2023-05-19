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
import DocumentVersion, { DocumentVersionState, DocumentVersionStateMap } from './models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole } from './models/DocumentVersionMember';
import { LoginState } from './App';


type DocVerProps = {
  loginState: LoginState
  apiClient: ApiClient
};

export const DocVer: FunctionComponent<DocVerProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const versionId = searchParams.get('versionId') ?? undefined;

  const [document, setDocument] = useState<Document>();
  const [version, setVersion] = useState<DocumentVersion>();
  const [authorizedUsers, setAuthorizedUsers] = useState<DocumentVersionMember[]>([]);
  const [userRoles, setUserRoles] = useState<DocumentVersionMemberRole[]>([]);

  const owner = authorizedUsers?.filter(user => user.roles.indexOf('owner') >= 0)?.[0];
  const viewers = authorizedUsers?.filter(user => user.roles.indexOf('viewer') >= 0);
  const editors = authorizedUsers?.filter(user => user.roles.indexOf('editor') >= 0);
  const reviewers = authorizedUsers?.filter(user => user.roles.indexOf('reviewer') >= 0);


  const changeStateForward: MouseEventHandler<HTMLButtonElement> = async () => {
    if (version === undefined) {
      return
    }
    const stateProgressionLUT: DocumentVersionStateMap<DocumentVersionState> = {
      'inProgress': 'readyForReview',
      'readyForReview': 'reviewed',
      'reviewed': 'published',
      'published': 'published'
    };
    const newState = stateProgressionLUT[version?.versionState];
    apiClient.setVersionState(documentId!, versionId!, newState)
      .then(() => setVersion({ ...version, versionState: newState }));
  }

  const changeStateBackward: MouseEventHandler<HTMLButtonElement> = async () => {
    if (version === undefined) {
      return
    }
    const stateProgressionLUT: DocumentVersionStateMap<DocumentVersionState> = {
      'inProgress': 'inProgress',
      'readyForReview': 'inProgress',
      'reviewed': 'inProgress',
      'published': 'published'
    };
    const newState = stateProgressionLUT[version?.versionState];
    apiClient.setVersionState(documentId!, versionId!, newState)
      .then(() => setVersion({ ...version, versionState: newState }));
  }

  function getRolesForState(state: DocumentVersionState | undefined): DocumentVersionMemberRole[] {
    if (state === undefined) {
      return [];
    }
    const stateRoleLUT: DocumentVersionStateMap<DocumentVersionMemberRole[]> = {
      'inProgress': ['owner', 'editor'],
      'readyForReview': ['reviewer'],
      'reviewed': ['owner'],
      'published': []
    };
    return stateRoleLUT[state];
  }

  const showDate = (dateString: string) => new Date(dateString).toDateString();
  const navigateToVersionCreator = (documentId: string, versionId: string) =>
    navigate(`/versions/new?documentId=${encodeURIComponent(documentId)}&parentVersionId=${encodeURIComponent(versionId)}`);
  const navigateToVersionEditor = (documentId: string, versionId: string) =>
    navigate(`/versions/edit?documentId=${encodeURIComponent(documentId)}&versionId=${encodeURIComponent(versionId)}`);

  function getActionButtons() {
    const newVersionButton = (
      <Button variant="outline-primary" onClick={() => navigateToVersionCreator(documentId!, versionId!)}>
        Create New Document Version
      </Button>
    );
    const editVersionButton = (
      <Button className="ms-2" variant="outline-primary" onClick={() => navigateToVersionEditor(documentId!, versionId!)}>
        Modify
      </Button>
    );
    const stateButtons = (<>
      {getNextStateActionButton(version?.versionState)}
      {getPreviousStateActionButton(version?.versionState)}
    </>);

    return (<>
      {userRoles.length > 0 ? newVersionButton : <></>}
      {(userRoles.includes('editor') || userRoles.includes('owner')) ? editVersionButton : <></>}
      {userRoles.find(role => getRolesForState(version?.versionState).includes(role)) ? stateButtons : <></>}
    </>);
  }

  function getNextStateActionButton(state: DocumentVersionState | undefined) {
    if (state === undefined || state === 'published') {
      return <></>
    }
    const stateLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'Mark as Ready for Review',
      'readyForReview': 'Review (Accept)',
      'reviewed': 'Publish',
      'published': ''
    };
    return <Button variant="outline-success" onClick={changeStateForward} style={{ marginLeft: "1em" }}>
      {stateLUT[state]}
    </Button>
  }

  function getPreviousStateActionButton(state: DocumentVersionState | undefined) {
    if (state === undefined || state === 'inProgress' || state === 'published') {
      return <></>
    }
    const stateLUT: DocumentVersionStateMap<string> = {
      'inProgress': '',
      'readyForReview': 'Review (Decline)',
      'reviewed': 'Decline Publishing',
      'published': ''
    };
    return <Button variant="outline-danger" onClick={changeStateBackward} style={{ marginLeft: "1em" }}>
      {stateLUT[state]}
    </Button>
  }

  function getStateBadge(state: DocumentVersionState | undefined) {
    if (state === undefined) {
      return <></>
    }
    const stateNameLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'In Progress',
      'readyForReview': 'Ready For Review',
      'reviewed': 'Reviewed',
      'published': 'Published',
    };
    const stateStyleLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'primary',
      'readyForReview': 'danger',
      'reviewed': 'warning',
      'published': 'success',
    };
    return <Badge pill bg={stateStyleLUT[state]} style={{ marginLeft: "1em" }}>
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
    apiClient.getMembers(documentId, versionId)
      .then(response => setAuthorizedUsers(response));
  }, [apiClient, documentId, versionId]);

  useEffect(() => {
    const member = authorizedUsers.find(member => member.userId === loginState.userId!);
    setUserRoles(member?.roles ?? []);
  }, [loginState.userId, authorizedUsers]);

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
              Roles
            </h5>
            <div>
              <h6 className={styles.pblue}>
                Owner
              </h6>
              <p className={styles.textblack}>
                {owner?.username}
              </p>
              <h6 className={styles.pblue}>
                Viewers
              </h6>
              <ul className={styles.textblack}>
                {viewers?.map(viewer => (
                  <li key={viewer.userId}>
                    {viewer.username}
                  </li>
                ))}
              </ul>
              <h6 className={styles.pblue}>
                Editors
              </h6>
              <ul className={styles.textblack}>
                {editors?.map(editor => (
                  <li key={editor.userId}>
                    {editor.username}
                  </li>
                ))}
              </ul>
              <h6 className={styles.pblue}>
                Reviewers
              </h6>
              <ul className={styles.textblack}>
                {reviewers?.map(reviewer => (
                  <li key={reviewer.userId}>
                    {reviewer.username}
                  </li>
                ))}
              </ul>
            </div>
            <h5 className={styles.pblue}>
              Content
            </h5>
            <div className={styles.textblack} style={{ whiteSpace: 'pre' }}>
              {version?.content}
            </div>
            {getActionButtons()}
          </div >
        </Tab >
        <Tab eventKey="comments" title="Comments">
        </Tab>
        <Tab eventKey="files" title="File Attachments">
          <Attachments apiClient={apiClient} documentId={documentId} versionId={versionId} />
        </Tab>
        <Tab eventKey="past" title="Past Versions" disabled>
        </Tab>
        <Tab eventKey="future" title="Derived Versions" disabled>
        </Tab>
      </Tabs >
    </Container >
  ) : <></>;
}

export default DocVer;
