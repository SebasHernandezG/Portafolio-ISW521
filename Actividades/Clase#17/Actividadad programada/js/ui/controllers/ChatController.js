export class ChatController {
  constructor({ view, loadHistory, addUserMessage, generateAssistantReply }) {
    Object.assign(this, { view, loadHistory, addUserMessage, generateAssistantReply });
    this.history = null;
  }

  start() {
    this.history = this.loadHistory.execute();
    this.view.renderHistory(this.history);
    if (this.history.length > 0) {
      this.view.setStatus(`Memoria restaurada: ${this.history.length} mensajes`);
    }
    this.view.bindSubmit((event) => this.handleSubmit(event));
  }

  async handleSubmit(event) {
    event.preventDefault();
    const text = this.view.readInput();
    if (!text || this.view.isBusy()) return;
    const userMessage = this.addUserMessage.execute(text, this.history);
    this.view.renderMessage(userMessage);
    this.view.clearInput();
    this.view.setStatus("Pensando...");
    this.view.setBusy(true);
    try {
      const reply = await this.generateAssistantReply.execute(this.history);
      this.view.renderMessage(reply);
      this.view.setStatus("✓ Respuesta recibida");
    } catch (error) {
      console.error(error);
      this.view.setStatus(`Error al consultar el asistente: ${error.message}`);
    } finally {
      this.view.setBusy(false);
      this.view.focusInput();
    }
  }
}
