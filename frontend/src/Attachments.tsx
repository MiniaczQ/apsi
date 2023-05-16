import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';

import './App.css';
import ApiClient from './api/ApiClient';
import DocFile from './models/DocFile';


type AttachmentsProps = {
  apiClient: ApiClient,
  documentId: string,
  versionId: string,
};

export const Attachments: FunctionComponent<AttachmentsProps> = ({ apiClient, documentId, versionId }) => {
  const [currentFile, setCurrentFile] = useState<File>();
  const [message, setMessage] = useState<string>("");
  const [filesInfos, setFileInfos] = useState<DocFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFilesList = (documentId: string, versionId: string) => {
    apiClient.getFiles(documentId, versionId)
      .then(response => setFileInfos(response));
  };

  useEffect(
    () => loadFilesList(documentId, versionId),
    [apiClient, documentId, versionId]
  );

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files as FileList;
    setCurrentFile(selectedFiles?.[0]);
  };

  const upload = () => {
    if (!currentFile) return;
    apiClient.postFiles(documentId, versionId, currentFile).then(() => {
      loadFilesList(documentId, versionId);
      setCurrentFile(undefined);
      if (inputRef.current != null) {
        inputRef.current.value = '';
      }
    })
  };

  return (
    <Container>
      <div className="container" style={{ width: "80%" }}>
        <div className="row">
          <div className="col-8">
            <label className="btn btn-default p-0">
              <input ref={inputRef} type="file" onChange={selectFile} />
            </label>
          </div>
          <div className="col-4">
            <button
              className="btn btn-success btn-sm"
              disabled={!currentFile}
              onClick={upload}>
              Upload
            </button>
          </div>
        </div>
        {message && (
          <div className="alert alert-secondary mt-3" role="alert">
            {message}
          </div>
        )}
        <div className="card mt-3">
          <div className="card-header">List of Files</div>
          <ul className="list-group list-group-flush">
            {filesInfos?.map((docfile, index) => (
              <li className="list-group-item" key={index}>
                <a href={docfile.fileId}>{docfile.fileName}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}

export default Attachments;