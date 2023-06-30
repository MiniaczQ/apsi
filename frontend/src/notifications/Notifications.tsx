import { FunctionComponent, useState, useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';
import { Notification, eventTypeMessageResolver } from '../models/Notification';
import { LoginState } from '../App';
import DocumentVersion from '../models/DocumentVersion';
import { StateBadge } from '../models/StateBadge';
import { useNavigate } from 'react-router-dom';
import { SortedTable } from '../table/SortedTable';
import { Column } from '../table/TableBody';

type NotificationsProps = {
  loginState: LoginState;
  apiClient: ApiClient;
};

type NotificationVersion = {
  notification: Notification;
  documentName: string;
  documentVersion: DocumentVersion;
};

export const Notifications: FunctionComponent<NotificationsProps> = ({ apiClient, loginState }) => {
  const navigate = useNavigate();
  const navigateToVersionInspect = (documentId: string, versionId: string) =>
    navigate(`/version?documentId=${encodeURIComponent(documentId)}&versionId=${versionId}`);
  const [notifications, setNotifications] = useState<NotificationVersion[]>([]);

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
  };

  const sorting = (first: NotificationVersion, second: NotificationVersion) => {
    if (first.notification.seen && !second.notification.seen) {
      return 1;
    }
    if (first.notification.seen && second.notification.seen) {
      return -1;
    }
    return 0;
  };

  useEffect(() => {
    apiClient.getNotifications().then((response) => {
      response.forEach((notification) =>
        apiClient
          .getVersion(notification.documentId, notification.versionId)
          .then((version) =>
            apiClient
              .getDocument(notification.documentId)
              .then((document) =>
                setNotifications((old) =>
                  [...old, { notification: notification, documentVersion: version, documentName: document.documentName }].sort(
                    sorting
                  )
                )
              )
          )
      );
    });
  }, [apiClient, loginState]);

  const createState = (notification: NotificationVersion) => {
    if (notification.notification.seen) {
      return <>Read</>;
    }

    return (
      <>
        <Button
          variant="outline-secondary"
          onClick={async () => {
            await apiClient.markAsRead(notification.notification.eventId);
            const filteredNotifications = notifications.filter(
              (element) => element.notification.eventId !== notification.notification.eventId
            );
            notification.notification.seen = true;
            setNotifications((old) => [...filteredNotifications, notification]);
          }}
        >
          Mark as read
        </Button>
      </>
    );
  };

  const columns: Column[] = [
    { label: '#', accessor: 'index', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
    { label: 'Document version', accessor: 'document', sortable: true, sortByOrder: 'asc', rowSpan: 2 },
    { label: 'Version', accessor: 'version', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
    {
      label: 'Created at',
      accessor: 'created',
      isDate: true,
      sortable: true,
      sortByOrder: 'asc',
      colSpan: 2,
    },
    { label: 'Notification', accessor: 'notification', sortable: false, sortByOrder: 'asc', rowSpan: 2 },
    { label: 'Status', accessor: 'read', sortable: false, sortByOrder: 'asc', rowSpan: 2},
  ];

  const data = distinctByEventId(notifications).map(
    (notification: NotificationVersion, index: number) => ({
      index: index + 1,
      document: <>{notification.documentName} <StateBadge state={notification.documentVersion.versionState} /></>,
      notification: eventTypeMessageResolver(notification.notification.eventType),
      created: notification.notification.createdAt,
      version: (
        <Button
          variant="outline-secondary"
          onClick={() => navigateToVersionInspect(notification.notification.documentId, notification.notification.versionId)}
        >
          {notification.documentVersion.versionName}
        </Button>
      ),
      read: createState(notification)
    })
  );

  return (
    <Container>
      <h3>Notifications</h3>
      <SortedTable data={data} columns={columns} />
    </Container>
  );
};

export default Notifications;
