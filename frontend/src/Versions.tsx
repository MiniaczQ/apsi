import { Table, Button, Container } from 'react-bootstrap';
import './App.css';
import { useLocation } from 'react-router';
import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import DocumentVersion from './models/DocumentVersion';
import ApiClient from './api/ApiClient';

type VersionsProps = {
  apiClient: ApiClient
};

export const Versions: FunctionComponent<VersionsProps> = ({ apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    apiClient.getVersions(location.state.doc_id)
      .then(response => { setVersions(response) });
  }, [location.state.doc_id, apiClient]);

  function go_to_doc_ver(ver: DocumentVersion) {
    navigate("/DocVer", { state: { ver: ver, doc_name: location.state.doc_name } })
  }

  function returnVersion() {
    return (
      <>
        {
          versions?.map((ver: DocumentVersion, id: number) =>
            <tr key={id}>
              <td>
                {id}
              </td>

              <td align='center'>
                {ver.versionName}
              </td>

              <td align='center'>
                <Button variant='outline-secondary' onClick={() => go_to_doc_ver(ver)}>Inspect version</Button>
              </td>
            </tr>)
        }
      </>
    )
  }

  return (
    <Container>
      <h3>
        {location.state.doc_name}
      </h3>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>
              #
            </th>

            <th>
              Version
            </th>

            <th>
              Options
            </th>
          </tr>
        </thead>

        <tbody>
          {returnVersion()}
        </tbody>
      </Table>
    </Container>
  );
}

export default Versions;
