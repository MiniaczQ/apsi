import { DocumentVersionState, DocumentVersionStateMap } from './DocumentVersion';
import Role from './Role';

const stateNameLUT: DocumentVersionStateMap<string> = {
  inProgress: 'In Progress',
  readyForReview: 'Ready For Review',
  reviewed: 'Reviewed',
  published: 'Published',
};

export type EventType = {
  statusChange: DocumentVersionState | undefined;
  roleAdded: Role | undefined;
  roleRemoved: Role | undefined;
};

export type Notification = {
  eventId: string;
  userId: string;
  documentId: string;
  versionId: string;
  eventType: EventType;
  seen: boolean;
  createdAt: Date;
};

export function eventTypeMessageResolver(eventType: EventType): any {
  if (eventType.statusChange !== undefined) {
    return `Status changed: ${stateNameLUT[eventType.statusChange]}`;
  }
  if (eventType.roleAdded !== undefined) {
    return `Added role: ${eventType.roleAdded}`;
  }
  if (eventType.roleRemoved !== undefined) {
    return `Removed role: ${eventType.roleRemoved}`;
  }
  return '';
}
