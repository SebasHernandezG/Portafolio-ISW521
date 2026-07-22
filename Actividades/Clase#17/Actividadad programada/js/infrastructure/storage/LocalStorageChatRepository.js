import { ChatRepository } from "../../application/ports/ChatRepository.js";
import { ChatHistory } from "../../domain/aggregates/ChatHistory.js";

export class LocalStorageChatRepository extends ChatRepository {
  constructor(storage, key) {
    super();
    this.storage = storage;
    this.key = key;
  }
  load() {
    const stored = this.storage.getItem(this.key);
    if (stored === null) return new ChatHistory();
    try {
      return ChatHistory.restore(JSON.parse(stored));
    } catch (error) {
      console.warn("Se descartó una memoria de chat inválida.", error);
      this.storage.removeItem(this.key);
      return new ChatHistory();
    }
  }
  save(history) {
    this.storage.setItem(this.key, JSON.stringify(history.toPrimitives()));
  }
}

