# Asistente Frankenstein

Chat web en JavaScript con memoria en `localStorage`, consulta remota y respuesta local de respaldo. La versión final separa dominio, casos de uso, infraestructura e interfaz.

## Ejecutar

Los módulos ES requieren un servidor HTTP. Use Live Server de VS Code sobre `index.html` o ejecute `npx serve .` y abra la dirección indicada.

## Probar

Con Node.js 18 o posterior, ejecute `npm test`.

La respuesta remota depende de Internet. Si la red, Pollinations o JSONPlaceholder fallan, el chat usa el asistente local de respaldo y sigue funcionando. Una memoria antigua inválida se descarta automáticamente.
