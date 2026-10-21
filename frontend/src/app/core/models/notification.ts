export type NotificationType = 'Like Milestone' | 'New Comment';
export type DeliveryChannel = 'In-App' | 'Email';

export interface Notification {
  id: string;
  userId: string;
  postId: string;
  type: NotificationType;
  channel: DeliveryChannel;
  readAt: string | null;
}

export interface NotificationPage {
  notifications: Notification[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
