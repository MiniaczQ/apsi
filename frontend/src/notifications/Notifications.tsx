import { FunctionComponent, useState, useEffect } from 'react';
import { Badge, Button, Container, Table } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { Notification } from '../models/Notification';
import { LoginState } from '../App';
import { DocumentVersionState, DocumentVersionStateMap } from '../models/DocumentVersion';


type NotificationsProps = {
  loginState: LoginState
  apiClient: ApiClient
};

export const Notifications: FunctionComponent<NotificationsProps> = ({ apiClient, loginState }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

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


  useEffect(() => {
    apiClient.getNotifications(loginState.userId!)
      .then(response => setNotifications(response.sort((first,second) => {
        if(first.read && !second.read){
          return 1
        }
        if(first.read && second.read){
          return -1
        }
        return 0
      })));
  }, [apiClient, loginState]);

  const createState = (notification: Notification) => {
    if(notification.read){
      return <td align='center'>
        Viewed
      </td>
    }

    return <td align='center'>
    <Button variant="outline-secondary" onClick={() => {
      apiClient.markAsRead(notification.notificationId)
      const filteredNotifications = notifications.filter(element => element.notificationId !== notification.notificationId)
      notification.read = true
      setNotifications(old => [...filteredNotifications,notification])
      }}>
      Mark as read
    </Button>
  </td>
  }
  const notificationRows = notifications?.map((notification: Notification, index: number) => (
    <tr key={notification.notificationId}>
      <td>
        {index + 1}
      </td>
      <td align="center">
        {notification.version.versionId}{getStateBadge(notification.version.versionState)}
      </td>
      <td align="center">
        {notification.version.versionName}
      </td>
      <td align="center">
        {notification.role}
      </td>
      <td align="center">
        {notification.action}
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
