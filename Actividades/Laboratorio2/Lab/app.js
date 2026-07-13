/* =============================================================
   MINI-SISTEMA DE AUTENTICACIÓN — app.js
   -------------------------------------------------------------
   Endpoints consumidos (API pública World Cup 2026):
     POST https://worldcup26.ir/auth/register      { name, email, password }
     POST https://worldcup26.ir/auth/authenticate  { email, password }
     GET  https://worldcup26.ir/get/teams           (requiere Bearer token)

   Reglas de arquitectura exigidas por el laboratorio:
     1. Cero alert(): todo el feedback se pinta en el DOM.
     2. Cero .then().catch(): solo async/await + try/catch.
     3. Ante un fallo de red, los inputs NUNCA se vacían.
     4. Ante cualquier error, el foco vuelve al input responsable.
   ============================================================= */

const API_BASE_URL = "https://worldcup26.ir";
const TOKEN_STORAGE_KEY = "wc26_jwt_token";
const USER_NAME_STORAGE_KEY = "wc26_user_name";

/* -------------------------------------------------------------
   Referencias a elementos del DOM
   Las agrupamos por vista para que cada función sepa exactamente
   con qué nodos trabaja, sin tener que volver a buscarlos.
   ------------------------------------------------------------- */
const views = {
  register: document.getElementById("view-register"),
  login: document.getElementById("view-login"),
  protected: document.getElementById("view-protected"),
};

const registerForm = {
  form: document.getElementById("register-form"),
  name: document.getElementById("register-name"),
  email: document.getElementById("register-email"),
  password: document.getElementById("register-password"),
  nameError: document.getElementById("register-name-error"),
  emailError: document.getElementById("register-email-error"),
  passwordError: document.getElementById("register-password-error"),
  formError: document.getElementById("register-form-error"),
  submitBtn: document.getElementById("register-submit-btn"),
};

const loginForm = {
  form: document.getElementById("login-form"),
  email: document.getElementById("login-email"),
  password: document.getElementById("login-password"),
  emailError: document.getElementById("login-email-error"),
  passwordError: document.getElementById("login-password-error"),
  formError: document.getElementById("login-form-error"),
  submitBtn: document.getElementById("login-submit-btn"),
};

const protectedView = {
  welcomeMessage: document.getElementById("welcome-message"),
  status: document.getElementById("protected-status"),
  teamsGrid: document.getElementById("teams-grid"),
  logoutBtn: document.getElementById("logout-btn"),
};

/* =============================================================
   NAVEGACIÓN ENTRE VISTAS
   Las tres vistas viven siempre en el DOM; solo alternamos la
   clase "hidden" para mostrar una a la vez.
   ============================================================= */
function showView(viewName) {
  Object.entries(views).forEach(([name, section]) => {
    section.classList.toggle("hidden", name !== viewName);
  });
}

document.getElementById("go-to-login").addEventListener("click", () => showView("login"));
document.getElementById("go-to-register").addEventListener("click", () => showView("register"));

/* =============================================================
   HELPERS GENÉRICOS DE ESTADO VISUAL
   Estos helpers son el corazón de los "4 estados obligatorios":
   inactivo, cargando, error y éxito. Nunca usan alert(): todo
   son cambios de texto/clases sobre nodos existentes.
   ============================================================= */

/**
 * Limpia todos los mensajes de error de un formulario y quita
 * las clases de validación visual de cada input.
 * Se llama al iniciar un nuevo intento de envío (estado "cargando"),
 * para no arrastrar errores de un intento anterior.
 */
function clearFieldErrors(fields, inputs) {
  fields.forEach((span) => (span.textContent = ""));
  inputs.forEach((input) => input.classList.remove("input--invalid"));
}

/**
 * Pinta un error de validación específico debajo de un input y
 * devuelve el foco a ese input. Esta es la función que satisface
 * el requisito de "Gestión estricta del foco": se llama SIEMPRE
 * que un campo es el causante del fallo, sea la validación del
 * cliente o un 400 devuelto por el servidor.
 */
function setFieldError(input, errorSpan, message) {
  input.classList.add("input--invalid");
  errorSpan.textContent = message;
  input.focus(); // <- requisito obligatorio de foco automático
}

/**
 * Alterna el estado "cargando" de un formulario: deshabilita los
 * inputs, muestra el spinner dentro del botón y cambia su texto.
 * Esto es visible en vivo durante la prueba de "modo offline" que
 * pide el profesor: el botón debe mostrarse cargando ANTES de
 * mostrar el error.
 */
function setLoadingState(submitBtn, inputs, isLoading, loadingLabel, idleLabel) {
  const label = submitBtn.querySelector(".btn__label");
  const spinner = submitBtn.querySelector(".spinner");

  submitBtn.disabled = isLoading;
  inputs.forEach((input) => (input.disabled = isLoading));
  spinner.classList.toggle("hidden", !isLoading);
  label.textContent = isLoading ? loadingLabel : idleLabel;
}

/**
 * Valida el formato de un correo con una expresión regular simple.
 * No pretende ser exhaustiva (RFC 5322 completo), solo cubrir los
 * casos razonables que pide el enunciado.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Criterio mínimo de seguridad para la contraseña: al menos 6
 * caracteres. Se documenta explícitamente porque el profesor
 * puede preguntar por qué se eligió ese mínimo.
 */
function isValidPassword(value) {
  return value.length >= 6;
}

/* =============================================================
   VALIDACIÓN EN TIEMPO REAL (mientras el usuario escribe / blur)
   ============================================================= */

registerForm.name.addEventListener("blur", () => {
  const value = registerForm.name.value.trim();
  if (!value) {
    registerForm.name.classList.add("input--invalid");
    registerForm.nameError.textContent = "El nombre es obligatorio.";
  } else {
    registerForm.name.classList.remove("input--invalid");
    registerForm.name.classList.add("input--valid");
    registerForm.nameError.textContent = "";
  }
});

function attachEmailValidation(input, errorSpan) {
  input.addEventListener("input", () => {
    const value = input.value.trim();
    if (value.length === 0) {
      // Aún no escribe nada: no lo regañamos en cada tecla, esperamos al blur.
      input.classList.remove("input--invalid", "input--valid");
      errorSpan.textContent = "";
      return;
    }
    if (isValidEmail(value)) {
      input.classList.remove("input--invalid");
      input.classList.add("input--valid");
      errorSpan.textContent = "";
    } else {
      input.classList.remove("input--valid");
      input.classList.add("input--invalid");
      errorSpan.textContent = "Escribe un correo con formato válido (ej. usuario@dominio.com).";
    }
  });
}
attachEmailValidation(registerForm.email, registerForm.emailError);
attachEmailValidation(loginForm.email, loginForm.emailError);

function attachPasswordValidation(input, errorSpan, { requireMinLength }) {
  input.addEventListener("input", () => {
    const value = input.value;
    if (value.length === 0) {
      input.classList.remove("input--invalid", "input--valid");
      errorSpan.textContent = "";
      return;
    }
    if (!requireMinLength || isValidPassword(value)) {
      input.classList.remove("input--invalid");
      input.classList.add("input--valid");
      errorSpan.textContent = "";
    } else {
      input.classList.remove("input--valid");
      input.classList.add("input--invalid");
      errorSpan.textContent = "Debe tener al menos 6 caracteres.";
    }
  });
}
// En registro sí exigimos el mínimo de seguridad; en login solo marcamos que no esté vacío.
attachPasswordValidation(registerForm.password, registerForm.passwordError, { requireMinLength: true });
attachPasswordValidation(loginForm.password, loginForm.passwordError, { requireMinLength: false });

/* =============================================================
   VALIDACIÓN "AL ENVIAR" (client-side gate antes de llamar la API)
   Devuelve el primer input inválido encontrado, o null si todo
   está bien. Solo se reporta UN error a la vez porque el foco
   solo puede ir a un campo.
   ============================================================= */
function validateRegisterForm() {
  const { name, email, password, nameError, emailError, passwordError } = registerForm;

  if (!name.value.trim()) {
    return { input: name, errorSpan: nameError, message: "El nombre es obligatorio." };
  }
  if (!email.value.trim() || !isValidEmail(email.value)) {
    return { input: email, errorSpan: emailError, message: "Escribe un correo con formato válido." };
  }
  if (!password.value || !isValidPassword(password.value)) {
    return { input: password, errorSpan: passwordError, message: "La contraseña debe tener al menos 6 caracteres." };
  }
  return null;
}

function validateLoginForm() {
  const { email, password, emailError, passwordError } = loginForm;

  if (!email.value.trim() || !isValidEmail(email.value)) {
    return { input: email, errorSpan: emailError, message: "Escribe un correo con formato válido." };
  }
  if (!password.value) {
    return { input: password, errorSpan: passwordError, message: "La contraseña es obligatoria." };
  }
  return null;
}

/* =============================================================
   REGISTRO — POST /auth/register
   ============================================================= */
registerForm.form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Nunca dejamos que el navegador recargue la página.

  const inputs = [registerForm.name, registerForm.email, registerForm.password];
  const errorSpans = [registerForm.nameError, registerForm.emailError, registerForm.passwordError];

  // Limpiamos errores previos y ocultamos el error general del formulario.
  clearFieldErrors(errorSpans, inputs);
  registerForm.formError.classList.add("hidden");

  // --- Paso 1: validación del lado del cliente ---
  const clientError = validateRegisterForm();
  if (clientError) {
    setFieldError(clientError.input, clientError.errorSpan, clientError.message);
    return; // No llamamos a la API si el formulario ni siquiera es válido localmente.
  }

  // --- Paso 2: estado "cargando" ---
  setLoadingState(registerForm.submitBtn, inputs, true, "Registrando...", "Registrarme");

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerForm.name.value.trim(),
        email: registerForm.email.value.trim(),
        password: registerForm.password.value,
      }),
    });

    /* ---------------------------------------------------------
       PUNTO CLAVE DEL LABORATORIO:
       "response.ok" SOLO nos dice si el código HTTP está en el
       rango 200-299. NO nos dice nada sobre POR QUÉ falló.
       Un 400 puede significar "el usuario ya existe" o "el
       registro falló" por otra razón; la única forma de saberlo
       es leer el cuerpo JSON de la respuesta con response.json(),
       incluso cuando la respuesta fue un error.
       --------------------------------------------------------- */
    if (!response.ok) {
      // Intentamos leer el body de la respuesta fallida. Si el
      // servidor no devolviera JSON válido, este await lanzaría
      // y caeríamos al catch de más abajo (fallo "de red/parseo").
      const errorBody = await response.json();
      const serverMessage = errorBody && errorBody.message ? errorBody.message : "";

      // Diferenciamos la causa real del 400 según el mensaje del
      // servidor (documentado en el swagger de la API), no solo
      // el código de estado.
      if (/already exists/i.test(serverMessage)) {
        setFieldError(
          registerForm.email,
          registerForm.emailError,
          "Ese correo ya está registrado. Intenta iniciar sesión."
        );
      } else {
        // Cualquier otro 400 (por ejemplo "Registration failed")
        // se muestra como error general del formulario, ya que no
        // apunta a un campo específico.
        registerForm.formError.textContent = serverMessage || "No se pudo completar el registro.";
        registerForm.formError.classList.remove("hidden");
        registerForm.name.focus();
      }
      return; // Los inputs conservan lo que el usuario escribió.
    }

    // --- Éxito: la API devuelve { user, token } ---
    const data = await response.json();
    persistSession(data.token, data.user && data.user.name);

    // Reseteamos el formulario SOLO en el camino feliz, nunca en error.
    registerForm.form.reset();
    [registerForm.name, registerForm.email, registerForm.password].forEach((input) =>
      input.classList.remove("input--valid", "input--invalid")
    );

    await loadProtectedView();
  } catch (networkError) {
    /* -----------------------------------------------------------
       Este catch atrapa fallos de RED reales (sin conexión, DNS,
       CORS, timeout) o un JSON corrupto. Requisito crítico: bajo
       ninguna circunstancia limpiamos los inputs aquí. El usuario
       no debe perder lo que ya escribió.
       ----------------------------------------------------------- */
    registerForm.formError.textContent =
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.";
    registerForm.formError.classList.remove("hidden");
    registerForm.name.focus();
  } finally {
    // El estado de carga siempre se apaga, gane o pierda la petición.
    setLoadingState(registerForm.submitBtn, inputs, false, "Registrando...", "Registrarme");
  }
});

/* =============================================================
   LOGIN — POST /auth/authenticate
   ============================================================= */
loginForm.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const inputs = [loginForm.email, loginForm.password];
  const errorSpans = [loginForm.emailError, loginForm.passwordError];

  clearFieldErrors(errorSpans, inputs);
  loginForm.formError.classList.add("hidden");

  const clientError = validateLoginForm();
  if (clientError) {
    setFieldError(clientError.input, clientError.errorSpan, clientError.message);
    return;
  }

  setLoadingState(loginForm.submitBtn, inputs, true, "Ingresando...", "Ingresar");

  try {
    const response = await fetch(`${API_BASE_URL}/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginForm.email.value.trim(),
        password: loginForm.password.value,
      }),
    });

    if (!response.ok) {
      // Igual que en registro: leemos el body para saber la causa
      // real del 400 ("User not found" vs "Invalid password") y
      // marcamos el campo específico responsable del fallo.
      const errorBody = await response.json();
      const serverMessage = errorBody && errorBody.message ? errorBody.message : "";

      if (/user not found/i.test(serverMessage)) {
        setFieldError(loginForm.email, loginForm.emailError, "No existe una cuenta con ese correo.");
      } else if (/invalid password/i.test(serverMessage)) {
        setFieldError(loginForm.password, loginForm.passwordError, "La contraseña es incorrecta.");
      } else {
        loginForm.formError.textContent = serverMessage || "No se pudo iniciar sesión.";
        loginForm.formError.classList.remove("hidden");
        loginForm.email.focus();
      }
      return;
    }

    const data = await response.json();
    persistSession(data.token, data.user && data.user.name);

    loginForm.form.reset();
    [loginForm.email, loginForm.password].forEach((input) =>
      input.classList.remove("input--valid", "input--invalid")
    );

    await loadProtectedView();
  } catch (networkError) {
    // Mismo principio: fallo de red real, los inputs se conservan intactos.
    loginForm.formError.textContent =
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.";
    loginForm.formError.classList.remove("hidden");
    loginForm.email.focus();
  } finally {
    setLoadingState(loginForm.submitBtn, inputs, false, "Ingresando...", "Ingresar");
  }
});

/* =============================================================
   PERSISTENCIA DE SESIÓN
   ============================================================= */
function persistSession(token, userName) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (userName) {
    localStorage.setItem(USER_NAME_STORAGE_KEY, userName);
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_NAME_STORAGE_KEY);
}

/* =============================================================
   VISTA PROTEGIDA — GET /get/teams
   Aquí vive el interceptor de 401: si el token fue borrado o
   manipulado desde DevTools > Application, la API responde 401,
   nosotros lo detectamos, limpiamos localStorage y regresamos
   limpiamente al login.
   ============================================================= */
async function loadProtectedView() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  // Si no hay token, ni siquiera intentamos la petición: al login directo.
  if (!token) {
    showView("login");
    return;
  }

  const userName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  protectedView.welcomeMessage.textContent = userName ? `Sesión iniciada como ${userName}` : "";
  protectedView.status.textContent = "Cargando equipos...";
  protectedView.status.classList.remove("is-error");
  protectedView.teamsGrid.innerHTML = "";
  showView("protected");

  try {
    const response = await fetch(`${API_BASE_URL}/get/teams`, {
      method: "GET",
      headers: {
        // El JWT se adjunta en cada petición protegida mediante este header.
        Authorization: `Bearer ${token}`,
      },
    });

    /* ---------------------------------------------------------
       INTERCEPTOR DE 401
       Un 401 aquí significa "el token expiró" o "fue manipulado".
       No tiene sentido leer un body específico para diferenciar
       causas (como sí hacíamos en el 400): la única acción
       correcta es limpiar la sesión y devolver al login, sin
       dejar al usuario atascado viendo una vista que ya no debería
       poder ver.
       --------------------------------------------------------- */
    if (response.status === 401) {
      clearSession();
      protectedView.teamsGrid.innerHTML = "";
      showView("login");
      loginForm.formError.textContent = "Tu sesión expiró o no es válida. Inicia sesión de nuevo.";
      loginForm.formError.classList.remove("hidden");
      return;
    }

    if (!response.ok) {
      // Otros errores (500, 404, etc.) no ameritan cerrar sesión,
      // solo informamos que la carga de equipos falló.
      protectedView.status.textContent = "No se pudieron cargar los equipos. Intenta más tarde.";
      protectedView.status.classList.add("is-error");
      return;
    }

    const teams = await response.json();
    renderTeams(Array.isArray(teams) ? teams : teams.teams || []);
    protectedView.status.textContent = "";
  } catch (networkError) {
    // Fallo real de red mientras se pedía el recurso protegido.
    protectedView.status.textContent =
      "No se pudo conectar con el servidor para cargar los equipos.";
    protectedView.status.classList.add("is-error");
  }
}

function renderTeams(teams) {
  protectedView.teamsGrid.innerHTML = "";

  if (teams.length === 0) {
    protectedView.status.textContent = "No hay equipos disponibles.";
    return;
  }

  teams.forEach((team) => {
    const card = document.createElement("div");
    card.className = "team-card";

    const flag = document.createElement("img");
    flag.src = team.flag || "";
    flag.alt = team.name_en ? `Bandera de ${team.name_en}` : "Bandera";
    flag.loading = "lazy";
    // Si la bandera no carga, la ocultamos en vez de dejar un ícono roto.
    flag.addEventListener("error", () => flag.remove());

    const name = document.createElement("div");
    name.textContent = team.name_en || "Equipo";

    const code = document.createElement("div");
    code.className = "team-card__code";
    code.textContent = [team.fifa_code, team.groups ? `Grupo ${team.groups}` : ""]
      .filter(Boolean)
      .join(" · ");

    card.append(flag, name, code);
    protectedView.teamsGrid.appendChild(card);
  });
}

/* =============================================================
   CIERRE DE SESIÓN
   ============================================================= */
protectedView.logoutBtn.addEventListener("click", () => {
  clearSession();
  showView("login");
});

/* =============================================================
   ARRANQUE DE LA APLICACIÓN
   Si ya existe un token guardado (recarga de página), intentamos
   ir directo a la vista protegida. Si el token ya no es válido,
   el propio interceptor de 401 dentro de loadProtectedView() se
   encargará de limpiarlo y devolvernos al login.
   ============================================================= */
(function init() {
  const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (existingToken) {
    loadProtectedView();
  } else {
    showView("login");
  }
})();
