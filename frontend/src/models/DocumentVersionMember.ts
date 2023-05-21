export const editableMemberRoles = ['viewer', 'editor', 'reviewer'] as const;
export const memberRoles = ['owner', ...editableMemberRoles] as const;

export type DocumentVersionMemberRole = typeof memberRoles[number];

export type DocumentVersionMember = {
    userId: string,
    username: string,
    roles: DocumentVersionMemberRole[]
};

export default DocumentVersionMember;
