export const renderizarResultados = (cantidad) => {
    const resultadosContainer = document.querySelector("#app");
    resultadosContainer.innerHTML = `
<div class="tarjeta">
  <h1><h2>gestion de usuarios</h2></h1>
  <p>Cantidad de usuarios es de ${cantidad}</p>
</div>
  `;
  }