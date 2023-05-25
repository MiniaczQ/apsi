import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ApiClient from '../api/ApiClient';
import { Document } from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';


type DocumentsProps = {
  apiClient: ApiClient
};

type DocumentNamedVersion = {
  documentName: String,
  documentVersion: DocumentVersion
}

const getFormattedDate = (createdAt: string) => {
  const date = new Date(createdAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

const compareByCreationTime = (first: DocumentVersion, second: DocumentVersion) => {
  let firstDate = new Date(first.createdAt);
  let secondDate = new Date(second.createdAt)
  if(firstDate > secondDate){
    return -1;
  }
  if(firstDate < secondDate){
    return 1;
  }
  return 0;
}

const distinctByDocumentId = (array: DocumentNamedVersion[]) => {
  const uniqueKeys = new Set();
  return array.reduce((result: DocumentNamedVersion[], element) => {
    const elementKey = element.documentVersion.documentId;
    if (!uniqueKeys.has(elementKey)) {
      uniqueKeys.add(elementKey);
      result.push(element);
    }
    return result;
  }, []);
}

export const Documents: FunctionComponent<DocumentsProps> = ({ apiClient }) => {
  const navigate = useNavigate();

  const [docs, setDocs] = useState<Document[]>([])
  const [docsVersions, setDocsVersions] = useState<DocumentNamedVersion[]>([])

  useEffect(() => {
    apiClient.getDocuments()
      .then(documentsResponse => {
        documentsResponse.forEach(
          document => {
            apiClient.getVersions(document.documentId)
            .then(response => {
                setDocsVersions(old =>[...old,{documentName: document.documentName, documentVersion: response.slice().sort(compareByCreationTime).at(0)!} ]);
            })
          }
        )

      })
  }, [apiClient]);

  const navigateToVersionList = (documentId: string) => navigate(`/Versions?documentId=${encodeURIComponent(documentId)}`);
  const navigateToDocumentCreator = () => navigate('/Versions/new');

  const documentRows = distinctByDocumentId(docsVersions).map(({ documentVersion, documentName }: DocumentNamedVersion, index: number) => (
    <tr key={documentVersion.documentId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {documentName}
      </td>
      <td align='center'>
        {documentVersion.versionName}
      </td>
      <td align='center'>
        {getFormattedDate(documentVersion.createdAt)}
      </td>
      <td align='center'>
        <Button variant="outline-secondary" onClick={() => navigateToVersionList(documentVersion.documentId)}>
          Check versions
        </Button>
      </td>
    </tr>
  ));


  return (
    <Container>
      <h3>
        Documents
      </h3>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th >
              #
            </th>
            <th >
              Name
            </th>
            <th >
              Version
            </th>
            <th >
              Created
            </th>
            <th >
              Options
            </th>
          </tr>
        </thead>
        <tbody>
          {documentRows}
        </tbody>
      </Table>
      <p>
        <Button variant="outline-primary" onClick={navigateToDocumentCreator}>
          Create Document
        </Button>
      </p>
    </Container>
  );
}

export default Documents;
