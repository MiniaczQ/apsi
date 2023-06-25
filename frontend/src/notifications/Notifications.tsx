import { FunctionComponent, useState, useEffect } from 'react';
import { Badge, Button, Container, Table } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { Notification } from '../models/Notification';
import { LoginState } from '../App';
import DocumentVersion, { DocumentVersionState, DocumentVersionStateMap } from '../models/DocumentVersion';


type NotificationsProps = {
  loginState: LoginState
  apiClient: ApiClient
};

type NotificationVersion = {
  notification: Notification
  documentVersion: DocumentVersion
}
export const Notifications: FunctionComponent<NotificationsProps> = ({ apiClient, loginState }) => {
  const [notifications, setNotifications] = useState<NotificationVersion[]>([])

  function getStateBadge(state: DocumentVersionState | undefined) {
    if (state === undefined) {
      return <></>
    }
    const stateNameLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'In Progress',
      'readyForReview': 'Ready For Review',
      'reviewed': 'Reviewed',
      'published': 'Published',
    };
    const stateStyleLUT: DocumentVersionStateMap<string> = {
      'inProgress': 'primary',
      'readyForReview': 'danger',
      'reviewed': 'warning',
      'published': 'success',
    };
    return <Badge pill bg={stateStyleLUT[state]} className="ms-3">
      {stateNameLUT[state]}
    </Badge>
  }

  const sorting = (first: NotificationVersion,second: NotificationVersion) => {
      if(first.notification.read && !second.notification.read){
        return 1
      }
      if(first.notification.read && second.notification.read){
        return -1
      }
      return 0
    }
  useEffect(() => {
    apiClient.getNotifications(loginState.userId!)
      .then(response => {
        response.forEach(notification => apiClient.getVersion(notification.documentId,notification.versionId)
        .then(version => setNotifications(old => [...old, {notification: notification, documentVersion: version}].sort(sorting))))
      });
  }, [apiClient, loginState]);

  const createState = (notification: NotificationVersion) => {
    if(notification.notification.read){
      return <td align='center'>
        Viewed
      </td>
    }

    return <td align='center'>
    <Button variant="outline-secondary" onClick={() => {
      apiClient.markAsRead(notification.notification.notificationId)
      const filteredNotifications = notifications.filter(element => element.notification.notificationId !== notification.notification.notificationId)
      notification.notification.read = true
      setNotifications(old => [...filteredNotifications,notification])
      }}>
      Mark as read
    </Button>
  </td>
  }
  const notificationRows = notifications?.map((notification: NotificationVersion, index: number) => (
    <tr key={notification.notification.notificationId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {notification.documentVersion.versionId}{getStateBadge(notification.documentVersion.versionState)}
      </td>
      <td align="center">
        {notification.documentVersion.versionName}
      </td>
      <td align="center">
        {notification.notification.role}
      </td>
      <td align="center">
        {notification.notification.action}
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
              Version id
            </th>
            <th >
              Version name
            </th>
            <th >
              Role
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
