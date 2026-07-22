import { ChatMessage } from "../../domain/entities/ChatMessage.js";
import { Role } from "../../domain/value-objects/Role.js";

export class AddUserMessage {
  constructor(repository) { this.repository = repository; }
  execute(text, history) {
    const message = ChatMessage.create(Role.USER, text);
    history.add(message);
    this.repository.save(history);
    return message;
  }
}
