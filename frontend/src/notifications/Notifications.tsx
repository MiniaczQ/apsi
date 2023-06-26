import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container, Table } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { Notification, eventTypeMessageResolver } from '../models/Notification';
import { LoginState } from '../App';
import DocumentVersion from '../models/DocumentVersion';
import { StateBadge } from '../models/StateBadge';
import { useNavigate } from 'react-router-dom';


type NotificationsProps = {
  loginState: LoginState
  apiClient: ApiClient
};

type NotificationVersion = {
  notification: Notification
  documentName: string
  documentVersion: DocumentVersion
}

export const Notifications: FunctionComponent<NotificationsProps> = ({ apiClient, loginState }) => {
  const navigate = useNavigate();
  const navigateToVersionInspect = (documentId: string, versionId: string) => navigate(`/DocVer?documentId=${encodeURIComponent(documentId)}&versionId=${versionId}`);
  const [notifications, setNotifications] = useState<NotificationVersion[]>([])

  const distinctByEventId = (array: NotificationVersion[]) => {
    const uniqueKeys = new Set();
    return array.reduce((result: NotificationVersion[], element) => {
      const elementKey = element.notification.eventId;
      if (!uniqueKeys.has(elementKey)) {
        uniqueKeys.add(elementKey);
        result.push(element);
      }
      return result;
    }, []);
  }

  const sorting = (first: NotificationVersion,second: NotificationVersion) => {
      if(first.notification.seen && !second.notification.seen){
        return 1
      }
      if(first.notification.seen && second.notification.seen){
        return -1
      }
      return 0
    }

  useEffect(() => {
    apiClient.getNotifications()
      .then(response => {
        response.forEach(notification => apiClient.getVersion(notification.documentId, notification.versionId)
        .then(version => apiClient.getDocument(notification.documentId).then(document => setNotifications(old => [...old, {notification: notification, documentVersion: version, documentName: document.documentName}].sort(sorting)))))
      });
  }, [apiClient, loginState]);

  const createState = (notification: NotificationVersion) => {
    if(notification.notification.seen){
      return <td align='center'>
        Viewed
      </td>
    }

    return <td align='center'>
    <Button variant="outline-secondary" onClick={() => {
      apiClient.markAsRead(notification.notification.eventId)
      const filteredNotifications = notifications.filter(element => element.notification.eventId !== notification.notification.eventId)
      notification.notification.seen = true
      setNotifications(old => [...filteredNotifications,notification])
      }}>
      Mark as read
    </Button>
  </td>
  }

  const notificationRows = distinctByEventId(notifications).map((notification: NotificationVersion, index: number) => (
    <tr key={notification.notification.eventId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {notification.documentName}
        <StateBadge state={notification.documentVersion.versionState}/>
      </td>
      <td align="center">
      <Button variant="outline-secondary" onClick={() => navigateToVersionInspect(notification.notification.documentId, notification.notification.versionId)}>
      {notification.documentVersion.versionName}
        </Button>
        
      </td>
      <td align="center">
        {eventTypeMessageResolver(notification.notification.eventType)}
      </td>
      {createState(notification)}
    </tr>
  ));

  return (
    <Container>
      <h3>
        Notifications
      </h3>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th >
              #
            </th>
            <th >
              Document name
            </th>
            <th >
              Version name
            </th>
            <th >
              Notification
            </th>
            <th>
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {notificationRows}
        </tbody>
      </Table>
    </Container>
  );
}

export default Notifications;
