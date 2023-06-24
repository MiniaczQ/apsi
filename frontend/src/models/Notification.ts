import DocumentVersion from "./DocumentVersion"
import Role from "./Role"

export type Action = 'role removed' | 'role added' | 'new version' | 'version modified'
export type Notification = {
    notificationId: string,
    userId: string,
    action: Action
    version: DocumentVersion,
    role: Role,
    read: boolean
}