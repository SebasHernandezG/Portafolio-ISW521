"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsNotification = void 0;
const BaseNotification_1 = __importDefault(require("./BaseNotification"));
class SmsNotification extends BaseNotification_1.default {
    sendNotification() {
        this.logNotification("SMS");
        console.log(`Enviando SMS a ${this.recipient} con el mensaje: ${this.message}`);
    }
}
exports.SmsNotification = SmsNotification;
