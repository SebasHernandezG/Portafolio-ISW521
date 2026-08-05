import type { Notification } from "../interfaces/Notification";

export class NotificationService {
  send(notification: Notification): void {
    notification.sendNotification();
  }

  sendAll(notifications: Notification[]): void {
    notifications.forEach((notification) => this.send(notification));
  }
}
