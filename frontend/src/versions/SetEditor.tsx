import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { LoginState } from '../App';
import ApiClient from '../api/ApiClient';

import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import { Form } from 'react-bootstrap';
import SetNameEditor from './SetNameEditor';
import CreateSet from '../models/CreateSet';
import CreateSetVersion from '../models/CreateSetVersion';
import SetDocumentVersion from '../models/SetDocumentVersion';

import Set from '../models/Set';
import SetVersion from '../models/SetVersion';
import SetVersionNameChooser from './SetVersionNameChooser';



type VersionCreatorProps = {
  loginState: LoginState,
  apiClient: ApiClient
};

export const SetCreator: FunctionComponent<VersionCreatorProps> = ({ loginState, apiClient }) => {
  const navigate = useNavigate();

  const searchParams = useSearchParams()[0];
  const documentSetId = searchParams.get('documentSetId') ?? undefined;
  const SetVersionId = searchParams.get('setVersionId') ?? undefined;
  const isCreatingNewDocument = documentSetId === undefined && SetVersionId === undefined;
  const isCreatingNewVersion = documentSetId!==undefined && SetVersionId !==undefined;
  


  const [, setIsLoading] = useState(true);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [version, setVersion] = useState<DocumentVersion[]>([]);
  const [tableData, setTableData] = useState<[string, string][]>([]);  
  const [tableData1, setTableData1] = useState<[string,string][]>([]);
 
  const [documentsets,setdocumentSets]=useState<Set[]>();
  const [documentSetVersion,setSetVersion]=useState<SetVersion[]>();

  const[previoustableData,setPrevious]=useState<[string,string][]>([]);
  const[previoustableData1,setPrevious1]=useState<[string,string][]>([]);

  



  useEffect(()=>{
    let usersPromise =apiClient.getDocuments().then(response =>{
    
      
      setDocuments(response)
    });
    let promises =[usersPromise];
    if(isCreatingNewVersion){
        
        let setsPromise=apiClient.getSets().then(response => setdocumentSets(response));

        let docsetsPromise=apiClient.getSetVersions(documentSetId).then(response =>setSetVersion(response));
        promises = [...promises,setsPromise, docsetsPromise];
    }
    Promise.all(promises)
      .then(() => setIsLoading(false));
  }, [apiClient, isCreatingNewVersion]);

  const EditedSet=documentsets?.find(set=>set.documentSetId===documentSetId);

  const SetVersion = documentSetVersion?.find(version => version.setVersionId === SetVersionId);

  const parents = SetVersion?.parents?.map(parentId => documentSetVersion?.find(version => version.setVersionId === parentId));

  const parentNames = parents?.map(parent => parent?.setVersionName)?.filter(x => x !== undefined)?.join(', ');
  
  useEffect(()=>{
    if (SetVersion ===undefined)
        return;
        
        
        setCreatedVersion(createdVersion => ({
            ...createdVersion,            
            parents: [SetVersion.setVersionId],
          }));
          
          if(isCreatingNewVersion){
           
            const parentdocver=SetVersion?.documentVersionIds
            setSet(EditedSet);
            

            parentdocver?.forEach(async agregacje=>{    
                

                const selectedDocument = documents.find((doc) => doc.documentId === agregacje[0]);
                const response= apiClient.getVersions(agregacje[0]);
    
                const selectedVersion = (await response).find((ver) => ver.versionId === agregacje[1]);
                
              
                if (selectedDocument && selectedVersion) {
                    const newData: [string, string] = [selectedDocument.documentName, selectedVersion.versionName];
                    setTableData((prevData) => [...prevData, newData]);
                    setPrevious((prevData) => [...prevData, newData]);
                    const newData1: [string, string] = [selectedDocument.documentId, selectedVersion.versionId];
                    setTableData1((prevData) => [...prevData, newData1]);
                    setPrevious1((prevData) => [...prevData, newData1]);    
    
                     
    
    
                }   
            })
            
        }



        }, [SetVersion]);




  const [set, setSet] = useState<Set>();
  

  const [createdSet, setCreatedSet] = useState<CreateSet>({
    documentSetName: 'frontendowy',
    initialVersion: {
        setVersionName: '1',
        documentVersionIds:[],
    
    }  
    
  });
  const [createdVersion, setCreatedVersion] = useState<CreateSetVersion>({
    setVersionName: '1', 
    documentVersionIds:[],  
    parents: [],
  });   






  const changeVersion = useCallback(
    (setVersionName: string) => setCreatedVersion(createdVersion => ({ ...createdVersion, setVersionName })),
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



  

  

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    
    
    apiClient.getDocuments().then(response =>{
      
      const filteredResponse = response.filter((item) => {
        return !tableData.some((tableItem) => tableItem[0] === item.documentName);
      });       

      setDocuments(filteredResponse)
    });
    
    const selectedId = event.target.value;
    setSelectedDocumentId(selectedId);

    if (selectedId!='') {
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
    
    if(selectedDocumentId!=''){
    const selectedVersion = event.target.value;
    
    setSelectedVersionId(selectedVersion);
    }
    else{
      setSelectedVersionId('');
      setVersion([]);
    }
    
  };
  

  const handleAddElement = () => {
    apiClient.getDocuments().then(response =>{
      
      const filteredResponse = response.filter((item) => {
        return !tableData.some((tableItem) => tableItem[0] === item.documentName);
      });       

      setDocuments(filteredResponse)
    });
    
    
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

    setSelectedDocumentId('');
    setSelectedVersionId('');
  };

  const handleDelete = (index: number) => {
    const updatedTableData = [...tableData];
    updatedTableData.splice(index, 1);
    setTableData(updatedTableData);

    const updatedTableData1 = [...tableData1];
    updatedTableData1.splice(index, 1);
    setTableData1(updatedTableData1);   
    

  };

  const createVersion: React.MouseEventHandler<HTMLButtonElement> = async (evt) => {
    (evt.target as HTMLButtonElement).disabled = true;
    
    if(previoustableData1!==undefined && SetVersion!==undefined){
      previoustableData1.forEach(record=>{
        apiClient.removeVersion(SetVersion?.documentSetId,SetVersion?.setVersionId,record[0]);
      })
    }
    
      if (tableData1 === undefined || SetVersion===undefined){
        return;
      }
        
       tableData1.forEach(member => {
            docs.documentId=member[0];
            docs.versionId=member[1];
            
           apiClient.addDocumentVersion(SetVersion?.documentSetId, SetVersion?.setVersionId,docs)
        })
      
        
       
  };

  const parentVersionField = (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent versions</Form.Label>
      <Form.Control disabled type="text" value={parentNames ?? ''} />
      <Form.Label>Version name</Form.Label>
      <Form.Control disabled type="text" value={SetVersion?.setVersionName ?? ''} />
    </Form.Group>
  );


  
 
  if(documentSetVersion===undefined || SetVersion=== undefined)
    return null;


    return (<>
        <SetNameEditor disabled={SetVersionId !== undefined} defaultValue={set?. documentSetName} onChange={documentSetName => setCreatedSet({ ...createdSet, documentSetName })} />
        {/*<SetVersionNameChooser versions={documentSetVersion} parentVersion={parentVersion} onChange={changeVersion} />*/}
        {parentVersionField}
        
        <div>
        
        <div style={{ display: 'flex', gap: '10px' }} >
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
        <table style={{border: '1px solid black', borderCollapse: 'collapse',	width: '100%', marginTop:'20px'}}>
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
    
  
        <Button style={{marginTop:'20px'}}  onClick={createVersion}>Save</Button>
      </>);

  
}

export default SetCreator;
