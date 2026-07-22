import { AddUserMessage } from "./application/use-cases/AddUserMessage.js";
import { GenerateAssistantReply } from "./application/use-cases/GenerateAssistantReply.js";
import { LoadHistory } from "./application/use-cases/LoadHistory.js";
import { PollinationsAssistantGateway } from "./infrastructure/ai/PollinationsAssistantGateway.js";
import { LocalStorageChatRepository } from "./infrastructure/storage/LocalStorageChatRepository.js";
import { ChatController } from "./ui/controllers/ChatController.js";
import { ChatView } from "./ui/views/ChatView.js";

const APP_KEY_STORAGE = "pollinations_app_key";
const ACCESS_TOKEN_STORAGE = "pollinations_access_token";
const OAUTH_STATE_STORAGE = "pollinations_oauth_state";
const appKeyInput = document.getElementById("appKey");
const connectButton = document.getElementById("conectarPollinations");
const disconnectButton = document.getElementById("desconectarPollinations");
const connectionStatus = document.getElementById("estadoConexion");
const temporaryTokenInput = document.getElementById("tokenTemporal");
const useTemporaryTokenButton = document.getElementById("usarTokenTemporal");

const redirectUri = `${location.origin}${location.pathname}`;
appKeyInput.value = localStorage.getItem(APP_KEY_STORAGE) ?? "";

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function updateConnectionStatus() {
  const connected = Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE));
  connectionStatus.textContent = connected
    ? "✓ Cuenta conectada en este navegador"
    : "Cuenta no conectada";
  disconnectButton.hidden = !connected;
}

function receiveAuthorization() {
  const params = new URLSearchParams(location.hash.slice(1));
  const accessToken = params.get("api_key");
  const error = params.get("error");
  if (!accessToken && !error) return false;

  const expectedState = sessionStorage.getItem(OAUTH_STATE_STORAGE);
  const receivedState = params.get("state");
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  sessionStorage.removeItem(OAUTH_STATE_STORAGE);

  if (error) {
    connectionStatus.textContent = `No se autorizó la conexión: ${error}`;
    return true;
  }
  if (!expectedState || receivedState !== expectedState || !accessToken.startsWith("sk_")) {
    connectionStatus.textContent = "La respuesta de autorización no es válida.";
    return true;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE, accessToken);
  return false;
}

const authorizationHasError = receiveAuthorization();
if (!authorizationHasError) updateConnectionStatus();

const repository = new LocalStorageChatRepository(localStorage, "memoria_llm");
const assistantGateway = new PollinationsAssistantGateway({
  endpoint: "https://gen.pollinations.ai/v1/chat/completions",
  accessTokenProvider: () => localStorage.getItem(ACCESS_TOKEN_STORAGE)
});
const view = new ChatView({
  chat: document.getElementById("chat"),
  form: document.getElementById("formChat"),
  input: document.getElementById("entrada"),
  status: document.getElementById("estado"),
  submitButton: document.getElementById("btnEnviar")
});

connectButton.addEventListener("click", () => {
  const appKey = appKeyInput.value.trim();
  if (!appKey.startsWith("pk_")) {
    view.setStatus("El identificador de aplicación debe comenzar con pk_.");
    return;
  }

  localStorage.setItem(APP_KEY_STORAGE, appKey);
  const state = randomState();
  sessionStorage.setItem(OAUTH_STATE_STORAGE, state);
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    client_id: appKey,
    state
  });
  location.assign(`https://enter.pollinations.ai/authorize?${params}`);
});

useTemporaryTokenButton.addEventListener("click", () => {
  const token = temporaryTokenInput.value.trim();
  if (!token.startsWith("sk_")) {
    view.setStatus("El token temporal debe comenzar con sk_.");
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE, token);
  temporaryTokenInput.value = "";
  updateConnectionStatus();
  view.setStatus("✓ Token guardado localmente en este navegador");
  view.focusInput();
});
disconnectButton.addEventListener("click", () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE);
  updateConnectionStatus();
  view.setStatus("Token local eliminado y cuenta desconectada.");
});

const controller = new ChatController({
  view,
  loadHistory: new LoadHistory(repository),
  addUserMessage: new AddUserMessage(repository),
  generateAssistantReply: new GenerateAssistantReply(repository, assistantGateway)
});

controller.start();


