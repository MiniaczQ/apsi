import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ApiClient from '../api/ApiClient';
import DocumentVersion from '../models/DocumentVersion';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';


type DocumentsProps = {
  apiClient: ApiClient
};

export type DocumentNamedVersion = {
  documentName: string,
  documentVersion: DocumentVersion
}

const columns = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Version', accessor: 'version', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Name', accessor: 'name', sortable: true, sortByOrder: 'asc', colSpan: 2, group: 'Most recent version' },
  { label: 'Created at', accessor: 'created', sortable: true, sortByOrder: 'asc', colSpan: 2, group: 'Most recent version' },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc', rowSpan: 2 }
] as Column[]

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

export const compareByCreationTime = (first: { createdAt: string }, second: { createdAt: string }) => {
  let firstDate = new Date(first.createdAt);
  let secondDate = new Date(second.createdAt)
  if (firstDate > secondDate) {
    return -1;
  }
  if (firstDate < secondDate) {
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
                setDocsVersions(old => [...old, { documentName: document.documentName, documentVersion: response.slice().sort(compareByCreationTime).at(0)! }]);
              })
          }
        )

      })
  }, [apiClient]);

  const navigateToVersionList = (documentId: string) => navigate(`/Versions?documentId=${encodeURIComponent(documentId)}`);
  const navigateToDocumentCreator = () => navigate('/Versions/new');

  const data = distinctByDocumentId(docsVersions).map(({ documentVersion, documentName }: DocumentNamedVersion, index: number) => ({
    index: index + 1,
    version: documentName,
    name: documentVersion.versionName,
    created: getFormattedDate(documentVersion.createdAt),
    option: (
      <Button variant="outline-secondary" onClick={() => navigateToVersionList(documentVersion.documentId)}>
        Check versions
      </Button>
    )
  }));

  return (
    <Container>
      <h3>
        Documents
      </h3>
      <SortedTable data={data} columns={columns} />
      <p>
        <Button variant="outline-primary" onClick={navigateToDocumentCreator}>
          Create Document
        </Button>
      </p>
    </Container>
  );
}

export default Documents;
