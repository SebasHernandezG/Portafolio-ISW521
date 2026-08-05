import type { Notification } from "../interfaces/Notification";

export default abstract class BaseNotification implements Notification {
  constructor(
    public readonly recipient: string,
    public readonly message: string,
  ) {}

  abstract sendNotification(): void;

  protected logNotification(type: string): void {
    console.log(`${type} enviado a ${this.recipient}: ${this.message}`);
  }
}
