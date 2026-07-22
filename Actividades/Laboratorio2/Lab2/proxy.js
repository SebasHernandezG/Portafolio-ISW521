/**
 * proxy.js
 * ------------------------------------------------------------------
 * Proxy local para desarrollo. NO requiere instalar nada (usa solo
 * módulos nativos de Node: http/https). Se ejecuta con:
 *
 *     node proxy.js
 *
 * y escucha en http://localhost:3000
 *
 * QUÉ HACE:
 * Reenvía cualquier request que le llegue (GET, POST, OPTIONS, etc.)
 * hacia https://worldcup26.ir con la misma ruta y el mismo body,
 * y le agrega a la respuesta los headers CORS que el servidor real
 * no está mandando bien en el preflight de /auth/register.
 *
 * Como tu navegador ahora habla con localhost (mismo origen que tu
 * frontend, si sirves todo desde 127.0.0.1), el bloqueo de CORS
 * desaparece: el navegador nunca necesita permiso especial para
 * hablar con "el mismo origen".
 * ------------------------------------------------------------------
 */

const http = require("http");
const https = require("https");

const TARGET_HOST = "worldcup26.ir";
const LOCAL_PORT = 3000;

const server = http.createServer((req, res) => {
  // 1) Preflight OPTIONS: lo respondemos NOSOTROS, aquí mismo,
  //    sin siquiera llamar al servidor real. Esto evita depender
  //    de que worldcup26.ir mande bien Access-Control-Allow-Origin.
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept",
    });
    res.end();
    return;
  }

  // 2) Petición real: la reenviamos tal cual a worldcup26.ir
  const bodyChunks = [];
  req.on("data", (chunk) => bodyChunks.push(chunk));

  req.on("end", () => {
    const body = Buffer.concat(bodyChunks);

    const upstreamReq = https.request(
      {
        hostname: TARGET_HOST,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: TARGET_HOST, // el host header debe apuntar al destino real
        },
      },
      (upstreamRes) => {
        // Copiamos status y headers de la respuesta real...
        const headers = { ...upstreamRes.headers };
        // ...pero forzamos nosotros el CORS, por si el server real
        // no lo trae o lo trae incompleto.
        headers["access-control-allow-origin"] = "*";
        headers["access-control-allow-credentials"] = "true";

        res.writeHead(upstreamRes.statusCode, headers);
        upstreamRes.pipe(res);
      }
    );

    upstreamReq.on("error", (err) => {
      console.error("Error hablando con worldcup26.ir:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Proxy no pudo contactar al servidor real." }));
    });

    if (body.length > 0) upstreamReq.write(body);
    upstreamReq.end();
  });
});

server.listen(LOCAL_PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${LOCAL_PORT}`);
  console.log(`Reenviando todo hacia https://${TARGET_HOST}`);
});
