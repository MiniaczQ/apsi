import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Container, Button} from 'react-bootstrap';

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
    apiClient.uploadFiles(documentId, versionId, currentFile).then(() => {
      loadFilesList(documentId, versionId);
      setCurrentFile(undefined);
      if (inputRef.current != null) {
        inputRef.current.value = '';
      }
    })
  };

  const downloadFile = (fileId: string, fileName: string) => {
    apiClient.getFile(documentId, versionId, fileId)
    .then((response) =>{
    // Create blob link to download
    const url = window.URL.createObjectURL(
      response
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      fileName,
    );
    // Append to html link element page
    document.body.appendChild(link);
    // Start download
    link.click();
    // Clean up and remove the link
    link.parentNode!.removeChild(link);
    });
  }

  const deleteRefresh = (fileId: string) => {
    apiClient.deleteFile(documentId, versionId, fileId)
    .then(() => {loadFilesList(documentId, versionId)});
  }

  return (
    <Container>
      <div className="container" style={{ width: "60%" }}>
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
        <div className="card mt-3">
          <div className="card-header">List of Files</div>

          <ul className="list-group list-group-flush">


            {filesInfos?.map((docfile, index) => (
              <li className="list-group-item" key={index} >
                {docfile.fileName}
                <div style={{ float: "right"}}>
                  <Button variant="outline-primary" style={{margin:5}} onClick={() => downloadFile(docfile.fileId, docfile.fileName)}>Download</Button>
                  <Button variant="danger" style={{margin:5}} onClick={() => deleteRefresh(docfile.fileId)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}

export default Attachments;