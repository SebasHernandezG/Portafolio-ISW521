import { AddUserMessage } from "./application/use-cases/AddUserMessage.js";
import { GenerateAssistantReply } from "./application/use-cases/GenerateAssistantReply.js";
import { LoadHistory } from "./application/use-cases/LoadHistory.js";
import { LocalFallbackAssistant } from "./infrastructure/ai/LocalFallbackAssistant.js";
import { PollinationsAssistantGateway } from "./infrastructure/ai/PollinationsAssistantGateway.js";
import { LocalStorageChatRepository } from "./infrastructure/storage/LocalStorageChatRepository.js";
import { ChatController } from "./ui/controllers/ChatController.js";
import { ChatView } from "./ui/views/ChatView.js";

const repository = new LocalStorageChatRepository(localStorage, "memoria_llm");
const assistantGateway = new PollinationsAssistantGateway({
  modelEndpoint: "https://text.pollinations.ai",
  verificationEndpoint: "https://jsonplaceholder.typicode.com/posts",
  fallback: new LocalFallbackAssistant()
});
const view = new ChatView({
  chat: document.getElementById("chat"),
  form: document.getElementById("formChat"),
  input: document.getElementById("entrada"),
  status: document.getElementById("estado"),
  submitButton: document.getElementById("btnEnviar")
});
const controller = new ChatController({
  view,
  loadHistory: new LoadHistory(repository),
  addUserMessage: new AddUserMessage(repository),
  generateAssistantReply: new GenerateAssistantReply(repository, assistantGateway)
});

controller.start();
