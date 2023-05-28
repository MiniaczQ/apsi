import { FunctionComponent, MouseEventHandler, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Button, Badge, Container } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import styles from './docVer.module.css';
import Attachments from "../attachments/Attachments";
import ApiClient from '../api/ApiClient';
import Document from '../models/Document';
import DocumentVersion, { DocumentVersionState, DocumentVersionStateMap } from '../models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole } from '../models/DocumentVersionMember';
import { LoginState } from '../App';
import Comments from '../comments/Comments';


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
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
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
      <Button className="ms-3" variant="outline-primary" onClick={() => navigateToVersionEditor(documentId!, versionId!)}>
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
    return <Button className="ms-3" variant="outline-success" onClick={changeStateForward}>
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
    return <Button className="ms-3" variant="outline-danger" onClick={changeStateBackward}>
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
    return <Badge className="ms-3" pill bg={stateStyleLUT[state]}>
      {stateNameLUT[state]}
    </Badge>
  }

  useEffect(() => {
    if (documentId === undefined || versionId === undefined)
      return;
    apiClient.getDocument(documentId)
      .then(response => setDocument(response));
    apiClient.getVersion(documentId, versionId)
      .then(response => setVersion(response));
    apiClient.getVersions(documentId)
      .then(response => setVersions(response));
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
          <div className="container w-75">
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
                Owner: <span className={styles.textblack}>{owner?.username}</span>
              </h6>
              <h6 className={styles.pblue}>
                Viewers: <span className={styles.textblack}>{viewers?.map(viewer => viewer.username)?.join(', ')}</span>
              </h6>
              <h6 className={styles.pblue}>
                Editors: <span className={styles.textblack}>{editors?.map(editor => editor.username)?.join(', ')}</span>
              </h6>
              <h6 className={styles.pblue}>
                Reviewers: <span className={styles.textblack}>{reviewers?.map(reviewer => reviewer.username)?.join(', ')}</span>
              </h6>
            </div>
            <h5 className={styles.pblue}>
              Content
            </h5>
            <div className={[styles.textblack, styles.versionContent].join(' ')}>
              {version?.content}
            </div>
            {getActionButtons()}
          </div >
        </Tab >
        <Tab eventKey="comments" title="Comments">
          <Comments loginState={loginState} apiClient={apiClient} documentId={documentId} versionId={versionId} />
        </Tab>
        <Tab eventKey="files" title="File Attachments">
          <Attachments apiClient={apiClient} documentId={documentId} versionId={versionId} />
        </Tab>
        <Tab eventKey="past" title="Parent Versions">
          {version?.parents?.map(versionId => <p key={versionId}>{versions?.find(version => version.versionId === versionId)?.versionName}</p>)}
        </Tab>
        <Tab eventKey="future" title="Descendant Versions">
          {version?.children?.map(versionId => <p key={versionId}>{versions?.find(version => version.versionId === versionId)?.versionName}</p>)}
        </Tab>
      </Tabs >
    </Container >
  ) : <></>;
}

export default DocVer;
