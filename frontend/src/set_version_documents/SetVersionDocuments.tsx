import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import ApiClient from '../api/ApiClient';
import DocumentVersion from '../models/DocumentVersion';
import Document from '../models/Document';

type DocumentsSetProps = {
  apiClient: ApiClient
};

export const SetVersionDocuments: FunctionComponent<DocumentsSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const versionSetId = searchParams.get('versionSetId') ?? undefined;

  const [docs, setDocs] = useState<Document[]>([])
  const [vers, setVers] = useState<DocumentVersion[]>([])

  useEffect(() => {
    if (documentSetId === undefined || versionSetId === undefined)
      return;
    apiClient.getSetVersions(documentSetId)
      .then(response => {
        response.forEach(
          setVersion => {
            if (setVersion.setVersionId === versionSetId) {
              setVersion.documentVersionIds.forEach(
                (pair, index) => {
                  apiClient.getDocument(pair[0]).then(doc => setDocs(oldDocs => [...oldDocs, doc]));
                  apiClient.getVersion(pair[0], pair[1]).then(ver => setVers(oldVers => [...oldVers, ver]))
                }
              )
            }
          }
        )
      });
  }, [apiClient, documentSetId, versionSetId]);

  const documentRows = vers.map((ver: DocumentVersion, index: number) => {
    let docName = ''
    if(typeof docs[index] !== 'undefined')
      docName = docs[index].documentName;
    return (
      <tr key={ver.versionId}>
        <td>
          {index + 1}
        </td>
        <td align="center">
          {docName}
        </td>
        <td align='center'>
          {ver.versionName}
        </td>
        <td align='center'>
          <Button variant="outline-secondary" onClick={() => navigate(`/DocVer?documentId=${encodeURIComponent(ver.documentId)}&versionId=${encodeURIComponent(ver.versionId)}`)}>
            Inspect document version
          </Button>
        </td>
      </tr>
    )
  });

  return (
    <Container>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th rowSpan={2}>
              #
            </th>
            <th rowSpan={2}>
              Document
            </th>
            <th>
              Version
            </th>
            <th rowSpan={2}>
              Options
            </th>
          </tr>

        </thead>
        <tbody>
          {(docs.length === vers.length && docs[0] !== undefined) ? documentRows : null}
        </tbody>
      </Table>
    </Container>
  );
}
export default SetVersionDocuments;