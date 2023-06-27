import { FunctionComponent, useCallback, useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import Select from 'react-select';
import SetVersion from '../models/SetVersion';


import DocumentVersion from '../models/DocumentVersion';


type VersionNameChooserProps = {
  versions: SetVersion[];
  parentVersion: SetVersion;
  disabled?: boolean;
  onChange?: (name: string) => any;
};

export const SetVersionNameChooser: FunctionComponent<VersionNameChooserProps> = ({ versions, parentVersion, disabled, onChange }) => {
  const getNextVersion = useCallback(
    (prefix: string) => prefix + (
      1 + versions
        .map(version => version.setVersionName.match(`^${prefix.replaceAll('.', '\\.')}(\\d+)$`)?.[1])
        .filter(number => number !== undefined)
        .map(number => Number(number))
        .reduce((acc, val) => Math.max(acc, val), 0)
    ),
    [versions],
  );

  const getNestedVersionName = useCallback(
    (versionName: string) => getNextVersion(versionName + '.'),
    [getNextVersion],
  );
  const getSameLevelVersionName = useCallback(
    (versionName: string) => {
      const lastDotIndex = versionName.lastIndexOf('.');
      const prefix = lastDotIndex === -1 ? '' : versionName.substring(0, lastDotIndex + 1);
      return getNextVersion(prefix);
    },
    [getNextVersion],
  );
  const getParentLevelVersionNames = useCallback(
    (versionName: string) => {
      const splittedVersion = versionName.split('.');
      const parentVersions = [];
      for (let i = 1; i < splittedVersion.length; i++)
        parentVersions.push(splittedVersion.slice(0, -i).join('.'));
      return parentVersions.map(version => getSameLevelVersionName(version));
    },
    [getSameLevelVersionName],
  );

  const possibleNames = useMemo(
    () => [getNestedVersionName(parentVersion.setVersionName)]
      .concat([getSameLevelVersionName(parentVersion.setVersionName)])
      .concat(getParentLevelVersionNames(parentVersion.setVersionName))
      .map(name => ({ value: name, label: name })),
    [parentVersion, getNestedVersionName, getSameLevelVersionName, getParentLevelVersionNames]
  );
  useEffect(() => onChange?.(possibleNames[0]?.value), [onChange, possibleNames]);

  return (
    <Form.Group  className="mb-3" controlId="parentVersionName">
      <Form.Label>Parent version name</Form.Label>
      <Form.Control disabled type="text" value={parentVersion.setVersionName} />
      <Form.Label style={{marginTop:'20px'}}>New version name</Form.Label>
      <Select required
        options={possibleNames}
        defaultValue={possibleNames[0]}
        isDisabled={disabled}
        onChange={selected => selected?.value && onChange?.(selected.value)}
      />
    </Form.Group>
  );
}

export default SetVersionNameChooser;
