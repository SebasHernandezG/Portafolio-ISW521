"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotification = void 0;
const BaseNotification_1 = __importDefault(require("./BaseNotification"));
class EmailNotification extends BaseNotification_1.default {
    subject;
    constructor(recipient, message, subject) {
        super(recipient, message);
        this.subject = subject;
    }
    sendNotification() {
        this.logNotification("Email");
    }
}
exports.EmailNotification = EmailNotification;
