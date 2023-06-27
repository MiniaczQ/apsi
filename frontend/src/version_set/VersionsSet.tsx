import { FunctionComponent, useEffect, useState } from 'react';
import { Table, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import '../TableStyle.css';
import ApiClient from '../api/ApiClient';
import DocumentVersionSet from '../models/DocumentVersionSet';
import { compare_names } from "../versions/Versions";

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
    apiClient.getSetVersions(documentSetId)
      .then(response => { setVersionSets(response) });
  }, [apiClient, documentSetId]);


  function compareVersionSets(a: DocumentVersionSet, b: DocumentVersionSet): number {
    return compare_names(a.setVersionName, b.setVersionName);
  }

  const versionRows = versions?.sort(compareVersionSets).map(({ documentSetId, setVersionId, setVersionName, createdAt }: DocumentVersionSet) =>
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
