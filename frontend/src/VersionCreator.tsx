import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { getVersionContent } from './ApiCommunication';
import { LoginState } from './App';

type VersionCreatorProps = {
  loginState: LoginState
};

export const VersionCreator: FunctionComponent<VersionCreatorProps> = ({ loginState }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [versionText, setVersionText] = useState('');
  const [documentName, setDocumentName] = useState('');

  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('document') ?? undefined;
  const parentId = searchParams.get('parentVersion') ?? undefined;

  const createVersion = async () => {};

  useEffect(() => {
    console.log(parentId);
    if (parentId !== undefined) {
      (async () => {
        setVersionText(await getVersionContent(documentId!, parentId, loginState.token!));
        setDocumentName('Sample name');
        setIsLoading(false);
      })();
    } else {
      setIsLoading(false);
    }
  }, [parentId]);

  const parentVersionField = parentId !== undefined ? (
    <Form.Group className="mb-3" controlId="versionName">
      <Form.Label>Parent version</Form.Label>
      <Form.Control disabled type="text" value={parentId} />
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
      <Button onClick={createVersion}>Create</Button>
    </>
  );
}

export default VersionCreator;
