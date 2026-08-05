import BaseNotification from "./BaseNotification";

export class SmsNotification extends BaseNotification {
  sendNotification(): void {
    this.logNotification("SMS");
    console.log(
      `Enviando SMS a ${this.recipient} con el mensaje: ${this.message}`,
    );
  }
}
