import { cargar, reiniciar, sincronizar, contadores, estado } from './estado.js';
import { hoy, aplicar, llegadasSimuladas, LLEGADAS } from './hoy.js';
import { banco } from './banco.js';
import { simulacros } from './simulacros.js';
import { grupo } from './grupo.js';
import { reporte } from './reporte.js';
import { hojas, hojasPendientes } from './hojas.js';
import { estudiante } from './simulacro.js';
import { crear } from './crear.js';
import { andrea, enWeb } from './andrea.js';
import { login, sesion, cerrarSesion } from './login.js';
import { iniciar as recorrido } from './tour.js';

const RUTAS = { '': enWeb('hoy'), preparar: enWeb('preparar'), aplicar: enWeb('aplicar'), acompanar: enWeb('acompanar'), banco, simulacros, crear, grupo, hojas, estudiante, reporte, andrea, resumen: hoy };

// La tallerista piensa por momento de la semana, no por pantalla: cada momento agrupa sus pantallas en pestañas.
const SECCIONES = {
  preparar: [['preparar', 'Revisar'], ['crear', 'Sumar con IA, foto o Icfes'], ['simulacros', 'Armar el simulacro'], ['banco', 'Todo el banco']],
  aplicar: [['aplicar', 'El simulacro de hoy'], ['hojas', 'Hojas en papel']],
  acompanar: [['acompanar', 'Esta semana'], ['grupo', 'El grupo en detalle'], ['reporte', 'Reporte para el municipio']]
};
const seccionDe = r => r === '' ? 'hoy' : Object.keys(SECCIONES).find(k => SECCIONES[k].some(([id]) => id === r)) || 'hoy';

function pestanas(ruta, sec) {
  const caja = document.getElementById('pestanas');
  const lista = (SECCIONES[sec] || []).filter(([id]) => id !== 'hojas' || hojasPendientes() || ruta === 'hojas');
  caja.hidden = lista.length < 2;
  caja.innerHTML = lista.map(([id, t]) => `<a href="#/${id}" ${id === ruta ? 'aria-current="page"' : ''}>${t}${id === 'banco' && contadores().pendientes ? ` <span class="badge">${contadores().pendientes}</span>` : ''}${id === 'hojas' && hojasPendientes() ? ` <span class="badge">${hojasPendientes()}</span>` : ''}</a>`).join('');
}

const vista = document.getElementById('vista');
const app = document.getElementById('app');

function rutaActual() {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0];
  return r in RUTAS ? r : '';
}

export function render() {
  const ruta = rutaActual();
  const modo = ruta === 'estudiante' ? 'estudiante' : 'tallerista';
  const celular = ruta === 'estudiante' || ruta === 'andrea';
  const fuera = modo === 'tallerista' && ruta !== 'andrea' && !sesion();
  app.classList.toggle('sin-lateral', celular || fuera);
  document.querySelectorAll('[data-modo]').forEach(a => a.setAttribute('aria-current', String(a.dataset.modo === modo)));
  const sec = seccionDe(ruta);
  document.querySelectorAll('[data-sec]').forEach(a => {
    if (a.dataset.sec === sec) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  pestanas(fuera || celular ? null : ruta, fuera || celular ? null : sec);
  document.getElementById('badge-banco').textContent = contadores().pendientes;
  document.getElementById('badge-hojas').textContent = hojasPendientes() || '';
  if (fuera) return login(vista, render);
  RUTAS[ruta](vista, render);
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); vista.focus({ preventScroll: true }); });
window.addEventListener('online', () => { sincronizar(); render(); });
window.addEventListener('offline', render);

document.getElementById('salir').addEventListener('click', () => {
  cerrarSesion();
  location.hash = '#/';
  render();
});

document.getElementById('recorrido').addEventListener('click', recorrido);

document.getElementById('reiniciar').addEventListener('click', () => {
  reiniciar();
  location.hash = '#/';
  render();
});

// La copia del deck no registra service worker.

// Mientras llegan las respuestas simuladas del grupo, las vistas del tallerista se actualizan solas.
setInterval(() => {
  const r = rutaActual();
  if (!['', 'aplicar', 'simulacros', 'grupo', 'estudiante', 'andrea'].includes(r) || document.querySelector('.modal-fondo')) return;
  if (r === 'estudiante' && document.querySelector('#codigo, #c-nombre')) return;  // no borrar lo que el estudiante está escribiendo
  if (r === 'simulacros' && document.querySelector('.sel-preguntas')) return;
  if (estado.simulacro.publicado && llegadasSimuladas() < LLEGADAS) render();
}, 900);

await cargar();
sincronizar();
render();

// Control para el deck (solo en esta copia): las láminas leen y cambian el estado y vuelven a pintar.
window.__app = {
  estado: () => estado,
  guardar: () => localStorage.setItem('impulsou-deck-v1', JSON.stringify(estado)),
  render,
  recargar: async () => { await cargar(); render(); }
};
window.parent?.postMessage?.({ app: 'lista' }, '*');
