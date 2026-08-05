"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseNotification {
    recipient;
    message;
    constructor(recipient, message) {
        this.recipient = recipient;
        this.message = message;
    }
    logNotification(type) {
        console.log(`${type} enviado a ${this.recipient}: ${this.message}`);
    }
}
exports.default = BaseNotification;
