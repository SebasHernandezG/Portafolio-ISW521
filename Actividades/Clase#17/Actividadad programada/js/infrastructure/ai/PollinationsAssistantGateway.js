import { AssistantGateway } from "../../application/ports/AssistantGateway.js";

export class PollinationsAssistantGateway extends AssistantGateway {
  constructor({ endpoint, accessTokenProvider, model = "openai" }) {
    super();
    this.endpoint = endpoint;
    this.accessTokenProvider = accessTokenProvider;
    this.model = model;
  }

  buildMessages(history) {
    return [
      {
        role: "system",
        content: "Eres un asistente de IA útil, respetuoso y claro. Responde en español salvo que el usuario pida otro idioma. Contesta directamente y reconoce cuando no sabes algo."
      },
      ...history.recent(20).map(({ role, text }) => ({
        role: role === "user" ? "user" : "assistant",
        content: text
      }))
    ];
  }

  async generateReply(history) {
    const accessToken = this.accessTokenProvider()?.trim();
    if (!accessToken) {
      throw new Error("Conecta primero tu cuenta de Pollinations.");
    }

    const signal = typeof AbortSignal?.timeout === "function"
      ? AbortSignal.timeout(30000)
      : undefined;
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildMessages(history)
      }),
      signal
    });

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.error?.message || body?.message || "";
      } catch {}
      if (response.status === 401) {
        localStorage.removeItem("pollinations_access_token");
        throw new Error("La autorización venció o fue revocada. Conecta tu cuenta nuevamente.");
      }
      throw new Error(detail || `El servicio de IA respondió con HTTP ${response.status}.`);
    }

    const body = await response.json();
    const reply = body?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("El modelo devolvió una respuesta vacía.");
    return reply;
  }
}

