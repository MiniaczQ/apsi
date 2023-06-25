import Role from "./Role"

export type Action = 'role removed' | 'role added' | 'new version' | 'version modified'
export type Notification = {
    notificationId: string,
    userId: string,
    action: Action,
    documentId: string,
    versionId: string,
    role: Role,
    read: boolean
}