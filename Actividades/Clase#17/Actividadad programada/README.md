# Asistente Frankenstein

Chat web en JavaScript conectado a un modelo de IA generativa mediante la API de Pollinations. Conserva los últimos mensajes en `localStorage` y los envía como contexto para mantener la conversación.

## Configuración de Pollinations

La API actual usa BYOP (Bring Your Own Pollen) para aplicaciones web:

1. Cree una **App Key** (`pk_...`) en `https://enter.pollinations.ai/keys`.
2. Registre como Redirect URI la dirección exacta donde abre `index.html` con Live Server.
3. Abra la aplicación y despliegue **Configurar conexión con la IA**.
4. Ingrese la App Key y pulse **Conectar cuenta**.
5. Autorice el uso en Pollinations. Al regresar, el chat quedará conectado durante la sesión del navegador.

La App Key pública se guarda en `localStorage`. El token autorizado se recibe en el fragmento de la URL, se elimina inmediatamente de la dirección y se conserva en el `localStorage` de este navegador. También puede pegar manualmente un token `sk_` en el campo **Token local**; se guardará solo en este navegador y nunca en los archivos del proyecto.

## Ejecutar

Los módulos ES requieren un servidor HTTP. Use Live Server de VS Code sobre `index.html`.

## Probar

Con Node.js 18 o posterior instalado, ejecute `npm test`.

Si la red, la autorización o el proveedor fallan, la interfaz muestra el error real. No sustituye la respuesta con frases locales preprogramadas.


