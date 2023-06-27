import { FunctionComponent, useEffect, useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import DocumentSetVersion from '../models/DocumentSetVersion';
import { compare_names } from '../versions/Versions';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';

type VersionSetProps = {
  apiClient: ApiClient;
};

const columns: Column[] = [
  { label: 'Set Name', accessor: 'version', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Created at', isDate: true, accessor: 'created', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
  { label: 'Options', accessor: 'option', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
];

export const SetVersions: FunctionComponent<VersionSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;

  const [versions, setVersionSets] = useState<DocumentSetVersion[]>([]);

  useEffect(() => {
    if (documentSetId === undefined) return;
    apiClient.getSetVersions(documentSetId).then((response) => {
      setVersionSets(response);
    });
  }, [apiClient, documentSetId]);

  function compareVersionSets(a: DocumentSetVersion, b: DocumentSetVersion): number {
    return compare_names(a.setVersionName, b.setVersionName);
  }

  const versionRows = versions
    ?.sort(compareVersionSets)
    .map(({ documentSetId, setVersionId, setVersionName, createdAt }: DocumentSetVersion) => ({
      version: setVersionName,
      created: createdAt,
      option: (
        <Button
          variant="outline-secondary"
          onClick={() =>
            navigate(
              `/set-version?documentSetId=${encodeURIComponent(documentSetId)}&versionSetId=${encodeURIComponent(setVersionId)}`
            )
          }
        >
          Inspect version
        </Button>
      ),
    }));

  return (
    <Container>
      <h3>Set Versions</h3>
      <SortedTable data={versionRows} columns={columns} />
    </Container>
  );
};

export default SetVersions;
