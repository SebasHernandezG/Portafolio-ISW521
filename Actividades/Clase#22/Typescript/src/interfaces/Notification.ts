export interface Notification {
  readonly recipient: string;
  readonly message: string;
  sendNotification(): void;
}
