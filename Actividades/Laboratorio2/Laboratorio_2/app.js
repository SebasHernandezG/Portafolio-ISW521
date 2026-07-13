/* ==============================================================
   CONFIGURACIÓN
   ============================================================== */
// Se conserva el proxy local solicitado. No se modifica proxy.js.
const API_BASE = "http://localhost:3000";
const ENDPOINTS = {
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/authenticate`,
  teams: `${API_BASE}/get/teams`,
};
const TOKEN_KEY = "wc26_token";

/* ==============================================================
   HELPERS DE DOM Y VISTAS
   ============================================================== */
const $ = (id) => document.getElementById(id);

const views = {
  register: $("view-register"),
  login: $("view-login"),
  protected: $("view-protected"),
};

function showView(name) {
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[name].classList.remove("hidden");
}

function setFieldError(inputEl, errorEl, message, shouldFocus = true) {
  errorEl.textContent = message;
  inputEl.classList.add("invalid");
  inputEl.setAttribute("aria-invalid", "true");
  if (shouldFocus) inputEl.focus();
}

function clearFieldError(inputEl, errorEl) {
  errorEl.textContent = "";
  inputEl.classList.remove("invalid");
  inputEl.removeAttribute("aria-invalid");
}

function setFormMessage(element, message = "", type = "") {
  element.textContent = message;
  element.classList.remove("error", "success");
  if (type) element.classList.add(type);
}

const networkBanner = $("network-banner");
const networkBannerText = $("network-banner-text");

function showNetworkError(message) {
  networkBannerText.textContent = message;
  networkBanner.classList.remove("hidden");
}

function hideNetworkError() {
  networkBanner.classList.add("hidden");
  networkBannerText.textContent = "";
}

/* ==============================================================
   ESTADOS VISUALES
   ============================================================== */
function setLoading(formEl, buttonEl, isLoading) {
  const label = buttonEl.querySelector(".btn-label");
  const spinner = buttonEl.querySelector(".spinner");

  buttonEl.disabled = isLoading;
  buttonEl.setAttribute("aria-busy", String(isLoading));
  spinner.classList.toggle("hidden", !isLoading);
  label.textContent = isLoading ? "Procesando..." : buttonEl.dataset.defaultLabel;

  formEl.querySelectorAll("input").forEach((input) => {
    input.disabled = isLoading;
  });
}

function prepareButton(buttonEl) {
  buttonEl.dataset.defaultLabel = buttonEl.querySelector(".btn-label").textContent;
}

prepareButton($("reg-submit"));
prepareButton($("log-submit"));

/* ==============================================================
   VALIDACIÓN EN TIEMPO REAL
   ============================================================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

function validateName(inputEl, errorEl, shouldFocus = true) {
  if (!inputEl.value.trim()) {
    setFieldError(inputEl, errorEl, "El nombre es obligatorio.", shouldFocus);
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

function validateEmail(inputEl, errorEl, shouldFocus = true) {
  const value = inputEl.value.trim();
  if (!value) {
    setFieldError(inputEl, errorEl, "El correo es obligatorio.", shouldFocus);
    return false;
  }
  if (!EMAIL_RE.test(value)) {
    setFieldError(inputEl, errorEl, "Formato de correo inválido.", shouldFocus);
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

function validatePassword(inputEl, errorEl, options = {}) {
  const { strict = true, shouldFocus = true } = options;
  const value = inputEl.value;

  if (!value) {
    setFieldError(inputEl, errorEl, "La contraseña es obligatoria.", shouldFocus);
    return false;
  }
  if (strict && !PASSWORD_RE.test(value)) {
    setFieldError(
      inputEl,
      errorEl,
      "Mínimo 6 caracteres, 1 número y 1 mayúscula.",
      shouldFocus
    );
    return false;
  }
  clearFieldError(inputEl, errorEl);
  return true;
}

function focusFirstInvalid(validations) {
  const firstInvalid = validations.find((item) => !item.valid);
  if (firstInvalid) firstInvalid.input.focus();
  return !firstInvalid;
}

function bindLiveValidation(inputEl, errorEl, validator) {
  inputEl.addEventListener("blur", () => validator(true));
  inputEl.addEventListener("input", () => {
    if (inputEl.classList.contains("invalid")) validator(false);
  });
}

const regName = $("reg-name");
const regEmail = $("reg-email");
const regPassword = $("reg-password");
const logEmail = $("log-email");
const logPassword = $("log-password");

bindLiveValidation(regName, $("reg-name-error"), (focus) =>
  validateName(regName, $("reg-name-error"), focus)
);
bindLiveValidation(regEmail, $("reg-email-error"), (focus) =>
  validateEmail(regEmail, $("reg-email-error"), focus)
);
bindLiveValidation(regPassword, $("reg-password-error"), (focus) =>
  validatePassword(regPassword, $("reg-password-error"), { shouldFocus: focus })
);
bindLiveValidation(logEmail, $("log-email-error"), (focus) =>
  validateEmail(logEmail, $("log-email-error"), focus)
);
bindLiveValidation(logPassword, $("log-password-error"), (focus) =>
  validatePassword(logPassword, $("log-password-error"), {
    strict: false,
    shouldFocus: focus,
  })
);

/* ==============================================================
   RESPUESTAS DE LA API
   ============================================================== */
async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

function getServerMessage(body, fallback) {
  if (!body) return fallback;
  if (typeof body === "string") return body;

  const direct = body.message || body.error || body.detail || body.title;
  if (typeof direct === "string") return direct;

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.map((error) => error.message || String(error)).join(" ");
  }

  if (body.errors && typeof body.errors === "object") {
    return Object.values(body.errors).flat().map(String).join(" ");
  }

  return fallback;
}

function extractToken(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.token ||
    data.jwt ||
    data.accessToken ||
    data.access_token ||
    data.data?.token ||
    data.data?.jwt ||
    data.data?.accessToken ||
    null
  );
}

function interpretNetworkError(err) {
  const detail = err instanceof Error ? err.message : "fallo desconocido";
  return `No se pudo contactar al servidor (${detail}). Verifica que el proxy esté ejecutándose y que tengas conexión. Los datos escritos se conservaron.`;
}

function classifyField(message) {
  const lower = message.toLowerCase();
  if (/(email|correo|mail|usuario|user|exist|registr)/.test(lower)) return "email";
  if (/(password|contrase|clave|credential)/.test(lower)) return "password";
  if (/(name|nombre)/.test(lower)) return "name";
  return "form";
}

/* ==============================================================
   REGISTRO
   ============================================================== */
const formRegister = $("form-register");
const regFormMessage = $("reg-form-message");

formRegister.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideNetworkError();
  setFormMessage(regFormMessage);

  const validations = [
    {
      input: regName,
      valid: validateName(regName, $("reg-name-error"), false),
    },
    {
      input: regEmail,
      valid: validateEmail(regEmail, $("reg-email-error"), false),
    },
    {
      input: regPassword,
      valid: validatePassword(regPassword, $("reg-password-error"), {
        shouldFocus: false,
      }),
    },
  ];

  if (!focusFirstInvalid(validations)) return;

  const submitBtn = $("reg-submit");
  setLoading(formRegister, submitBtn, true);

  try {
    const response = await fetch(ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: regName.value.trim(),
        email: regEmail.value.trim(),
        password: regPassword.value,
      }),
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      const message = getServerMessage(body, "No se pudo completar el registro.");

      if (response.status === 400 || response.status === 409) {
        const field = classifyField(message);
        if (field === "email") {
          setFieldError(regEmail, $("reg-email-error"), message);
        } else if (field === "password") {
          setFieldError(regPassword, $("reg-password-error"), message);
        } else if (field === "name") {
          setFieldError(regName, $("reg-name-error"), message);
        } else {
          setFormMessage(regFormMessage, message, "error");
          regEmail.focus();
        }
      } else {
        setFormMessage(
          regFormMessage,
          `Error del servidor (${response.status}): ${message}`,
          "error"
        );
      }
      return;
    }

    const token = extractToken(body);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setFormMessage(regFormMessage, "Registro completado. Cargando sesión...", "success");
      await enterProtectedView();
      return;
    }

    // Algunas APIs registran al usuario, pero exigen autenticarse después.
    const registeredEmail = regEmail.value.trim();
    formRegister.reset();
    showView("login");
    logEmail.value = registeredEmail;
    setFormMessage(
      $("log-form-message"),
      "Registro completado correctamente. Ahora inicia sesión.",
      "success"
    );
    logPassword.focus();
  } catch (err) {
    showNetworkError(interpretNetworkError(err));
  } finally {
    setLoading(formRegister, submitBtn, false);
  }
});

/* ==============================================================
   LOGIN
   ============================================================== */
const formLogin = $("form-login");
const logFormMessage = $("log-form-message");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideNetworkError();
  setFormMessage(logFormMessage);

  const validations = [
    {
      input: logEmail,
      valid: validateEmail(logEmail, $("log-email-error"), false),
    },
    {
      input: logPassword,
      valid: validatePassword(logPassword, $("log-password-error"), {
        strict: false,
        shouldFocus: false,
      }),
    },
  ];

  if (!focusFirstInvalid(validations)) return;

  const submitBtn = $("log-submit");
  setLoading(formLogin, submitBtn, true);

  try {
    const response = await fetch(ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: logEmail.value.trim(),
        password: logPassword.value,
      }),
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      const message = getServerMessage(body, "No se pudo iniciar sesión.");

      if (response.status === 400 || response.status === 401) {
        const field = classifyField(message);
        if (field === "password") {
          setFieldError(logPassword, $("log-password-error"), message);
        } else if (field === "email") {
          setFieldError(logEmail, $("log-email-error"), message);
        } else {
          setFormMessage(logFormMessage, message, "error");
          logEmail.focus();
        }
      } else {
        setFormMessage(
          logFormMessage,
          `Error del servidor (${response.status}): ${message}`,
          "error"
        );
      }
      return;
    }

    const token = extractToken(body);
    if (!token) {
      setFormMessage(
        logFormMessage,
        "El servidor respondió correctamente, pero no incluyó un JWT reconocible.",
        "error"
      );
      logEmail.focus();
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    setFormMessage(logFormMessage, "Inicio de sesión correcto.", "success");
    await enterProtectedView();
  } catch (err) {
    showNetworkError(interpretNetworkError(err));
  } finally {
    setLoading(formLogin, submitBtn, false);
  }
});

/* ==============================================================
   VISTA PROTEGIDA
   ============================================================== */
function getTeamsArray(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];

  const candidates = [
    body.teams,
    body.data,
    body.results,
    body.items,
    body.data?.teams,
    body.data?.results,
    body.response,
  ];
  return candidates.find(Array.isArray) || [];
}

function isTechnicalIdentifier(value) {
  if (typeof value !== "string") return false;
  const text = value.trim();

  // ObjectId de MongoDB, UUID y cadenas hexadecimales largas.
  return (
    /^[a-f\d]{24}$/i.test(text) ||
    /^[a-f\d]{8}-[a-f\d]{4}-[1-5][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(text) ||
    /^[a-f\d]{20,}$/i.test(text)
  );
}

function readableText(value) {
  if (typeof value === "string") {
    const text = value.trim();
    return text && !isTechnicalIdentifier(text) ? text : "";
  }

  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";

  // Algunas APIs devuelven nombres traducidos como { es: "...", en: "..." }.
  for (const languageKey of ["es", "en", "name", "label", "value"]) {
    const text = readableText(value[languageKey]);
    if (text) return text;
  }

  return "";
}

function teamLabel(team, index) {
  if (team === null || team === undefined) return `Equipo ${index + 1}`;

  const directText = readableText(team);
  if (directText) return directText;
  if (typeof team !== "object") return `Equipo ${index + 1}`;

  // Primero se revisan nombres directos y luego objetos anidados comunes.
  const preferredPaths = [
    ["name"],
    ["teamName"],
    ["team_name"],
    ["displayName"],
    ["shortName"],
    ["countryName"],
    ["country_name"],
    ["country", "name"],
    ["country", "displayName"],
    ["nation", "name"],
    ["nation"],
    ["title"],
    ["code"],
    ["fifaCode"],
  ];

  for (const path of preferredPaths) {
    let value = team;
    for (const key of path) value = value?.[key];
    const text = readableText(value);
    if (text) return text;
  }

  // Último recurso: buscar recursivamente un texto legible, ignorando
  // campos técnicos como _id, id, createdAt, updatedAt, etc.
  const ignoredKeys = new Set([
    "_id",
    "id",
    "createdAt",
    "updatedAt",
    "__v",
    "logo",
    "image",
    "flag",
  ]);

  for (const [key, value] of Object.entries(team)) {
    if (ignoredKeys.has(key)) continue;
    const text = readableText(value);
    if (text) return text;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (ignoredKeys.has(nestedKey)) continue;
        const nestedText = readableText(nestedValue);
        if (nestedText) return nestedText;
      }
    }
  }

  return `Equipo ${index + 1}`;
}

async function enterProtectedView() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    goToLoginAfterAuthFailure("Tu sesión no es válida. Inicia sesión de nuevo.");
    return;
  }

  showView("protected");
  const statusEl = $("teams-status");
  const listEl = $("teams-list");
  listEl.replaceChildren();
  statusEl.textContent = "Cargando equipos...";
  hideNetworkError();

  try {
    const response = await fetch(ENDPOINTS.teams, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const body = await readResponseBody(response);

    if (response.status === 401) {
      goToLoginAfterAuthFailure("Tu sesión expiró o el JWT fue alterado. Inicia sesión de nuevo.");
      return;
    }

    if (!response.ok) {
      const message = getServerMessage(body, "No se pudieron cargar los equipos.");
      statusEl.textContent = `Error ${response.status}: ${message}`;
      return;
    }

    const teams = getTeamsArray(body);
    if (teams.length === 0) {
      statusEl.textContent = "La respuesta fue válida, pero no contiene equipos para mostrar.";
      return;
    }

    const fragment = document.createDocumentFragment();
    teams.forEach((team, index) => {
      const item = document.createElement("li");
      item.textContent = teamLabel(team, index);
      fragment.appendChild(item);
    });
    listEl.appendChild(fragment);
    statusEl.textContent = `${teams.length} equipos encontrados.`;
  } catch (err) {
    showNetworkError(interpretNetworkError(err));
    statusEl.textContent = "No fue posible cargar los equipos. La sesión se mantiene para reintentar.";
  }
}

function goToLoginAfterAuthFailure(message) {
  localStorage.removeItem(TOKEN_KEY);
  showView("login");
  setFormMessage(logFormMessage, message, "error");
  logEmail.focus();
}

/* ==============================================================
   LOGOUT Y NAVEGACIÓN
   ============================================================== */
$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  hideNetworkError();
  showView("login");
  setFormMessage(logFormMessage, "Sesión cerrada correctamente.", "success");
  logEmail.focus();
});

$("go-to-login").addEventListener("click", () => {
  hideNetworkError();
  setFormMessage(regFormMessage);
  showView("login");
  logEmail.focus();
});

$("go-to-register").addEventListener("click", () => {
  hideNetworkError();
  setFormMessage(logFormMessage);
  showView("register");
  regName.focus();
});

/* ==============================================================
   ARRANQUE
   ============================================================== */
(function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    enterProtectedView();
  } else {
    showView("register");
  }
})();
