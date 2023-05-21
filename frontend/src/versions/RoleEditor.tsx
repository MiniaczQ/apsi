import { Fragment, FunctionComponent, useState } from 'react';
import { Form } from 'react-bootstrap';
import Select, { Options } from 'react-select';

import { DocumentVersionMemberRole } from '../models/DocumentVersionMember';
import User from '../models/User';


type RoleEditorProps = {
  options: User[];
  defaultValue?: Record<DocumentVersionMemberRole, string[]>;
  disabled?: boolean;
  onChange?: (userIdsPerRole: Record<DocumentVersionMemberRole, string[]>) => any;
};

type SelectOption = {
  label: string;
  value: string;
};

export const RoleEditor: FunctionComponent<RoleEditorProps> = ({ options, defaultValue, disabled, onChange }) => {
  const [members, setMembers] = useState<Record<DocumentVersionMemberRole, string[]> | undefined>(defaultValue);

  const processedOptions: Options<SelectOption> = options.map(user => ({ label: user.username, value: user.userId }));
  const processedDefaultValue = defaultValue && Object.fromEntries((Object.entries(defaultValue) as [DocumentVersionMemberRole, string[]][])
    .map(([role, userIds]) => [
      role,
      userIds.map(userId => processedOptions.find(option => option.value === userId))
        .filter(option => option !== undefined) as Options<SelectOption>
    ])
  ) as Record<DocumentVersionMemberRole, Options<SelectOption>>;

  const setMembersOf = (role: DocumentVersionMemberRole, options: Options<SelectOption>) => {
    if (members === undefined)
      return;
    const newMembers = { ...members, [role]: options.map(option => option.value) };
    setMembers(newMembers);
    onChange?.(newMembers);
  }
  const createSetMembersOfFunction = (role: DocumentVersionMemberRole) =>
    ((options: Options<SelectOption>) => setMembersOf(role, options));

  return (processedDefaultValue && (
    <Form.Group className="mb-3" controlId="roles">
      <Form.Label>Version owner</Form.Label>
      <p>{processedDefaultValue['owner'][0].label}</p>
      {([
        ['Viewers', 'viewer'],
        ['Editors', 'editor'],
        ['Reviewers', 'reviewer'],
      ] as [string, DocumentVersionMemberRole][]).map(([heading, role]) => (<Fragment key={role}>
        <Form.Label>{heading}</Form.Label>
        <Select isMulti
          isDisabled={disabled}
          defaultValue={processedDefaultValue[role]}
          options={processedOptions}
          onChange={createSetMembersOfFunction(role)}
        />
      </Fragment>))}
    </Form.Group>
  )) ?? null;
}

export default RoleEditor;
