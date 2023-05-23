import { FunctionComponent } from 'react';
import { Form } from 'react-bootstrap';


type VersionContentEditorProps = {
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (content: string) => any;
};

export const VersionContentEditor: FunctionComponent<VersionContentEditorProps> = ({ defaultValue, disabled, onChange }) => {
  return (
    <Form.Group className="mb-3" controlId="content">
      <Form.Label>Content</Form.Label>
      <Form.Control as="textarea"
        disabled={disabled}
        rows={5}
        defaultValue={defaultValue}
        onChange={evt => onChange?.(evt.target.value)}
      />
    </Form.Group>
  );
}

export default VersionContentEditor;
