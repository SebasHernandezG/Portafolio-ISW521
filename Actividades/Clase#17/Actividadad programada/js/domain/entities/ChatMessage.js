import { ensureValidRole } from "../value-objects/Role.js";

export class ChatMessage {
  constructor({ id, role, text, createdAt }) {
    if (!text || !text.trim()) {
      throw new TypeError("El mensaje no puede estar vacío.");
    }

    this.id = id;
    this.role = ensureValidRole(role);
    this.text = text.trim();
    this.createdAt = createdAt;
    Object.freeze(this);
  }

  static create(role, text) {
    return new ChatMessage({
      id: globalThis.crypto?.randomUUID?.() ?? ChatMessage.generateId(),
      role,
      text,
      createdAt: new Date().toISOString()
    });
  }

  static fromPrimitives(data) {
    if (!data || typeof data !== "object") {
      throw new TypeError("Los datos del mensaje no son válidos.");
    }
    return new ChatMessage({
      id: data.id ?? globalThis.crypto?.randomUUID?.() ?? ChatMessage.generateId(),
      role: data.rol ?? data.role,
      text: data.texto ?? data.text,
      createdAt: data.createdAt ?? new Date().toISOString()
    });
  }

  static generateId() {
    return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  toPrimitives() {
    return {
      id: this.id,
      rol: this.role,
      texto: this.text,
      createdAt: this.createdAt
    };
  }
}
