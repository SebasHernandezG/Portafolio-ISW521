import { ChatMessage } from "../../domain/entities/ChatMessage.js";
import { Role } from "../../domain/value-objects/Role.js";

export class GenerateAssistantReply {
  constructor(repository, gateway) {
    this.repository = repository;
    this.gateway = gateway;
  }
  async execute(history) {
    const text = await this.gateway.generateReply(history);
    const message = ChatMessage.create(Role.ASSISTANT, text);
    history.add(message);
    this.repository.save(history);
    return message;
  }
}
