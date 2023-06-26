import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ApiClient from '../api/ApiClient';
import DocumentVersion from '../models/DocumentVersion';


type DocumentsProps = {
  apiClient: ApiClient
};

export type DocumentNamedVersion = {
  documentName: String,
  documentVersion: DocumentVersion
}

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

export const compareByCreationTime = (first: { createdAt: string }, second: { createdAt: string }) => {
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
            <th rowSpan={2}>
              #
            </th>
            <th rowSpan={2}>
              Version
            </th>
            <th colSpan={2}>
              Most recent version
            </th>
            <th rowSpan={2}>
              Options
            </th>
          </tr>
          <tr>
          <th >
              Name
            </th>
            <th >
            Created at
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
