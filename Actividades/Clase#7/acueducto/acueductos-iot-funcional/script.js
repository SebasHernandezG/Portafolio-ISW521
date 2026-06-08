const form = document.querySelector('#risk-form');
const resetButton = document.querySelector('#reset-button');
const logoutButton = document.querySelector('#logout-button');

const pressureInput = document.querySelector('#pressure-input');
const tankInput = document.querySelector('#tank-input');
const chlorineInput = document.querySelector('#chlorine-input');

const pressureReading = document.querySelector('#pressure-reading');
const tankReading = document.querySelector('#tank-reading');
const chlorineReading = document.querySelector('#chlorine-reading');
const riskLevel = document.querySelector('#risk-level');
const riskMessage = document.querySelector('#risk-message');
const riskDetail = document.querySelector('#risk-detail');
const generalStatus = document.querySelector('#general-status');
const lastUpdate = document.querySelector('#last-update');
const alertList = document.querySelector('#alert-list');
const alertCount = document.querySelector('#alert-count');

function toNumber(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function setRiskClass(level) {
  riskLevel.classList.remove('risk-level--low', 'risk-level--medium', 'risk-level--high');
  generalStatus.classList.remove('summary-card__value--ok', 'summary-card__value--warning', 'summary-card__value--danger');

  if (level === 'low') {
    riskLevel.classList.add('risk-level--low');
    generalStatus.classList.add('summary-card__value--ok');
  }

  if (level === 'medium') {
    riskLevel.classList.add('risk-level--medium');
    generalStatus.classList.add('summary-card__value--warning');
  }

  if (level === 'high') {
    riskLevel.classList.add('risk-level--high');
    generalStatus.classList.add('summary-card__value--danger');
  }
}

function buildAlert(title, text, type) {
  const article = document.createElement('article');
  article.className = `alert ${type}`;

  const heading = document.createElement('h3');
  heading.textContent = title;

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  article.append(heading, paragraph);
  return article;
}

function evaluateRisk(event) {
  if (event) {
    event.preventDefault();
  }

  const pressure = toNumber(pressureInput, 28);
  const tank = toNumber(tankInput, 73);
  const chlorine = toNumber(chlorineInput, 0.4);

  pressureReading.textContent = `${pressure} PSI`;
  tankReading.textContent = `${tank}%`;
  chlorineReading.textContent = `${chlorine.toFixed(1)} mg/L`;
  lastUpdate.textContent = 'Ahora';

  alertList.replaceChildren();
  let alerts = 0;

  if (pressure < 25 || tank < 25 || chlorine < 0.2 || chlorine > 1.0) {
    setRiskClass('high');
    riskLevel.textContent = 'Riesgo alto';
    riskMessage.textContent = 'Se recomienda revisión prioritaria porque existe una condición crítica en la red hídrica.';
    riskDetail.textContent = 'Criterio: presión muy baja, tanque bajo o cloro fuera de rango seguro.';
    generalStatus.textContent = 'Atención crítica';
    alertList.append(buildAlert('Riesgo alto detectado', 'Revise presión, nivel del tanque y calidad del agua antes de continuar operación normal.', 'urgent'));
    alerts += 1;
  } else if (pressure < 30 || tank < 40 || chlorine < 0.3 || chlorine > 0.5) {
    setRiskClass('medium');
    riskLevel.textContent = 'Riesgo medio';
    riskMessage.textContent = 'La red puede operar, pero requiere observación técnica y seguimiento cercano.';
    riskDetail.textContent = 'Criterio: al menos una lectura está cerca del límite recomendado.';
    generalStatus.textContent = 'En observación';
    alertList.append(buildAlert('Condición bajo observación', 'Una lectura está cerca del umbral definido para operación normal.', 'warning'));
    alerts += 1;
  } else {
    setRiskClass('low');
    riskLevel.textContent = 'Riesgo bajo';
    riskMessage.textContent = 'Las lecturas simuladas están dentro del rango operativo esperado.';
    riskDetail.textContent = 'Criterio: presión, tanque y cloro se encuentran en valores aceptables.';
    generalStatus.textContent = 'Operativo';
    alertList.append(buildAlert('Sistema operativo', 'No se detectan condiciones críticas en los sensores evaluados.', 'normal'));
    alerts += 1;
  }

  if (pressure < 30) {
    alertList.append(buildAlert('Presión por debajo del umbral', `${pressure} PSI. Umbral mínimo recomendado: 30 PSI.`, 'urgent'));
    alerts += 1;
  }

  if (tank < 40) {
    alertList.append(buildAlert('Nivel de tanque bajo', `${tank}%. Se recomienda revisar abastecimiento y consumo.`, 'warning'));
    alerts += 1;
  }

  if (chlorine < 0.3 || chlorine > 0.5) {
    alertList.append(buildAlert('Cloro fuera del rango ideal', `${chlorine.toFixed(1)} mg/L. Rango de referencia usado: 0.3 a 0.5 mg/L.`, 'warning'));
    alerts += 1;
  }

  alertCount.textContent = String(alerts);
  alertCount.setAttribute('aria-label', `Cantidad de alertas activas: ${alerts}`);
}

function resetValues() {
  pressureInput.value = '28';
  tankInput.value = '73';
  chlorineInput.value = '0.4';
  evaluateRisk();
}

form.addEventListener('submit', evaluateRisk);
resetButton.addEventListener('click', resetValues);
logoutButton.addEventListener('click', () => {
  window.alert('Modo demostración: no se cerró ninguna sesión real.');
});

evaluateRisk();
