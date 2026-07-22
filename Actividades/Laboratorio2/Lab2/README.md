# Laboratorio 2 — Mini-sistema de autenticación

## Ejecución

1. Abre una terminal en esta carpeta.
2. Ejecuta el proxy:

```bash
node proxy.js
```

3. Mantén esa terminal abierta.
4. Sirve el frontend con Live Server de VS Code o con otro servidor estático.
5. Abre `index.html` desde la URL del servidor estático, no mediante doble clic.

## Pruebas para la defensa

- **400:** intenta registrar un correo ya existente o iniciar sesión con datos incorrectos. El mensaje del body se muestra en el DOM y se enfoca el campo correspondiente.
- **Offline:** llena el formulario, activa `Offline` en DevTools > Network y envía. Se muestra carga, después error de red y los inputs conservan sus valores.
- **401:** inicia sesión, modifica el valor `wc26_token` en DevTools > Application > Local Storage y recarga. La app elimina el token y vuelve al login.

## Archivos

- `index.html`: estructura y vistas.
- `styles.css`: estados visuales, accesibilidad y diseño responsive.
- `app.js`: validación, async/await, JWT y manejo de errores.
- `proxy.js`: proxy local conservado sin cambios.
