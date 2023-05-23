import { FunctionComponent, useState } from 'react';
import { Form, Tab, Row, ListGroup, Col } from 'react-bootstrap';

import styles from './docVer.module.css';
import DocumentVersion from '../models/DocumentVersion';


type VersionMergingOptionsProps = {
  /** Without parent version. */
  versions: DocumentVersion[];
  disabled?: boolean;
  onChange?: (selected: string[]) => any;
};

export const VersionMergingOptions: FunctionComponent<VersionMergingOptionsProps> = ({ versions, disabled, onChange }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const isChecked = (value: string) => selected.indexOf(value) !== -1;
  const setSelectedAndOnChange = (newSelected: string[]) => {
    setSelected(newSelected);
    onChange?.(newSelected);
  };
  const updateSelected = (value: string, checked: boolean) =>
    setSelectedAndOnChange(checked ? [...selected, value] : selected.filter(entry => entry !== value));

  return (
    <Form.Group className="mb-3" controlId="merged">
      <Form.Label>Merge versions</Form.Label>
      <Tab.Container id="list-group-tabs-example">
        <Row>
          <Col sm={2}>
            <ListGroup>
              {versions.map(({ versionId, versionName }) => (
                <ListGroup.Item key={versionId}
                  disabled={disabled}
                  action href={`#version-${versionId}`}
                  variant={isChecked(versionId) ? 'primary' : 'secondary'}
                >
                  <Form.Check checked={isChecked(versionId)}
                    id={`checkbox-${versionId}`}
                    onChange={evt => updateSelected(versionId, evt.target.checked)}
                    label={versionName}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col sm={8}>
            <Tab.Content>
              {versions.map(({ versionId, content }) => (
                <Tab.Pane key={versionId} eventKey={`#version-${versionId}`}>
                  <Form.Label>Version content preview</Form.Label>
                  <div className={[styles.textblack, styles.versionContent].join(' ')}>
                    {content}
                  </div>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Form.Group>
  );
}

export default VersionMergingOptions;
