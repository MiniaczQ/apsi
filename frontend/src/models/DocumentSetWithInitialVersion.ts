import DocumentSet from './DocumentSet';
import DocumentSetVersion from './DocumentSetVersion';

type DocumentSetWithInitialVersion = {
  document: DocumentSet;
  initialVersion: DocumentSetVersion;
};

export default DocumentSetWithInitialVersion;
