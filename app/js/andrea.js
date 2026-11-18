// La app de la tallerista en el celular: una pantalla por momento de la semana, una tarea por pantalla.
// Sale de producto/historias-y-flujos.md (H1–H11). Ruta: #/andrea?p=hoy|preparar|aplicar|acompanar
import { banco, estado, guardar, pregunta, estadoDe, contadores, textoDe } from './estado.js';
import { ic, esc, LETRAS, GRUPO, toast } from './ui.js';
import { respondieronHoy } from './hoy.js';
import { activosHoy, areaMasBaja, POR_LLAMAR } from './grupo.js';
import { hojasPendientes } from './hojas.js';

const CODIGO_DEMO = 'SAB-2741';
let contactados = new Set();

const pantalla = () => new URLSearchParams(location.hash.split('?')[1] || '').get('p') || 'hoy';
let web = false;  // en el computador, cada momento tiene su ruta propia
const RUTA_WEB = { hoy: '#/', preparar: '#/preparar', aplicar: '#/aplicar', acompanar: '#/acompanar' };
const ir = p => { location.hash = web ? RUTA_WEB[p] : `#/andrea?p=${p}`; };

function barraInferior(actual) {
  const t = [['hoy', 'casa', 'Hoy'], ['preparar', 'libro', 'Preparar'], ['aplicar', 'hoja', 'Aplicar'], ['acompanar', 'graf', 'Acompañar']];
  return `<nav class="a-nav">${t.map(([p, i, n]) => `<button data-ir="${p}" ${p === actual ? 'aria-current="page"' : ''}>${ic(i, 20)}<span>${n}</span></button>`).join('')}</nav>`;
}

function publicar() {
  estado.simulacro = { ...estado.simulacro, codigo: estado.simulacro.codigo || CODIGO_DEMO, publicado: Date.now() };
  guardar();
}

// Hoy: una sola acción, la que toca ahora.
function hoy() {
  const sim = estado.simulacro;
  const n = respondieronHoy();
  const accion = sim.publicado ? `
    <div class="a-hero">
      <span class="a-lbl">Simulacro ${sim.numero} en curso</span>
      <div class="a-grande">${n}<small> de ${GRUPO.inscritos}</small></div>
      <span class="a-sub">ya respondieron</span>
      <div class="a-barra"><div style="width:${100 * n / GRUPO.inscritos}%"></div></div>
      <button class="a-btn" data-ir="aplicar">Ver el sábado</button>
    </div>` : `
    <div class="a-hero">
      <span class="a-lbl">Lo que toca ahora</span>
      <div class="a-titulo">Publica el simulacro ${sim.numero}</div>
      <span class="a-sub">${sim.ids.length} preguntas aprobadas por el comité</span>
      <button class="a-btn" data-acc="publicar">Publicar</button>
    </div>`;
  const porContactar = GRUPO.inscritos - activosHoy();
  return `
    <p class="a-saludo">Hola, <b>Andrea</b></p>
    <p class="a-fecha">${GRUPO.hoy}</p>
    ${accion}
    <p class="a-sec">Esta semana</p>
    <div class="a-semana">
      <button data-ir="preparar"><span class="a-check ok">${ic('ok', 14)}</span><div><b>Preparar</b><span>${contadores().pendientes} preguntas esperan al comité</span></div></button>
      <button data-ir="aplicar" class="ahora"><span class="a-check">2</span><div><b>Aplicar · hoy</b><span>${sim.publicado ? `${n} de ${GRUPO.inscritos} respondieron` : 'por publicar'}</span></div></button>
      <button data-ir="acompanar"><span class="a-check">3</span><div><b>Acompañar · lunes</b><span>${porContactar} estudiantes por contactar</span></div></button>
    </div>`;
}

// Preparar: el comité revisa una propuesta a la vez.
function preparar() {
  const pend = banco.preguntas.filter(q => q.estado !== 'propia' && estadoDe(q) === 'pendiente');
  const c = contadores();
  if (!pend.length) return `<p class="a-titulo">No quedan propuestas por revisar</p>`;
  const q = pregunta(pend[0].id);
  const base = textoDe(q);
  return `
    <p class="a-sec" style="margin-top:0">Preparar · comité</p>
    <div class="a-titulo">Revisa la pregunta</div>
    <p class="a-sub">${c.pendientes} por revisar · ${c.iaAprobadas + c.propias} en el banco</p>
    <div class="a-pregunta">
      <span class="a-chip ia">${ic('chispa', 12)} Propuesta por IA · ${esc(banco.areas[q.area])}</span>
      ${base ? `<p class="a-base">${esc(base.slice(0, 140))}${base.length > 140 ? '…' : ''}</p>` : ''}
      <p class="a-enun">${esc(q.enunciado)}</p>
      <ol class="a-ops">${q.opciones.map((o, i) => `<li class="${i === q.clave ? 'clave' : ''}"><span>${LETRAS[i]}</span>${esc(o)}</li>`).join('')}</ol>
    </div>
    <div class="a-acciones">
      <button class="a-btn" data-acc="aprobar" data-id="${q.id}">${ic('ok', 16)} Aprobar</button>
      <button class="a-btn sec" data-acc="descartar" data-id="${q.id}">Descartar</button>
    </div>`;
}

// Aplicar: el código del grupo y cuántos van respondiendo; las hojas en papel solo si las hay.
function aplicar() {
  const sim = estado.simulacro;
  if (!sim.publicado) return `
    <p class="a-sec" style="margin-top:0">Aplicar · sábado</p>
    <div class="a-titulo">El simulacro ${sim.numero} está listo</div>
    <p class="a-sub">${sim.ids.length} preguntas · se responde en el celular, aun sin señal</p>
    <button class="a-btn" data-acc="publicar" style="margin-top:18px">Publicar</button>`;
  const n = respondieronHoy();
  const hp = hojasPendientes();
  return `
    <p class="a-sec" style="margin-top:0">Aplicar · sábado</p>
    <div class="a-codigo"><span>Código del grupo</span><b>${esc(sim.codigo)}</b></div>
    <div class="a-hero claro">
      <div class="a-grande">${n}<small> de ${GRUPO.inscritos}</small></div>
      <span class="a-sub">respondieron · llegan solas al volver la señal</span>
      <div class="a-barra"><div style="width:${100 * n / GRUPO.inscritos}%"></div></div>
    </div>
    ${hp ? `<button class="a-fila" data-acc="papel"><span class="a-ico">${ic('camara', 18)}</span><div><b>${hp} hojas en papel</b><span>Toma una foto de cada una</span></div></button>` : ''}`;
}

// Acompañar: a quién contactar esta semana, con nombre.
function acompanar() {
  const bajo = areaMasBaja();
  const sin = GRUPO.inscritos - activosHoy();
  return `
    <p class="a-sec" style="margin-top:0">Acompañar · lunes</p>
    <div class="a-titulo">${sin} dejaron de responder</div>
    <p class="a-sub">hace dos semanas o más · ${activosHoy()} de ${GRUPO.inscritos} siguen activos</p>
    <ul class="a-personas">${POR_LLAMAR.map(e => {
      const ok = contactados.has(e.n);
      return `<li><span class="a-av">${esc(e.n.split(' ').map(x => x[0]).join(''))}</span><div><b>${esc(e.n)}</b><span>${esc(e.d)}</span></div>
        <button class="a-mini ${ok ? 'hecho' : ''}" data-acc="contactar" data-n="${esc(e.n)}">${ok ? ic('ok', 14) : 'Contactar'}</button></li>`;
    }).join('')}</ul>
    <div class="a-fila estatica"><span class="a-ico ambar">${ic('graf', 18)}</span><div><b>${esc(bajo.nombre)}: ${bajo.pct} %</b><span>El área más baja del grupo</span></div></div>
    <button class="a-btn sec" data-acc="refuerzo">${ic('chispa', 16)} Práctica de refuerzo con IA</button>`;
}

const PANTALLAS = { hoy, preparar, aplicar, acompanar };

// En el computador: la misma pantalla, sin el marco del celular, dentro del menú lateral.
export const enWeb = p => (el, render) => {
  web = true;
  el.innerHTML = `<div class="a-web">${(PANTALLAS[p] || hoy)()}</div>`;
  conectar(el, render);
};

export function andrea(el, render) {
  web = false;
  const p = pantalla();
  const hora = new Date().toTimeString().slice(0, 5);
  el.innerHTML = `
  <div class="escena solo">
    <div class="celular andrea"><div class="pantalla">
      <div class="barra-estado"><span>${hora}</span><span>${ic('wifi', 15)}</span></div>
      <div class="app-cel a-cuerpo">
        <div class="cel-top"><span class="marca"><img class="logo" src="img/logo-isotipo.svg" alt="">Impulso <b>U</b></span><span class="a-av chico">AR</span></div>
        ${(PANTALLAS[p] || hoy)()}
      </div>
      ${barraInferior(p)}
    </div></div>
  </div>`;
  conectar(el.querySelector('.celular'), render);
}

function conectar(cel, render) {
  cel.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
  cel.querySelector('[data-acc="publicar"]')?.addEventListener('click', () => { publicar(); render(); });
  cel.querySelectorAll('[data-acc="aprobar"], [data-acc="descartar"]').forEach(b => b.addEventListener('click', () => {
    estado.decisiones[b.dataset.id] = b.dataset.acc === 'aprobar' ? 'aprobada' : 'descartada';
    guardar();
    toast(b.dataset.acc === 'aprobar' ? 'Aprobada: ya puede entrar a un simulacro' : 'Descartada');
    render();
  }));
  cel.querySelectorAll('[data-acc="contactar"]').forEach(b => b.addEventListener('click', () => { contactados.add(b.dataset.n); render(); }));
  cel.querySelector('[data-acc="refuerzo"]')?.addEventListener('click', () => toast('La IA arma 5 preguntas de refuerzo para el comité'));
  cel.querySelector('[data-acc="papel"]')?.addEventListener('click', () => { location.hash = '#/hojas'; });
}
