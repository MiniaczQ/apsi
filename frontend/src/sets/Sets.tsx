import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ApiClient from '../api/ApiClient';
import DocumentSetVersion from '../models/DocumentSetVersion';
import { compareByCreationTime } from '../documents/Documents';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';

type DocumentsSetProps = {
  apiClient: ApiClient;
};

type DocumentNamedVersionSet = {
  documentSetName: string;
  documentVersionSet: DocumentSetVersion;
};

const columns: Column[] = [
  { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Set Name', accessor: 'version', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Name', accessor: 'name', sortable: true, sortByOrder: 'asc', colSpan: 2, group: 'Most recent version' },
  {
    label: 'Created at',
    isDate: true,
    accessor: 'created',
    sortable: true,
    sortByOrder: 'asc',
    colSpan: 2,
    group: 'Most recent version',
  },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
];

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
};

export const Sets: FunctionComponent<DocumentsSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const [docsVersions, setDocsVersions] = useState<DocumentNamedVersionSet[]>([]);

  useEffect(() => {
    apiClient.getSets().then((documentsResponse) => {
      documentsResponse.forEach((documentSet) => {
        apiClient.getSetVersions(documentSet.documentSetId).then((response) => {
          setDocsVersions((old) => [
            ...old,
            {
              documentSetName: documentSet.documentSetName,
              documentVersionSet: response.slice().sort(compareByCreationTime).at(0)!,
            },
          ]);
        });
      });
    });
  }, [apiClient]);

  const navigateToVersionSetList = (documentSetId: string) =>
    navigate(`/set-versions?documentSetId=${encodeURIComponent(documentSetId)}`);
  const navigateToSetCreator = () => navigate('/set-versions/new');

  const data = distinctByDocumentSetId(docsVersions).map(
    ({ documentVersionSet, documentSetName }: DocumentNamedVersionSet, index: number) => ({
      index: index + 1,
      version: documentSetName,
      name: documentVersionSet.setVersionName,
      created: documentVersionSet.createdAt,
      option: (
        <Button variant="outline-secondary" onClick={() => navigateToVersionSetList(documentVersionSet.documentSetId)}>
          Check versions
        </Button>
      ),
    })
  );

  return (
    <Container>
      <h3>Sets</h3>
      <SortedTable data={data} columns={columns} />
      <p>
        <Button onClick={navigateToSetCreator} variant="outline-primary">
          Create Document Set
        </Button>
      </p>
    </Container>
  );
};

export default Sets;
