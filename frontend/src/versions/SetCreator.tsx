import { FunctionComponent, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Form, useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient from '../api/ApiClient';
import CreateDocument from '../models/CreateDocument';
import CreateVersion from '../models/CreateVersion';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import User from '../models/User';
import VersionMergingOptions from './VersionMergingOptions';
import VersionNameChooser from './VersionNameChooser';
import VersionContentEditor from './VersionContentEditor';
import RoleEditor from './RoleEditor';
import DocumentNameEditor from './DocumentNameEditor';
import DocumentVersionMember, { DocumentVersionMemberRole, editableMemberRoles } from '../models/DocumentVersionMember';
import SetNameEditor from './SetNameEditor';
import CreateSet from '../models/CreateSet';
import CreateSetVersion from '../models/CreateSetVersion';
import SetDocumentVersion from '../models/SetDocumentVersion';
import { getSystemErrorMap } from 'util';
import Set from '../models/Set';

type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const SetCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentId = searchParams.get('documentId') ?? undefined;
  const parentVersionId = searchParams.get('parentVersionId') ?? undefined;
  const isCreatingNewDocument = documentId === undefined && parentVersionId === undefined;


  const [set, setSet] = useState<Set>();
  

  const [createdSet, setCreatedSet] = useState<CreateSet>({
    documentSetName: 'frontendowy4',
    initialVersion: {
        setVersionName: '1',
        documentVersionIds:[],
    
    }  
    
  });
  const [createdVersion, setCreatedVersion] = useState<CreateSetVersion>({
    setVersionName: '1', 
    documentVersionIds:[[]],  
    parents: [],
  });

  

  
  

  

  const changeVersion = useCallback(
    (versionName: string) => setCreatedVersion(createdVersion => ({ ...createdVersion, versionName })),
    [],
  );
  


  const [AddedVersion, setAddedVersion] = useState<SetDocumentVersion>({
    documentId: '', 
    versionId: '',     
  });

  const docs={
    documentId:'', 
    versionId: ''  
  }


  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [version, setVersion] = useState<DocumentVersion[]>([]);
  const [tableData, setTableData] = useState<[string, string][]>([]);  
  const [tableData1, setTableData1] = useState<[string,string][]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiClient.getDocuments();
        setDocuments(response);
      } catch (error) {
        console.error('Błąd pobierania dokumentów:', error);
      }
    };

    fetchDocuments();
  }, []);

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    setSelectedDocumentId(selectedId);

    if (selectedId) {
      try {
        const response = await apiClient.getVersions(selectedId);
        setVersion(response);
      } catch (error) {
        console.error('Błąd pobierania wersji dokumentu:', error);
      }
    } else {
      setVersion([]);
    }
  };

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    
    const selectedVersion = event.target.value;
    
    setSelectedVersionId(selectedVersion);
    
  };
  

  const handleAddElement = () => {
    if (selectedDocumentId) {
      
      const selectedDocument = documents.find((doc) => doc.documentId === selectedDocumentId);
      const selectedVersion = version.find((ver) => ver.versionId === selectedVersionId);
      
      if (selectedDocument && selectedVersion) {
        const newData: [string, string] = [selectedDocument.documentName, selectedVersion.versionName];
        setTableData((prevData) => [...prevData, newData]);
         
        const newData1: [string, string] = [selectedDocument.documentId, selectedVersion.versionId];
        setTableData1((prevData) => [...prevData, newData1]);
        


      }
    }
  };

  const handleDelete = (index: number) => {
    const updatedTableData = [...tableData];
    updatedTableData.splice(index, 1);
    setTableData(updatedTableData);

    const updatedTableData1 = [...tableData1];
    updatedTableData1.splice(index, 1);
    setTableData1(updatedTableData1);
   
    console.log(updatedTableData1);

  };

  const createVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    let creationPromise;
    if (documentId === undefined) {
      let doc = createdSet          
      creationPromise = apiClient.createSet(doc).then(response=>response.initialVersion) 
           
    } else {
      creationPromise = apiClient.createSetVersion(documentId, createdVersion);
    }
  
    creationPromise.then(version => {
      if (tableData1 === undefined)
        return version;
       tableData1.forEach(member => {
            docs.documentId=member[0];
            docs.versionId=member[1];
            console.log(docs);
           apiClient.addDocumentVersion(version.documentSetId, version.setVersionId,docs)
        })
      
      return version;
    })   
  };


  
  if (isCreatingNewDocument){
    return (<>
      <SetNameEditor disabled={parentVersionId !== undefined} defaultValue={set?. documentSetName} onChange={documentSetName => setCreatedSet({ ...createdSet, documentSetName })} />
           
      
      <div>
      
      <div>
          <select value={selectedDocumentId} onChange={handleDocumentChange}>
            <option value="">Wybierz dokument</option>
            {documents.map((document) => (
              <option key={document.documentId} value={document.documentId}>
                {document.documentName}
              </option>
            ))}
          </select>

      
          <select value={selectedVersionId} onChange={handleVersionChange}>
            <option value="" >Wybierz wersję</option>
            {version.map((version) => (
              <option key={version.versionId} value={version.versionId}>
                {version.versionName}
              </option>
            ))}
          </select>

          <button onClick={handleAddElement}>Dodaj element</button>
        </div>
      
      {tableData.length>0 && (
      <table style={{border: '1px solid black', borderCollapse: 'collapse',	width: '100%'}}>
        <thead>
          <tr >
            <th>Nr</th>
            <th >Plik</th>
            <th >Wersja</th>
            <th >Akcje</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((data, index) => (
            <tr key={index} >
              <td>{index}</td>
              <td>{data[0]}</td>
              <td>{data[1]}</td>
              <td> <button onClick={() => handleDelete(index)}>Usuń</button> </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  

      <Button   onClick={createVersion}>Create1</Button>
    </>);
    }else
    return null;

  
}

export default SetCreator;
