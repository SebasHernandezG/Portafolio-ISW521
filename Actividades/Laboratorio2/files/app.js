/* ==============================================================
   CONFIG
   ============================================================== */
// Apuntamos al proxy local (proxy.js) en vez de al dominio real.
// El proxy reenvía todo a https://worldcup26.ir y agrega las
// cabeceras CORS que el endpoint /auth/register no manda bien.
// Para volver a apuntar directo al servidor real (una vez que
// el bug de CORS se corrija en el backend), cambia esta línea a:
//   const API_BASE = "https://worldcup26.ir";
const API_BASE = "http://localhost:3000";
const ENDPOINTS = {
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/authenticate`,
  teams: `${API_BASE}/get/teams`,
};
const TOKEN_KEY = "wc26_token";

/* ==============================================================
   HELPERS DE DOM
   ============================================================== */
const $ = (id) => document.getElementById(id);

const views = {
  register: $("view-register"),
  login: $("view-login"),
  protected: $("view-protected"),
};

function showView(name) {
  Object.values(views).forEach((v) => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
}

/**
 * Pinta un error específico bajo un input, marca el input como inválido
 * y le devuelve el foco. Esta es LA función que usamos tanto para
 * errores de validación en cliente como para errores 400 del servidor,
 * porque el requisito pide el mismo tratamiento visual para ambos casos.
 */
function setFieldError(inputEl, errorEl, message) {
  errorEl.textContent = message;
  inputEl.classList.add("invalid");
  inputEl.focus(); // <- gestión estricta del foco
}

function clearFieldError(inputEl, errorEl) {
  errorEl.textContent = "";
  inputEl.classList.remove("invalid");
}

/**
 * Banner superior reservado EXCLUSIVAMENTE para fallos de comunicación
 * (CORS bloqueado, servidor caído, timeout, DNS, certificado SSL).
 * Se diferencia a propósito de error-message: un error de validación es
 * "tu dato está mal", un error de red es "no pude ni hablar con el server".
 */
const networkBanner = $("network-banner");
const networkBannerText = $("network-banner-text");

function showNetworkError(message) {
  networkBannerText.textContent = message;
  networkBanner.classList.remove("hidden");
}

function hideNetworkError() {
  networkBanner.classList.add("hidden");
}

/* ==============================================================
   ESTADOS DE CARGA (Inactivo / Cargando / Error / Éxito)
   ============================================================== */
function setLoading(formEl, buttonEl, isLoading) {
  const label = buttonEl.querySelector(".btn-label");
  const spinner = buttonEl.querySelector(".spinner");

  buttonEl.disabled = isLoading;
  spinner.classList.toggle("hidden", !isLoading);
  label.style.opacity = isLoading ? "0.6" : "1";

  // Deshabilita todos los inputs del formulario mientras carga,
  // pero NUNCA los vacía (requisito de "resguardo de datos").
  [...formEl.querySelectorAll("input")].forEach((input) => {
    input.disabled = isLoading;
  });
}

/* ==============================================================
   VALIDACIÓN EN TIEMPO REAL (cliente)
   ============================================================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mínimo 6 caracteres, al menos 1 número y 1 mayúscula.
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

function validateEmail(inputEl, errorEl) {
  const value = inputEl.value.trim();
  if (!value) {
    setFieldError(inputEl, errorEl, "El correo es obligatorio.");
    return false;
  }
  if (!EMAIL_RE.test(value)) {
    setFieldError(inputEl, errorEl, "Formato de correo inválido.");
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

function validatePassword(inputEl, errorEl, { strict } = { strict: true }) {
  const value = inputEl.value;
  if (!value) {
    setFieldError(inputEl, errorEl, "La contraseña es obligatoria.");
    return false;
  }
  if (strict && !PASSWORD_RE.test(value)) {
    setFieldError(
      inputEl,
      errorEl,
      "Mínimo 6 caracteres, 1 número y 1 mayúscula."
    );
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

function validateName(inputEl, errorEl) {
  const value = inputEl.value.trim();
  if (!value) {
    setFieldError(inputEl, errorEl, "El nombre es obligatorio.");
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

/* ---- Registro: listeners 'blur' para validar en tiempo real ---- */
const regName = $("reg-name");
const regEmail = $("reg-email");
const regPassword = $("reg-password");

regName.addEventListener("blur", () =>
  validateName(regName, $("reg-name-error"))
);
regEmail.addEventListener("blur", () =>
  validateEmail(regEmail, $("reg-email-error"))
);
regPassword.addEventListener("blur", () =>
  validatePassword(regPassword, $("reg-password-error"))
);
// Además, si el usuario ya vio un error y empieza a corregir, lo limpiamos
// al teclear (input) para que el feedback se sienta vivo.
[regName, regEmail, regPassword].forEach((el) => {
  el.addEventListener("input", () => {
    if (el.classList.contains("invalid")) el.classList.remove("invalid");
  });
});

/* ---- Login: mismos listeners, password sin regla "strict" ---- */
const logEmail = $("log-email");
const logPassword = $("log-password");

logEmail.addEventListener("blur", () =>
  validateEmail(logEmail, $("log-email-error"))
);
logPassword.addEventListener("blur", () =>
  validatePassword(logPassword, $("log-password-error"), { strict: false })
);
[logEmail, logPassword].forEach((el) => {
  el.addEventListener("input", () => {
    if (el.classList.contains("invalid")) el.classList.remove("invalid");
  });
});

/* ==============================================================
   NÚCLEO: fetch envuelto con try/catch, sin .then/.catch.

   Punto clave que hay que poder defender ante el profesor:
   `fetch()` SOLO rechaza la promesa (cae en el catch) cuando hay un
   fallo de RED real: CORS bloqueado por el navegador, DNS, timeout,
   SSL roto, conexión rechazada. Un 400 o un 401 del servidor NO
   provoca un catch: la promesa se resuelve igual, con response.ok
   en false. Por eso el flujo es:

     try {
       const response = await fetch(...)       // puede lanzar (red/CORS)
       if (!response.ok) {                      // puede ser 400/401/500
         const body = await response.json()      // leemos el detalle real
         ... decidir qué campo marcar ...
         return
       }
       const data = await response.json()        // camino feliz
       ... éxito ...
     } catch (err) {
       // aquí SOLO llegan errores de red/CORS, nunca un 400 "normal"
       showNetworkError(...)
     }
   ============================================================== */

/**
 * Convierte un TypeError de fetch en un mensaje humano. En Chrome/Firefox
 * un bloqueo CORS y un servidor caído producen el MISMO mensaje genérico
 * ("Failed to fetch" / "NetworkError"), así que no podemos distinguirlos
 * con certeza desde JS: solo podemos decirle al usuario que revise la
 * consola de red, que es donde el navegador sí muestra la causa exacta.
 */
function interpretNetworkError(err) {
  return (
    "No se pudo contactar al servidor (" +
    err.message +
    "). Esto casi siempre significa: el servidor no está respondiendo, " +
    "no envía la cabecera Access-Control-Allow-Origin (CORS), o hay un " +
    "problema de certificado SSL. Revisa la pestaña Network de DevTools " +
    "para ver la causa exacta."
  );
}

/* ==============================================================
   REGISTRO
   ============================================================== */
const formRegister = $("form-register");

formRegister.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideNetworkError();

  // 1) Validación de cliente primero: si falla, ni siquiera pegamos al server.
  const nameOk = validateName(regName, $("reg-name-error"));
  const emailOk = validateEmail(regEmail, $("reg-email-error"));
  const passOk = validatePassword(regPassword, $("reg-password-error"));
  if (!nameOk) return; // el foco ya quedó en el campo que falló
  if (!emailOk) return;
  if (!passOk) return;

  const submitBtn = $("reg-submit");
  const formError = $("reg-form-error");
  formError.textContent = "";
  setLoading(formRegister, submitBtn, true);

  try {
    const response = await fetch(ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName.value.trim(),
        email: regEmail.value.trim(),
        password: regPassword.value,
      }),
    });

    if (!response.ok) {
      // Leemos el cuerpo del error ANTES de decidir qué mostrar:
      // el servidor es quien sabe si fue "correo ya existe" o algo más.
      let serverMessage = "No se pudo completar el registro.";
      try {
        const errorBody = await response.json();
        serverMessage = errorBody.message || errorBody.error || serverMessage;
      } catch {
        // El body no era JSON válido; nos quedamos con el mensaje genérico.
      }

      const lower = serverMessage.toLowerCase();
      if (response.status === 400) {
        // Discernimos la causa real para enfocar el campo correcto.
        if (lower.includes("email") || lower.includes("correo") || lower.includes("existe")) {
          setFieldError(regEmail, $("reg-email-error"), serverMessage);
        } else if (lower.includes("password") || lower.includes("contraseña")) {
          setFieldError(regPassword, $("reg-password-error"), serverMessage);
        } else if (lower.includes("name") || lower.includes("nombre")) {
          setFieldError(regName, $("reg-name-error"), serverMessage);
        } else {
          formError.textContent = serverMessage;
          regEmail.focus();
        }
      } else {
        // 500 u otro código: no es culpa de un campo específico.
        formError.textContent = `Error del servidor (${response.status}): ${serverMessage}`;
      }
      return; // Los inputs NO se limpian: el usuario conserva lo que escribió.
    }

    // Camino feliz.
    const data = await response.json();
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    formRegister.reset();
    await enterProtectedView();
  } catch (err) {
    // Solo cae aquí un fallo de red/CORS real, no un 400/401.
    showNetworkError(interpretNetworkError(err));
    // Inputs intactos a propósito.
  } finally {
    setLoading(formRegister, submitBtn, false);
  }
});

/* ==============================================================
   LOGIN
   ============================================================== */
const formLogin = $("form-login");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideNetworkError();

  const emailOk = validateEmail(logEmail, $("log-email-error"));
  const passOk = validatePassword(logPassword, $("log-password-error"), {
    strict: false,
  });
  if (!emailOk) return;
  if (!passOk) return;

  const submitBtn = $("log-submit");
  const formError = $("log-form-error");
  formError.textContent = "";
  setLoading(formLogin, submitBtn, true);

  try {
    const response = await fetch(ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: logEmail.value.trim(),
        password: logPassword.value,
      }),
    });

    if (!response.ok) {
      let serverMessage = "No se pudo iniciar sesión.";
      try {
        const errorBody = await response.json();
        serverMessage = errorBody.message || errorBody.error || serverMessage;
      } catch {
        /* body no era JSON */
      }

      const lower = serverMessage.toLowerCase();
      if (response.status === 400 || response.status === 401) {
        if (lower.includes("email") || lower.includes("correo") || lower.includes("usuario")) {
          setFieldError(logEmail, $("log-email-error"), serverMessage);
        } else if (lower.includes("password") || lower.includes("contraseña")) {
          setFieldError(logPassword, $("log-password-error"), serverMessage);
        } else {
          formError.textContent = serverMessage;
          logEmail.focus();
        }
      } else {
        formError.textContent = `Error del servidor (${response.status}): ${serverMessage}`;
      }
      return; // Inputs intactos.
    }

    const data = await response.json();
    if (!data.token) {
      formError.textContent = "El servidor respondió sin token de sesión.";
      logEmail.focus();
      return;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    formLogin.reset();
    await enterProtectedView();
  } catch (err) {
    showNetworkError(interpretNetworkError(err));
  } finally {
    setLoading(formLogin, submitBtn, false);
  }
});

/* ==============================================================
   VISTA PROTEGIDA: GET /get/teams con token
   Interceptor manual de 401: si el token está vencido o corrupto,
   lo purgamos y regresamos a login sin dejar la app colgada.
   ============================================================== */
async function enterProtectedView() {
  showView("protected");
  const statusEl = $("teams-status");
  const listEl = $("teams-list");
  listEl.innerHTML = "";
  statusEl.textContent = "Cargando equipos...";
  hideNetworkError();

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // No debería pasar, pero por robustez: sin token no hay vista protegida.
    goToLoginAfterAuthFailure("Tu sesión no es válida. Inicia sesión de nuevo.");
    return;
  }

  try {
    const response = await fetch(ENDPOINTS.teams, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      // Token corrupto/expirado: limpiar y volver a login SIN romper la app.
      goToLoginAfterAuthFailure("Tu sesión expiró. Inicia sesión de nuevo.");
      return;
    }

    if (!response.ok) {
      statusEl.textContent = `No se pudieron cargar los equipos (código ${response.status}).`;
      return;
    }

    const data = await response.json();
    const teams = Array.isArray(data) ? data : data.teams || [];

    if (teams.length === 0) {
      statusEl.textContent = "No hay equipos disponibles.";
      return;
    }

    statusEl.textContent = `${teams.length} equipos encontrados.`;
    listEl.innerHTML = teams
      .map((team) => `<li>${escapeHtml(team.name || String(team))}</li>`)
      .join("");
  } catch (err) {
    // Fallo de red/CORS al pedir la vista protegida.
    showNetworkError(interpretNetworkError(err));
    statusEl.textContent = "No fue posible cargar los equipos.";
  }
}

function goToLoginAfterAuthFailure(message) {
  localStorage.removeItem(TOKEN_KEY);
  showView("login");
  $("log-form-error").textContent = message;
  logEmail.focus();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ==============================================================
   LOGOUT
   ============================================================== */
$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showView("login");
});

/* ==============================================================
   NAVEGACIÓN ENTRE VISTAS PÚBLICAS
   ============================================================== */
$("go-to-login").addEventListener("click", () => {
  hideNetworkError();
  showView("login");
});
$("go-to-register").addEventListener("click", () => {
  hideNetworkError();
  showView("register");
});

/* ==============================================================
   ARRANQUE: si ya hay token guardado, intenta entrar directo
   a la vista protegida (y si el token está vencido, el propio
   interceptor de 401 nos regresa a login).
   ============================================================== */
(function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    enterProtectedView();
  } else {
    showView("register");
  }
})();