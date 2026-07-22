# Arquitectura del Asistente Frankenstein

## Ejecución

La aplicación utiliza módulos ES. Debe abrirse mediante **Live Server** u otro servidor HTTP y no directamente con `file://`.

1. Abrir la carpeta del proyecto en VS Code.
2. Ejecutar **Open with Live Server** sobre `index.html`.
3. Abrir la URL indicada, normalmente `http://127.0.0.1:5500`.
4. Si existe memoria de la versión defectuosa, eliminar `memoria_llm` desde Application > Local Storage.

## Capas

```text
js/
├── domain/
│   ├── aggregates/ChatHistory.js
│   ├── entities/ChatMessage.js
│   └── value-objects/Role.js
├── application/
│   ├── ports/
│   │   ├── AssistantGateway.js
│   │   └── ChatRepository.js
│   └── use-cases/
│       ├── AddUserMessage.js
│       ├── GenerateAssistantReply.js
│       └── LoadHistory.js
├── infrastructure/
│   ├── ai/
│   │   ├── LocalFallbackAssistant.js
│   │   └── PollinationsAssistantGateway.js
│   └── storage/LocalStorageChatRepository.js
├── ui/
│   ├── controllers/ChatController.js
│   └── views/ChatView.js
└── main.js
```

## Arquitectura hexagonal

- **Núcleo:** `domain` y `application` no dependen del DOM, localStorage ni APIs externas.
- **Puertos:** `ChatRepository` y `AssistantGateway` definen lo que necesita la aplicación.
- **Adaptadores:** `LocalStorageChatRepository`, `PollinationsAssistantGateway` y `ChatView` conectan navegador, red e interfaz.
- **Composition root:** `main.js` crea e inyecta todas las dependencias.

## Domain-Driven Design

- `ChatMessage` representa la entidad mensaje y protege sus invariantes.
- `Role` restringe los roles válidos del dominio.
- `ChatHistory` es el agregado que controla la colección y su serialización.
- Los casos de uso expresan acciones del negocio: cargar memoria, agregar pregunta y generar respuesta.

## Principios SOLID

- **S — Responsabilidad única:** cada archivo tiene una razón concreta para cambiar.
- **O — Abierto/cerrado:** puede agregarse otro proveedor de IA implementando `AssistantGateway`.
- **L — Sustitución de Liskov:** el gateway remoto y el fallback respetan el mismo contrato.
- **I — Segregación de interfaces:** persistencia y generación de respuestas son puertos separados.
- **D — Inversión de dependencias:** los casos de uso dependen de abstracciones inyectadas desde `main.js`.

## Flujo principal

```text
ChatView
  -> ChatController
    -> AddUserMessage
      -> ChatRepository
    -> GenerateAssistantReply
      -> AssistantGateway
      -> ChatRepository
```

El mensaje del usuario se persiste y pinta antes de esperar la red. La interfaz se bloquea durante una sola solicitud y se recupera en `finally`, eliminando la condición de carrera original.
