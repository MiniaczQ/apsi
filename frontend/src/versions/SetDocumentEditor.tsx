import { Fragment, FunctionComponent, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import Select, { Options } from 'react-select';

import DocumentVersionMember, { DocumentVersionMemberRole, memberRoles } from '../models/DocumentVersionMember';
import User from '../models/User';


type RoleEditorProps = {
  options: User[];
  defaultValue: DocumentVersionMember[];
  disabled?: boolean;
  onChange?: (addedMembers: Record<DocumentVersionMemberRole, string[]>, removedMembers: Record<DocumentVersionMemberRole, string[]>) => any;
};

type SelectOption = {
  label: string;
  value: string;
};

function notUndefined<TValue>(value: TValue | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export const Role1Editor: FunctionComponent<RoleEditorProps> = ({ options, defaultValue, disabled, onChange }) => {
  const originalRoles = useMemo(() => Object.fromEntries(
    memberRoles.map(role => [
      role,
      defaultValue
        .filter(member => member.roles.includes(role))
        .map(member => member.userId),
    ])
  ) as Record<DocumentVersionMemberRole, string[]>, [defaultValue]);
  const [members, setMembers] = useState<Record<DocumentVersionMemberRole, string[]>>(originalRoles);

  const processedOptions: Options<SelectOption> = options.map(user => ({ label: user.username, value: user.userId }));
  const getDefaultValueForRole = (role: DocumentVersionMemberRole) => originalRoles[role].map(userId => options
    .find(user => user.userId === userId))
    .filter(notUndefined)
    .map(({ userId, username }) => ({ label: username, value: userId }));

  const setMembersOf = (role: DocumentVersionMemberRole, options: Options<SelectOption>) => {
    if (members === undefined)
      return;
    const newMembers = { ...members, [role]: options.map(option => option.value) };
    setMembers(newMembers);
    const addedMembers = Object.fromEntries(
      memberRoles.map(role => [
        role,
        newMembers[role].filter(member => !originalRoles[role].includes(member)),
      ])
    ) as Record<DocumentVersionMemberRole, string[]>;
    const removedMembers = Object.fromEntries(
      memberRoles.map(role => [
        role,
        originalRoles[role].filter(member => !newMembers[role].includes(member)),
      ])
    ) as Record<DocumentVersionMemberRole, string[]>;
    onChange?.(addedMembers, removedMembers);
  }
  const getSetMembersOfForRole = (role: DocumentVersionMemberRole) =>
    ((options: Options<SelectOption>) => setMembersOf(role, options));


  return (
    <Form.Group className="mb-3" controlId="roles">
      <Form.Label>Version owner</Form.Label>
      <p>{options.find(user => user.userId === originalRoles['owner'][0])?.username}</p>
      {([
        ['Viewers', 'viewer'],
        ['Editors', 'editor'],
        ['Reviewers', 'reviewer'],
      ] as [string, DocumentVersionMemberRole][]).map(([heading, role]) => (<Fragment key={role}>
        <Form.Label>{heading}</Form.Label>
        <Select isMulti
          isDisabled={disabled}
          defaultValue={getDefaultValueForRole(role)}
          options={processedOptions}
          onChange={getSetMembersOfForRole(role)}
        />
      </Fragment>))}
    </Form.Group>
  );
}

export default Role1Editor;
