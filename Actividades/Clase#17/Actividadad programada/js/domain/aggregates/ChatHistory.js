import { ChatMessage } from "../entities/ChatMessage.js";

export class ChatHistory {
  #messages;

  constructor(messages = []) { this.#messages = [...messages]; }

  static restore(items) {
    if (!Array.isArray(items)) throw new TypeError("El historial debe ser un arreglo.");
    return new ChatHistory(items.map(ChatMessage.fromPrimitives));
  }

  add(message) {
    if (!(message instanceof ChatMessage)) throw new TypeError("Mensaje de dominio inválido.");
    this.#messages.push(message);
  }

  get length() { return this.#messages.length; }
  all() { return [...this.#messages]; }
  recent(limit = 10) { return this.#messages.slice(-limit); }
  lastUserMessage() { return [...this.#messages].reverse().find(({ role }) => role === "user"); }
  toPrimitives() { return this.#messages.map((message) => message.toPrimitives()); }
}
