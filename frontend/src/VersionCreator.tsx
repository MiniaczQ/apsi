import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { LoginState } from './App';
import CreateDocument from './models/CreateDocument';
import CreateVersion from './models/CreateVersion';
import ApiClient from './api/ApiClient';

type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();
  const [_, setIsLoading] = useState(true);
  const [versionText, setVersionText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [versionName, setVersionName] = useState('1');

  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('document') ?? undefined;
  const parentId = searchParams.get('parentVersion') ?? undefined;
  const documentNameOld = searchParams.get('documentName') ?? undefined;
  const parentName = searchParams.get('parentName') ?? undefined;

  const _createVersion = async () => {
    let cd: CreateDocument = { documentName: documentName };
    let cv: CreateVersion = { versionName: versionName, content: versionText };
    if (documentId === undefined) {
      apiClient.createDocument(cd)
        .then(response => apiClient.createVersion(response.documentId, cv))
        .then(() => navigate('./Documents'));
    } else {
      apiClient.createVersion(documentId!, cv)
        .then(() => navigate('./Documents'));
    }

  };

  useEffect(() => {
    if (parentId !== undefined) {
      (async () => {
        setVersionText((await apiClient.getVersion(documentId!, parentId)).content);
        setDocumentName(documentNameOld!);
        setVersionName((+(parentName!) + 1).toString());
        setIsLoading(false);
      })();
    } else {
      setIsLoading(false);
    }
  }, [apiClient, documentId, documentNameOld, parentId, parentName]);

  const parentVersionField = parentId !== undefined ? (
    <Form.Group className="mb-3" controlId="versionName">
      <Form.Label>Parent version</Form.Label>
      <Form.Control disabled type="text" value={parentName} />
    </Form.Group>
  ) : undefined;

  return (
    <>
      <Form.Group className="mb-3" controlId="documentName">
        <Form.Label>Document name</Form.Label>
        <Form.Control disabled={parentId !== undefined} type="text" value={documentName} onChange={evt => setDocumentName(evt.target.value)} placeholder="Enter document name" />
      </Form.Group>
      {parentVersionField}
      <Form.Group className="mb-3" controlId="author">
        <Form.Label>Author</Form.Label>
        <Form.Control disabled type="text" value={loginState.username} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="content">
        <Form.Label>Content</Form.Label>
        <Form.Control as="textarea" rows={5} value={versionText} onChange={evt => setVersionText(evt.target.value)} />
      </Form.Group>
      <Button onClick={_createVersion}>Create</Button>
    </>
  );
}

export default VersionCreator;
