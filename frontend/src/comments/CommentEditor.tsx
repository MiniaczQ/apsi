import { FunctionComponent } from 'react';
import { Form } from 'react-bootstrap';

type CommentEditorProps = {
  value?: string;
  disabled?: boolean;
  onChange?: (name: string) => any;
};

export const CommentEditor: FunctionComponent<CommentEditorProps> = ({ value, disabled, onChange }) => {
  return (
    <Form.Group className="mb-3" controlId="comment">
      <Form.Label>Comment</Form.Label>
      <Form.Control disabled={disabled} type="text" value={value} onChange={(evt) => onChange?.(evt.target.value)} maxLength={1000}/>
    </Form.Group>
  );
};

export default CommentEditor;
