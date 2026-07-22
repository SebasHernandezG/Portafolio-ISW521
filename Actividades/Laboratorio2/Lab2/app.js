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

let views;

function showView(name) {
  // Mostrar solo la vista activa y ocultar el resto.
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[name].classList.remove("hidden");
}

function setFieldError(inputEl, errorEl, message, shouldFocus = true) {
  // Marcar el campo con el error recibido y opcionalmente mover foco.
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

let networkBanner;
let networkBannerText;

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
  // Bloquear el formulario y mostrar un spinner mientras se espera respuesta.
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
  // Guardar la etiqueta original del botón para restaurarla después.
  buttonEl.dataset.defaultLabel = buttonEl.querySelector(".btn-label").textContent;
}

views = {
  register: $("view-register"),
  login: $("view-login"),
  protected: $("view-protected"),
};

networkBanner = $("network-banner");
networkBannerText = $("network-banner-text");

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
  // Validación interactiva para que el usuario reciba retroalimentación inmediata.
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
  // Extrae un mensaje de error legible desde JSON o texto plano.
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
  // Detecta el token JWT en varias estructuras de respuesta posibles.
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

function teamCountryLabel(team) {
  if (team === null || team === undefined) return "";
  if (typeof team === "string") return team;

  const preferredPaths = [
    ["countryName"],
    ["country_name"],
    ["country"],
    ["nation"],
    ["nationality"],
    ["location"],
    ["region"],
    ["country", "name"],
    ["country", "displayName"],
    ["nation", "name"],
    ["nation", "displayName"],
    ["team", "country"],
  ];

  for (const path of preferredPaths) {
    let value = team;
    for (const key of path) value = value?.[key];
    const text = readableText(value);
    if (text) return text;
  }

  if (typeof team === "object" && !Array.isArray(team)) {
    for (const [key, value] of Object.entries(team)) {
      const lower = key.toLowerCase();
      if (lower.includes("country") || lower.includes("nation") || lower.includes("nationality") || lower.includes("location")) {
        const text = readableText(value);
        if (text) return text;
      }
    }
  }

  return "";
}

// Lista de países: código para la bandera (compatible con flagcdn.com,
// incluye los códigos especiales de las 4 naciones del Reino Unido) +
// nombre oficial bien escrito + alias con los que puede venir desde la API.
const COUNTRIES = [
  { code: "AR", display: "Argentina", aliases: ["argentina"] },
  { code: "BR", display: "Brasil", aliases: ["brazil", "brasil"] },
  { code: "FR", display: "Francia", aliases: ["france", "francia"] },
  { code: "ES", display: "España", aliases: ["spain", "espana", "españa"] },
  { code: "DE", display: "Alemania", aliases: ["germany", "alemania", "deutschland"] },
  { code: "GB-ENG", display: "Inglaterra", aliases: ["england", "inglaterra"] },
  { code: "GB-SCT", display: "Escocia", aliases: ["scotland", "escocia"] },
  { code: "GB-WLS", display: "Gales", aliases: ["wales", "gales"] },
  { code: "GB-NIR", display: "Irlanda del Norte", aliases: ["northern ireland", "irlanda del norte"] },
  { code: "GB", display: "Reino Unido", aliases: ["united kingdom", "great britain", "reino unido", "gran bretana"] },
  { code: "IE", display: "Irlanda", aliases: ["ireland", "republic of ireland", "irlanda"] },
  { code: "US", display: "Estados Unidos", aliases: ["united states", "united states of america", "usa", "us", "estados unidos"] },
  { code: "MX", display: "México", aliases: ["mexico", "méxico"] },
  { code: "CA", display: "Canadá", aliases: ["canada", "canadá"] },
  { code: "CO", display: "Colombia", aliases: ["colombia"] },
  { code: "UY", display: "Uruguay", aliases: ["uruguay"] },
  { code: "CL", display: "Chile", aliases: ["chile"] },
  { code: "PE", display: "Perú", aliases: ["peru", "perú"] },
  { code: "JP", display: "Japón", aliases: ["japan", "japon", "japón"] },
  { code: "KR", display: "Corea del Sur", aliases: ["south korea", "korea republic", "republic of korea", "corea del sur"] },
  { code: "KP", display: "Corea del Norte", aliases: ["north korea", "corea del norte"] },
  { code: "ZA", display: "Sudáfrica", aliases: ["south africa", "sudafrica", "sudáfrica"] },
  { code: "MA", display: "Marruecos", aliases: ["morocco", "marruecos"] },
  { code: "TN", display: "Túnez", aliases: ["tunisia", "tunez", "túnez"] },
  { code: "SN", display: "Senegal", aliases: ["senegal"] },
  { code: "EG", display: "Egipto", aliases: ["egypt", "egipto"] },
  { code: "GH", display: "Ghana", aliases: ["ghana"] },
  { code: "CI", display: "Costa de Marfil", aliases: ["ivory coast", "cote d'ivoire", "cote divoire", "costa de marfil"] },
  { code: "CM", display: "Camerún", aliases: ["cameroon", "camerun", "camerún"] },
  { code: "DZ", display: "Argelia", aliases: ["algeria", "argelia"] },
  { code: "CV", display: "Cabo Verde", aliases: ["cabo verde", "cape verde"] },
  { code: "NL", display: "Países Bajos", aliases: ["netherlands", "holland", "paises bajos", "países bajos"] },
  { code: "IT", display: "Italia", aliases: ["italy", "italia"] },
  { code: "PT", display: "Portugal", aliases: ["portugal"] },
  { code: "BE", display: "Bélgica", aliases: ["belgium", "belgica", "bélgica"] },
  { code: "CH", display: "Suiza", aliases: ["switzerland", "suiza"] },
  { code: "HR", display: "Croacia", aliases: ["croatia", "croacia"] },
  { code: "DK", display: "Dinamarca", aliases: ["denmark", "dinamarca"] },
  { code: "SE", display: "Suecia", aliases: ["sweden", "suecia"] },
  { code: "NO", display: "Noruega", aliases: ["norway", "noruega"] },
  { code: "PL", display: "Polonia", aliases: ["poland", "polonia"] },
  { code: "AU", display: "Australia", aliases: ["australia"] },
  { code: "NZ", display: "Nueva Zelanda", aliases: ["new zealand", "nueva zelanda"] },
  { code: "JO", display: "Jordania", aliases: ["jordan", "jordania"] },
  { code: "IQ", display: "Irak", aliases: ["iraq", "irak"] },
  { code: "IR", display: "Irán", aliases: ["iran", "irán"] },
  { code: "SY", display: "Siria", aliases: ["syria", "siria"] },
  { code: "TH", display: "Tailandia", aliases: ["thailand", "tailandia"] },
  { code: "VN", display: "Vietnam", aliases: ["vietnam"] },
  { code: "SA", display: "Arabia Saudita", aliases: ["saudi arabia", "arabia saudita"] },
  { code: "QA", display: "Catar", aliases: ["qatar", "catar"] },
  { code: "AE", display: "Emiratos Árabes Unidos", aliases: ["uae", "united arab emirates", "emiratos arabes unidos", "emiratos árabes unidos"] },
  { code: "GR", display: "Grecia", aliases: ["greece", "grecia"] },
  { code: "CZ", display: "República Checa", aliases: ["czech republic", "czechia", "republica checa", "república checa"] },
  { code: "AT", display: "Austria", aliases: ["austria"] },
  { code: "RU", display: "Rusia", aliases: ["russia", "rusia"] },
  { code: "UA", display: "Ucrania", aliases: ["ukraine", "ucrania"] },
  { code: "HU", display: "Hungría", aliases: ["hungary", "hungria", "hungría"] },
  { code: "RO", display: "Rumania", aliases: ["romania", "rumania", "rumanía"] },
  { code: "RS", display: "Serbia", aliases: ["serbia"] },
  { code: "SI", display: "Eslovenia", aliases: ["slovenia", "eslovenia"] },
  { code: "SK", display: "Eslovaquia", aliases: ["slovakia", "eslovaquia"] },
  { code: "BA", display: "Bosnia y Herzegovina", aliases: ["bosnia and herzegovina", "bosnia", "bosnia y herzegovina"] },
  { code: "LV", display: "Letonia", aliases: ["latvia", "letonia"] },
  { code: "LT", display: "Lituania", aliases: ["lithuania", "lituania"] },
  { code: "EE", display: "Estonia", aliases: ["estonia"] },
  { code: "FI", display: "Finlandia", aliases: ["finland", "finlandia"] },
  { code: "CR", display: "Costa Rica", aliases: ["costa rica"] },
  { code: "PA", display: "Panamá", aliases: ["panama", "panamá"] },
  { code: "VE", display: "Venezuela", aliases: ["venezuela"] },
  { code: "EC", display: "Ecuador", aliases: ["ecuador"] },
  { code: "PY", display: "Paraguay", aliases: ["paraguay"] },
  { code: "BO", display: "Bolivia", aliases: ["bolivia"] },
  { code: "SS", display: "Sudán del Sur", aliases: ["south sudan", "sudan del sur", "sudán del sur"] },
  { code: "SL", display: "Sierra Leona", aliases: ["sierra leone", "sierra leona"] },
  { code: "ZW", display: "Zimbabue", aliases: ["zimbabwe", "zimbabue"] },
  { code: "ZM", display: "Zambia", aliases: ["zambia"] },
  { code: "KE", display: "Kenia", aliases: ["kenya", "kenia"] },
  { code: "NG", display: "Nigeria", aliases: ["nigeria"] },
  { code: "AO", display: "Angola", aliases: ["angola"] },
  { code: "GA", display: "Gabón", aliases: ["gabon", "gabón"] },
  { code: "GQ", display: "Guinea Ecuatorial", aliases: ["equatorial guinea", "guinea ecuatorial"] },
  { code: "GN", display: "Guinea", aliases: ["guinea"] },
  { code: "GW", display: "Guinea-Bisáu", aliases: ["guinea-bissau", "guinea bissau", "guinea-bisau"] },
  { code: "ML", display: "Malí", aliases: ["mali", "malí"] },
  { code: "BF", display: "Burkina Faso", aliases: ["burkina faso"] },
  { code: "BJ", display: "Benín", aliases: ["benin", "benín"] },
  { code: "TG", display: "Togo", aliases: ["togo"] },
  { code: "MZ", display: "Mozambique", aliases: ["mozambique"] },
  { code: "UZ", display: "Uzbekistán", aliases: ["uzbekistan", "uzbekistán"] },
  { code: "CN", display: "China", aliases: ["china"] },
  { code: "IN", display: "India", aliases: ["india"] },
  { code: "ID", display: "Indonesia", aliases: ["indonesia"] },
  { code: "IL", display: "Israel", aliases: ["israel"] },
  { code: "TR", display: "Turquía", aliases: ["turkey", "turkiye", "turquia", "turquía"] },
  { code: "IS", display: "Islandia", aliases: ["iceland", "islandia"] },
  { code: "CY", display: "Chipre", aliases: ["cyprus", "chipre"] },
  { code: "AL", display: "Albania", aliases: ["albania"] },
  { code: "MK", display: "Macedonia del Norte", aliases: ["north macedonia", "macedonia del norte"] },
  { code: "MD", display: "Moldavia", aliases: ["moldova", "moldavia"] },
  { code: "GE", display: "Georgia", aliases: ["georgia"] },
  { code: "AM", display: "Armenia", aliases: ["armenia"] },
  { code: "AZ", display: "Azerbaiyán", aliases: ["azerbaijan", "azerbaiyan", "azerbaiyán"] },
  { code: "KZ", display: "Kazajistán", aliases: ["kazakhstan", "kazajistan", "kazajistán"] },
  { code: "LU", display: "Luxemburgo", aliases: ["luxembourg", "luxemburgo"] },
  { code: "MT", display: "Malta", aliases: ["malta"] },
  { code: "BG", display: "Bulgaria", aliases: ["bulgaria"] },
  { code: "HT", display: "Haití", aliases: ["haiti", "haití"] },
  { code: "JM", display: "Jamaica", aliases: ["jamaica"] },
  { code: "HN", display: "Honduras", aliases: ["honduras"] },
  { code: "GT", display: "Guatemala", aliases: ["guatemala"] },
  { code: "SV", display: "El Salvador", aliases: ["el salvador"] },
  { code: "NI", display: "Nicaragua", aliases: ["nicaragua"] },
  { code: "CU", display: "Cuba", aliases: ["cuba"] },
  { code: "DO", display: "República Dominicana", aliases: ["dominican republic", "republica dominicana", "república dominicana"] },
  { code: "TT", display: "Trinidad y Tobago", aliases: ["trinidad and tobago", "trinidad y tobago"] },
];

// Se construyen los mapas de búsqueda (nombre normalizado -> código / nombre oficial)
// a partir de la lista anterior, evitando duplicados por accidente.
const COUNTRY_NAME_TO_CODE = {};
const COUNTRY_NAME_TO_DISPLAY = {};
COUNTRIES.forEach(({ code, display, aliases }) => {
  [display, ...aliases].forEach((alias) => {
    const key = normalizeCountryName(alias);
    if (!key) return;
    COUNTRY_NAME_TO_CODE[key] = code;
    COUNTRY_NAME_TO_DISPLAY[key] = display;
  });
});

function normalizeCountryName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z\s]/g, "");
}

function countryCodeFor(name) {
  const normalized = normalizeCountryName(name);
  return COUNTRY_NAME_TO_CODE[normalized] || "";
}

function countryDisplayName(name) {
  const normalized = normalizeCountryName(name);
  return COUNTRY_NAME_TO_DISPLAY[normalized] || "";
}

function countryFlagEmoji(name) {
  const code = countryCodeFor(name);
  // Los emojis de bandera solo existen para códigos ISO de 2 letras
  // (por ejemplo "GB-SCT" no tiene emoji propio, así que se omite).
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function countryFlagImageUrl(code) {
  // flagcdn.com sirve banderas reales en PNG: funciona igual en cualquier
  // sistema operativo, sin depender de que el navegador tenga fuente de emoji.
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
}

function teamFlagLabel(name) {
  const emoji = countryFlagEmoji(name);
  if (emoji) return emoji;
  if (!name || typeof name !== "string") return "WC";
  const parts = name
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function teamFlagColor(name) {
  if (!name || typeof name !== "string") return "linear-gradient(135deg, #d4af37, #e8cf7a)";
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue}, 72%, 66%), hsl(${(hue + 40) % 360}, 72%, 58%))`;
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
      const rawName = teamLabel(team, index);
      const teamCountry = teamCountryLabel(team);
      const countryCode = countryCodeFor(teamCountry) || countryCodeFor(rawName);
      // Si el país se reconoce, se muestra su nombre oficial bien escrito
      // (con tildes correctas); si no, se deja el texto tal como vino de la API.
      const teamName = countryDisplayName(teamCountry) || countryDisplayName(rawName) || rawName;

      const item = document.createElement("li");

      if (countryCode) {
        const flagUrl = countryFlagImageUrl(countryCode);
        item.innerHTML = `
          <div class="team-card">
            <div class="team-flag team-flag-img">
              <img src="${flagUrl}" alt="Bandera de ${teamName}" loading="lazy"
                   onerror="this.closest('.team-flag').outerHTML = '<div class=&quot;team-flag&quot; aria-hidden=&quot;true&quot; style=&quot;background: ${teamFlagColor(teamName)}&quot;>${teamFlagLabel(teamName)}</div>'" />
            </div>
            <div class="team-meta">
              <span class="team-name">${teamName}</span>
              <span class="team-subtitle">Equipo ${index + 1}</span>
            </div>
          </div>
        `;
      } else {
        const flagText = teamFlagLabel(teamName);
        item.innerHTML = `
          <div class="team-card">
            <div class="team-flag" aria-hidden="true" style="background: ${teamFlagColor(teamName)}">${flagText}</div>
            <div class="team-meta">
              <span class="team-name">${teamName}</span>
              <span class="team-subtitle">Equipo ${index + 1}</span>
            </div>
          </div>
        `;
      }

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