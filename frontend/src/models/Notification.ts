export type EventType = {
    statusChanged: string | undefined
    roleAdded: string | undefined
    roleRemoved: string | undefined
}

export type Notification = {
    eventId: string,
    userId: string,
    documentId: string,
    versionId: string,
    eventType: EventType,
    seen: boolean
    createdAt: Date
}

export function eventTypeMessageResolver(eventType: EventType): string{
    if(eventType.statusChanged !== undefined){
        return `Status changed: ${eventType.statusChanged}`
    }
    if(eventType.roleAdded !== undefined){
        return `Added role: ${eventType.roleAdded}`
    }
    if(eventType.roleRemoved !== undefined){
        return `Removed role: ${eventType.roleRemoved}`
    }
    return ''
}
