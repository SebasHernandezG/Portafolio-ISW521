import test from "node:test";
import assert from "node:assert/strict";
import { ChatHistory } from "../js/domain/aggregates/ChatHistory.js";
import { ChatMessage } from "../js/domain/entities/ChatMessage.js";
import { Role } from "../js/domain/value-objects/Role.js";
import { LocalFallbackAssistant } from "../js/infrastructure/ai/LocalFallbackAssistant.js";
import { LocalStorageChatRepository } from "../js/infrastructure/storage/LocalStorageChatRepository.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; }
  };
}

test("guarda y restaura el historial como JSON", () => {
  const storage = memoryStorage();
  const repository = new LocalStorageChatRepository(storage, "chat");
  const history = new ChatHistory();
  history.add(ChatMessage.create(Role.USER, "Hola"));
  repository.save(history);
  const restored = repository.load();
  assert.equal(restored.length, 1);
  assert.equal(restored.all()[0].text, "Hola");
});

test("descarta memoria corrupta sin detener la aplicación", () => {
  const repository = new LocalStorageChatRepository(memoryStorage("[object Object]"), "chat");
  assert.equal(repository.load().length, 0);
});

test("el respaldo local siempre produce una respuesta", async () => {
  const history = new ChatHistory([ChatMessage.create(Role.USER, "hola")]);
  const reply = await new LocalFallbackAssistant().generateReply(history);
  assert.match(reply, /Hola/i);
});

test("rechaza roles y mensajes inválidos", () => {
  assert.throws(() => ChatMessage.create("robot", "texto"), /Rol/);
  assert.throws(() => ChatMessage.create(Role.USER, "   "), /vacío/);
});
