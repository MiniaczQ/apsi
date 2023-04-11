import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Button, Container, Form } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import styles from './docVer.module.css';
import { UUID } from 'crypto';
import { useSearchParams } from 'react-router-dom';
import { getVersion } from './ApiCommunication';

type VersionCreatorProps = {
  parentId: UUID
};

type CreateVersionRequest = {
  author: UUID,
  text: string
};

export default function VersionCreator() {
  const [isLoading, setIsLoading] = useState(true);
  const [versionText, setVersionText] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const parentId = searchParams.get('parent') ?? undefined;

  const createVersion = async () => {};

  useCallback(async () => {
    if (parentId !== null) {
      setVersionText(await getVersion(parentId as UUID));
    }
    setIsLoading(false);
  }, [parentId]);

  return (
    <>
      <Form.Group className="mb-3" controlId="parentId">
        <Form.Label>Parent version</Form.Label>
        <Form.Control disabled type="text" value={parentId} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="author">
        <Form.Label>Author</Form.Label>
        <Form.Control disabled type="text" value={parentId} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="content">
        <Form.Label>Content</Form.Label>
        <Form.Control as="textarea" rows={5} value={versionText} onChange={evt => setVersionText(evt.target.value)} />
      </Form.Group>
      <Button onClick={createVersion}>Create</Button>
    </>
  );
}
