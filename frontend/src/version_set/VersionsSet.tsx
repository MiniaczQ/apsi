import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import DocumentVersionSet from '../models/DocumentVersionSet';

type VersionSetProps = {
  apiClient: ApiClient
};

const getFormattedDate = (createdAt: string) => new Date(createdAt).toLocaleString('ro-RO');

export const VersionsSet: FunctionComponent<VersionSetProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;

  const [versions, setVersionSets] = useState<DocumentVersionSet[]>([]);


  useEffect(() => {
    if (documentSetId === undefined)
      return;
    apiClient.getVersionSets(documentSetId)
      .then(response => { setVersionSets(response) });
  }, [apiClient, documentSetId]);

  function compareVersions(a: DocumentVersionSet, b: DocumentVersionSet): number {
    // MIND THE MINUS, WE WANT THE NEWEST TO APPEAR ON TOP
    return -String(a.setVersionName).localeCompare(b.setVersionName, undefined, { numeric: true, sensitivity: 'base' });
  }

  const versionRows = versions?.sort(compareVersions).map(({ documentSetId, setVersionId, setVersionName, createdAt }: DocumentVersionSet) =>
    <tr key={setVersionId}>
      <td>
        {setVersionName}
      </td>
      <td>
        {getFormattedDate(createdAt)}
      </td>
      <td>
        <Button variant="outline-secondary"
          onClick={() => navigate(`/SetListed?documentSetId=${encodeURIComponent(documentSetId)}&versionSetId=${encodeURIComponent(setVersionId)}`)}
        >
          Inspect set version
        </Button>
      </td>
    </tr>
  );


  return (
    <Container>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>
              Set Version
            </th>
            <th >
              Created
            </th>
            <th>
              Options
            </th>
          </tr>
        </thead>
        <tbody>
          {versionRows}
        </tbody>
      </Table>
    </Container>
  );
}

export default VersionsSet;
