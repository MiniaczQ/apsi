import './App.css';
import { FunctionComponent, useEffect, useState } from 'react';
import { LoginState } from './App';
import { Container } from 'react-bootstrap';
import { getFiles, postFiles } from './ApiCommunication';
import { useRef } from 'react';

import { useNavigate, useLocation } from 'react-router';
import DocFile from './models/DocFile';

type AttachmentsProps = {
  loginState: LoginState
};


export const Attachments:FunctionComponent<AttachmentsProps> = ({ loginState }) => {
    const location = useLocation();
    const [currentFile, setCurrentFile] = useState<File>();
    const [message, setMessage] = useState<string>("");
    const [filesInfos, setFileInfos] = useState<Array<DocFile>>([]);
    const inputRef = useRef<any>(null);

    useEffect(() => {
      loadFilesList()
    }, []);
  

    const loadFilesList = () => {
      getFiles(location.state.ver.documentId, location.state.ver.versionId, loginState.token! ).then((response) => {
        setFileInfos(response)})
    };

    const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setCurrentFile(selectedFiles?.[0]);
      };

    const upload = () => {
      if (!currentFile) return;
      postFiles(location.state.ver.documentId, location.state.ver.versionId, loginState.token!, currentFile).then((response) =>{
        loadFilesList();
        setCurrentFile(undefined);
        if (inputRef.current != null) {
          inputRef.current.value = null;
        }
      })
    };

    return(
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
              {filesInfos &&
                filesInfos.map((docfile, index) => (
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