import { AssistantGateway } from "../../application/ports/AssistantGateway.js";

export class LocalFallbackAssistant extends AssistantGateway {
  async generateReply(history) {
    const text = history.lastUserMessage()?.text ?? "";
    const normalized = text.toLocaleLowerCase("es");
    if (/^(hola|buenas|buenos días|buenas tardes|buenas noches)\b/.test(normalized)) {
      return "¡Hola! ¿En qué puedo ayudarte hoy?";
    }
    if (/cómo estás|como estas|qué tal|que tal/.test(normalized)) {
      return "Estoy funcionando correctamente y listo para ayudarte. ¿Qué necesitas?";
    }
    if (/hello world|hola mundo/.test(normalized)) {
      return 'En JavaScript puedes escribir: console.log("Hello World");';
    }
    return `Recibí tu mensaje: “${text}”. El modelo externo no está disponible temporalmente.`;
  }
}
