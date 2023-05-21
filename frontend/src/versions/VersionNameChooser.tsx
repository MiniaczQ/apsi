import { FunctionComponent } from 'react';
import { Form } from 'react-bootstrap';
import Select from 'react-select';

import DocumentVersion from '../models/DocumentVersion';


type VersionNameChooserProps = {
  versions: DocumentVersion[];
  parentVersion: DocumentVersion;
  disabled?: boolean;
  onChange?: (name: string) => any;
};

export const VersionNameChooser: FunctionComponent<VersionNameChooserProps> = ({ versions, parentVersion, disabled, onChange }) => {
  const getNextVersion = (prefix: string) => prefix + (1 + versions
    .map(version => version.versionName.match(`^${prefix.replaceAll('.', '\\.')}(\\d+)$`)?.[1])
    .filter(number => number !== undefined)
    .map(number => Number(number))
    .reduce((acc, val) => Math.max(acc, val), 0));

  const getNestedVersionName = (versionName: string) => getNextVersion(versionName + '.');
  const getSameLevelVersionName = (versionName: string) => {
    const lastDotIndex = versionName.lastIndexOf('.');
    const prefix = lastDotIndex === -1 ? '' : versionName.substring(0, lastDotIndex + 1);
    return getNextVersion(prefix);
  };
  const getParentLevelVersionNames = (versionName: string) => {
    const splittedVersion = versionName.split('.');
    const parentVersions = [];
    for (let i = 1; i < splittedVersion.length; i++)
      parentVersions.push(splittedVersion.slice(0, -i).join('.'));
    return parentVersions.map(version => getSameLevelVersionName(version));
  };

  const possibleNames = [getNestedVersionName(parentVersion.versionName)]
    .concat([getSameLevelVersionName(parentVersion.versionName)])
    .concat(getParentLevelVersionNames(parentVersion.versionName))
    .map(name => ({ value: name, label: name }));


  return (
    <Form.Group className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent version name</Form.Label>
      <Form.Control disabled type="text" value={parentVersion.versionName} />
      <Form.Label>New version name</Form.Label>
      <Select required
        options={possibleNames}
        isDisabled={disabled}
        onChange={selected => selected?.value && onChange?.(selected.value)}
      />
    </Form.Group>
  );
}

export default VersionNameChooser;
