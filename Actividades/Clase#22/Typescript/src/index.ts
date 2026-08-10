import { EmailNotification } from "./classes/EmailNotification";
import { SmsNotification } from "./classes/SmsNotification";
import { NotificationService } from "./service/NotificationService";

const notificationService = new NotificationService();

const notifications = [
  new EmailNotification(
    "jeff@example.com",
    "Bienvenido al sistema",
    "Bienvenida",
  ),
  new SmsNotification("8888-8888", "Tu codigo de verificacion es 1234"),
];

notificationService.sendAll(notifications);
