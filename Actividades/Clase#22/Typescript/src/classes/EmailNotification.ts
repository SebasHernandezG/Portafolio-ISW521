import BaseNotification from "./BaseNotification";

export class EmailNotification extends BaseNotification {
  constructor(
    recipient: string,
    message: string,
    public readonly subject: string,
  ) {
    super(recipient, message);
  }

  sendNotification(): void {
    this.logNotification("Email");
  }
}
