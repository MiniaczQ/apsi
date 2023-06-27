import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ApiClient from '../api/ApiClient';
import DocumentVersionSet from '../models/DocumentVersionSet';
import { compareByCreationTime } from '../documents/Documents';

type DocumentsSetProps = {
  apiClient: ApiClient
};

type DocumentNamedVersionSet = {
  documentSetName: String,
  documentVersionSet: DocumentVersionSet
}

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

const distinctByDocumentSetId = (array: DocumentNamedVersionSet[]) => {
  const uniqueKeys = new Set();
  return array.reduce((result: DocumentNamedVersionSet[], element) => {
    const elementKey = element.documentVersionSet.documentSetId;
    if (!uniqueKeys.has(elementKey)) {
      uniqueKeys.add(elementKey);
      result.push(element);
    }
    return result;
  }, []);
}

export const DocumentsSet: FunctionComponent<DocumentsSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const [docsVersions, setDocsVersions] = useState<DocumentNamedVersionSet[]>([])

  useEffect(() => {
    apiClient.getDocumentSets()
      .then(documentsResponse => {
        documentsResponse.forEach(
          documentSet => {
            apiClient.getVersionSets(documentSet.documentSetId)
            .then(response => {
                setDocsVersions(old =>[...old,{documentSetName: documentSet.documentSetName, documentVersionSet: response.slice().sort(compareByCreationTime).at(0)!} ]);
            })
          }
        )

      })
  }, [apiClient]);

  const navigateToVersionSetList = (documentSetId: string) => navigate(`/VersionSets?documentSetId=${encodeURIComponent(documentSetId)}`);
  //const navigateToDocumentCreator = () => navigate('/Versions/new');

  const documentRows = distinctByDocumentSetId(docsVersions).map(({ documentVersionSet, documentSetName }: DocumentNamedVersionSet, index: number) => (
    <tr key={documentVersionSet.documentSetId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {documentSetName}
      </td>
      <td align='center'>
        {documentVersionSet.setVersionName}
      </td>
      <td align='center'>
        {getFormattedDate(documentVersionSet.createdAt)}
      </td>
      <td align='center'>
        <Button variant="outline-secondary" onClick={() => navigateToVersionSetList(documentVersionSet.documentSetId)}>
          Check set versions
        </Button>
      </td>
    </tr>
  ));


  return (
    <Container>
      <h3>
        Document Sets
      </h3>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th rowSpan={2}>
              #
            </th>
            <th rowSpan={2}>
              Name
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
        <Button variant="outline-primary" onClick={() =>console.log("navigate to new site")}>
          Create Document Set
        </Button>
      </p>
    </Container>
  );
}

export default DocumentsSet;
