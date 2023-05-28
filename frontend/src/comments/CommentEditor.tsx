import { FunctionComponent } from 'react';
import { Form } from 'react-bootstrap';

type CommentEditorProps = {
    defaultValue?: string;
    disabled?: boolean;
    onChange?: (name: string) => any;
  };
  
  export const CommentEditor: FunctionComponent<CommentEditorProps> = ({ defaultValue, disabled, onChange }) => {
    return (
      <Form.Group className="mb-3" controlId="comment">
        <Form.Label>Comment</Form.Label>
        <Form.Control disabled={disabled} type="text" defaultValue={defaultValue} onChange={evt => onChange?.(evt.target.value)} />
      </Form.Group>
    );
  }
  
  export default CommentEditor;