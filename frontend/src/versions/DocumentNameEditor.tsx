import { FunctionComponent } from 'react';
import { Form } from 'react-bootstrap';

type DocumentNameEditorProps = {
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (name: string) => any;
};

export const DocumentNameEditor: FunctionComponent<DocumentNameEditorProps> = ({ defaultValue, disabled, onChange }) => {
  return (
    <Form.Group className="mb-3" controlId="documentName">
      <Form.Label>Document name</Form.Label>
      <Form.Control
        disabled={disabled}
        type="text"
        defaultValue={defaultValue}
        onChange={(evt) => onChange?.(evt.target.value)}
        maxLength={100}
      />
    </Form.Group>
  );
};

export default DocumentNameEditor;
