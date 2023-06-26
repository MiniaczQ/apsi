export type CreateSet = {
    documentSetName: string 
    initialVersion: {
        setVersionName: string,
        documentVersionIds:string[][],
    
    }   
};

export default CreateSet;
