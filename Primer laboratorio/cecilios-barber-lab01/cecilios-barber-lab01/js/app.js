const WHATSAPP_NUMBER = "50686199888";
const cartKey = "ceciliosCart";
const themeKey = "ceciliosTheme";
const zoomKey = "ceciliosZoom";
const contrastKey = "ceciliosContrast";
const motionKey = "ceciliosMotion";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const menuToggle = $("[data-menu-toggle]");
const menu = $("[data-menu]");
const accessMenu = $("[data-access-menu]");
const accessToggle = $("[data-access-toggle]");
const accessPanel = $("[data-access-panel]");
const themeSwitch = $("[data-pref-theme-switch]");
const zoomOptions = $$("[data-pref-zoom]");
const contrastOption = $("[data-pref-contrast]");
const motionOption = $("[data-pref-motion]");
const cartDrawer = $("[data-cart-drawer]");
const cartItems = $("[data-cart-items]");
const cartCount = $("[data-cart-count]");
const cartTotal = $("[data-cart-total]");
const toast = $("[data-toast]");

let cart = readCart();
let toastTimer;
let lastFocusedElement = null;

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0
  }).format(value);
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderCart() {
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartCount) cartCount.textContent = totalUnits;
  if (cartTotal) cartTotal.textContent = formatCRC(totalPrice);

  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">No hay cortes o productos agregados.</p>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <article class="cart-item">
      <div>
        <h3>${item.name}</h3>
        <p>${item.price > 0 ? formatCRC(item.price) : "Sin costo"}</p>
      </div>
      <div class="cart-controls" role="group" aria-label="Controles para ${item.name}">
        <button type="button" data-cart-minus="${item.id}" aria-label="Restar ${item.name}">−</button>
        <strong>${item.quantity}</strong>
        <button type="button" data-cart-plus="${item.id}" aria-label="Sumar ${item.name}">+</button>
      </div>
    </article>
  `).join("");
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} agregado al carrito.`);
}

function updateQuantity(id, direction) {
  const item = cart.find(product => product.id === id);
  if (!item) return;

  item.quantity += direction;

  if (item.quantity <= 0) {
    cart = cart.filter(product => product.id !== id);
  }

  saveCart();
  renderCart();
}

function openCart() {
  if (!cartDrawer) return;

  lastFocusedElement = document.activeElement;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("[data-cart-close]")?.focus();
}

function closeCart() {
  if (!cartDrawer) return;

  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function sendToWhatsapp() {
  if (!cart.length) {
    showToast("Agrega primero un corte o producto.");
    return;
  }

  const lines = cart.map(item => {
    const price = item.price > 0 ? ` - ${formatCRC(item.price * item.quantity)}` : "";
    return `• ${item.quantity} x ${item.name}${price}`;
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const message = [
    "Hola, quiero hacer este pedido en Cecilio's Barber:",
    "",
    ...lines,
    "",
    `Total estimado: ${formatCRC(total)}`
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function setTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = selectedTheme;
  localStorage.setItem(themeKey, selectedTheme);
}

function setZoom(level) {
  const allowedLevels = ["normal", "large", "xlarge"];
  const zoomLevel = allowedLevels.includes(level) ? level : "normal";

  document.documentElement.dataset.zoom = zoomLevel;
  localStorage.setItem(zoomKey, zoomLevel);
}

function setContrast(mode) {
  const contrastMode = mode === "high" ? "high" : "normal";

  document.documentElement.dataset.contrast = contrastMode;
  localStorage.setItem(contrastKey, contrastMode);
}

function setMotionPreference(mode) {
  const motionMode = mode === "reduced" ? "reduced" : "normal";

  document.documentElement.dataset.motion = motionMode;
  localStorage.setItem(motionKey, motionMode);
}

function syncAccessibilityControls() {
  if (themeSwitch) {
    themeSwitch.checked = document.documentElement.dataset.theme === "light";
  }

  zoomOptions.forEach(option => {
    option.checked = option.value === document.documentElement.dataset.zoom;
  });

  if (contrastOption) {
    contrastOption.checked = document.documentElement.dataset.contrast === "high";
  }

  if (motionOption) {
    motionOption.checked = document.documentElement.dataset.motion === "reduced";
  }
}

function toggleAccessMenu(forceOpen) {
  if (!accessToggle || !accessPanel) return;

  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : accessPanel.hidden;
  accessPanel.hidden = !shouldOpen;
  accessToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function loadAccessibilityPreferences() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const savedTheme = localStorage.getItem(themeKey);
  const savedZoom = localStorage.getItem(zoomKey);
  const savedContrast = localStorage.getItem(contrastKey);
  const savedMotion = localStorage.getItem(motionKey);

  setTheme(savedTheme === "light" ? "light" : "dark");
  setZoom(["normal", "large", "xlarge"].includes(savedZoom) ? savedZoom : "normal");
  setContrast(savedContrast === "high" ? "high" : "normal");

  if (savedMotion === "reduced" || (!savedMotion && prefersReducedMotion)) {
    setMotionPreference("reduced");
  } else {
    setMotionPreference("normal");
  }

  syncAccessibilityControls();
}

function getFocusableElements(container) {
  return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
    .filter(element => element.offsetParent !== null);
}

function keepFocusInsideCart(event) {
  if (!cartDrawer || event.key !== "Tab" || !cartDrawer.classList.contains("is-open")) return;

  const focusableElements = getFocusableElements(cartDrawer);
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

menu?.addEventListener("click", event => {
  if (event.target.matches("a") && menu.classList.contains("is-open")) {
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
  }
});

accessToggle?.addEventListener("click", () => {
  toggleAccessMenu();
});

themeSwitch?.addEventListener("change", () => {
  const selectedTheme = themeSwitch.checked ? "light" : "dark";
  setTheme(selectedTheme);
  syncAccessibilityControls();
  showToast(selectedTheme === "light" ? "Modo claro aplicado." : "Modo oscuro aplicado.");
});

zoomOptions.forEach(option => {
  option.addEventListener("change", () => {
    if (!option.checked) return;
    setZoom(option.value);
    syncAccessibilityControls();
    const labels = {
      normal: "Texto normal aplicado.",
      large: "Texto grande aplicado.",
      xlarge: "Texto muy grande aplicado."
    };
    showToast(labels[option.value] || "Tamaño aplicado.");
  });
});

contrastOption?.addEventListener("change", () => {
  setContrast(contrastOption.checked ? "high" : "normal");
  syncAccessibilityControls();
  showToast(contrastOption.checked ? "Alto contraste aplicado." : "Contraste estándar aplicado.");
});

motionOption?.addEventListener("change", () => {
  setMotionPreference(motionOption.checked ? "reduced" : "normal");
  syncAccessibilityControls();
  showToast(motionOption.checked ? "Movimiento reducido aplicado." : "Animación estándar aplicada.");
});

$$('[data-cart-add]').forEach(button => {
  button.addEventListener("click", () => {
    addToCart({
      id: button.dataset.id,
      name: button.dataset.name,
      price: Number(button.dataset.price || 0)
    });
  });
});

$$('[data-cart-open]').forEach(button => button.addEventListener("click", openCart));
$("[data-cart-close]")?.addEventListener("click", closeCart);
$("[data-cart-whatsapp]")?.addEventListener("click", sendToWhatsapp);

cartDrawer?.addEventListener("click", event => {
  if (event.target === cartDrawer) closeCart();
});

cartItems?.addEventListener("click", event => {
  const minus = event.target.closest("[data-cart-minus]");
  const plus = event.target.closest("[data-cart-plus]");

  if (minus) updateQuantity(minus.dataset.cartMinus, -1);
  if (plus) updateQuantity(plus.dataset.cartPlus, 1);
});

document.addEventListener("click", event => {
  if (!accessMenu || !accessPanel || accessPanel.hidden) return;
  if (!accessMenu.contains(event.target)) {
    toggleAccessMenu(false);
  }
});

document.addEventListener("keydown", event => {
  keepFocusInsideCart(event);

  if (event.key === "Escape" && cartDrawer?.classList.contains("is-open")) {
    closeCart();
  }

  if (event.key === "Escape" && accessPanel && !accessPanel.hidden) {
    toggleAccessMenu(false);
    accessToggle?.focus();
  }
});

loadAccessibilityPreferences();
renderCart();
