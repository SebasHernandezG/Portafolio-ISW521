export class ChatView {
  constructor({ chat, form, input, status, submitButton }) {
    Object.assign(this, { chat, form, input, status, submitButton });
  }
  bindSubmit(handler) { this.form.addEventListener("submit", handler); }
  readInput() { return this.input.value.trim(); }
  clearInput() { this.input.value = ""; }
  renderMessage(message) {
    const element = document.createElement("div");
    element.className = `msg ${message.role}`;
    element.textContent = message.text;
    this.chat.appendChild(element);
    this.chat.scrollTop = this.chat.scrollHeight;
  }
  renderHistory(history) { history.all().forEach((message) => this.renderMessage(message)); }
  setStatus(text) { this.status.textContent = text; }
  setBusy(value) {
    this.submitButton.disabled = value;
    this.input.disabled = value;
  }
  isBusy() { return this.submitButton.disabled; }
  focusInput() { this.input.focus(); }
}
