AcueductosIoT — Laboratorio Flexbox funcional

Archivos:
- index.html
- styles.css
- script.js
- capturas/

Funcionalidad agregada:
Evaluador IoT de Riesgo Hídrico. Permite ingresar presión, nivel del tanque y cloro residual. Con esos valores actualiza las tarjetas de sensores, calcula riesgo bajo/medio/alto, cambia el estado general del sistema y actualiza el panel de alertas.

Accesibilidad aplicada:
- Enlace para saltar al contenido principal.
- Formularios con label asociado.
- Mensajes dinámicos con aria-live.
- Foco visible con :focus-visible.
- No se depende solo del color: los estados también aparecen como texto.
- Respeta prefers-reduced-motion.

Requisitos Flexbox cubiertos:
- Navbar con display flex, justify-content space-between, align-items center y min-height 60px.
- Lista de enlaces con display flex, gap 24px y list-style none.
- Sensor-grid con display flex, flex-wrap wrap y gap 16px.
- Tarjetas con flex-basis calc(33.333% - 16px).
- Layout principal con flex 1 / 3 / 1.
- Responsive con media query max-width 768px.

No se usan floats ni position absolute/fixed para maquetar.
