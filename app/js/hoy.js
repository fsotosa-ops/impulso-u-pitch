import { estado, contadores } from './estado.js';
import { ic, GRUPO, CICLO } from './ui.js';
import { compartir } from './simulacros.js';
import { hojasPendientes } from './hojas.js';
import { areaMasBaja, activosHoy } from './grupo.js';

// Después de publicar, el resto del grupo va respondiendo: uno cada 0,9 s hasta 31, como una mañana de sábado comprimida.
export const LLEGADAS = 31;

export function llegadasSimuladas() {
  const p = estado.simulacro.publicado;
  return p ? Math.min(LLEGADAS, Math.floor((Date.now() - p) / 900)) : 0;
}

export function respondieronDe(n) {
  const sim = n === estado.simulacro.numero ? llegadasSimuladas() : 0;
  return sim + estado.servidor.filter(s => s.simulacro === n).length;
}

export const respondieronHoy = () => respondieronDe(estado.simulacro.numero);

// La tarjeta del sábado: publicar o, si ya está publicado, cuántos respondieron. Se usa en «Hoy» y en «Aplicar».
function tarjetaSabado() {
  const sim = estado.simulacro;
  const n = respondieronHoy();
  return sim.publicado ? `
  <div class="card oscura en-curso">
    <div>
      <div class="lbl">Simulacro ${sim.numero} en curso · código ${sim.codigo}</div>
      <div class="cifra" style="margin-top:6px">${n} <small>de ${GRUPO.inscritos} respondieron</small></div>
      <div class="progreso" style="margin-top:12px;max-width:520px"><div style="width:${100 * n / GRUPO.inscritos}%"></div></div>
      <p class="desc" style="margin-top:8px">Las respuestas sin señal llegan solas cuando el celular se reconecta.</p>
    </div>
    <div class="acciones" style="margin:0">
      <button class="btn primario" data-acc="compartir">${ic('compartir', 16)} Compartir código</button>
      <a class="btn clara" href="#/estudiante?c=${sim.codigo}">${ic('cel', 16)} Ver como estudiante</a>
    </div>
  </div>` : `
  <div class="card oscura en-curso">
    <div>
      <div class="lbl">Simulacro ${sim.numero} · hoy</div>
      <div class="cifra" style="margin-top:6px">${sim.ids.length} <small>preguntas aprobadas, listo para publicar</small></div>
      <p class="desc" style="margin-top:8px">Se comparte con un código y se responde desde el celular, aun sin señal.</p>
    </div>
    <div class="acciones" style="margin:0">
      <a class="btn primario" href="#/simulacros?editar">${ic('hoja', 16)} Revisar y publicar</a>
    </div>
  </div>`;
}

// «Hoy» muestra una sola acción, la que toca ahora, y debajo la semana en tres momentos.
export function hoy(el, render) {
  const c = contadores();
  const sim = estado.simulacro;
  const porContactar = GRUPO.inscritos - activosHoy();
  el.innerHTML = `
  <div class="titulo"><div><h1>${GRUPO.hoy}</h1><p class="sub">Grupo ${GRUPO.nombre} · semana ${GRUPO.semana} de ${GRUPO.semanas} del ciclo</p></div></div>
  <div class="lbl-sigue">Lo que toca ahora</div>
  ${tarjetaSabado()}
  <div class="semana mt">
    <a class="momento hecho" href="#/banco"><span class="m-n">1</span><div><b>Preparar</b><span>${sim.ids.length} preguntas del comité en el simulacro ${sim.numero}${c.pendientes ? ` · ${c.pendientes} por revisar` : ''}</span></div></a>
    <a class="momento ahora" href="#/aplicar"><span class="m-n">2</span><div><b>Aplicar · hoy</b><span>${sim.publicado ? `${respondieronHoy()} de ${GRUPO.inscritos} respondieron` : 'por publicar'}</span></div></a>
    <a class="momento" href="#/grupo"><span class="m-n">3</span><div><b>Acompañar · lunes</b><span>${porContactar} estudiantes por contactar</span></div></a>
  </div>`;
  el.querySelector('[data-acc="compartir"]')?.addEventListener('click', () => compartir(render));
}

// «Aplicar»: el simulacro del sábado y, solo si alguien respondió en papel, sus hojas.
export function aplicar(el, render) {
  const hp = hojasPendientes();
  el.innerHTML = `
  <div class="titulo"><div><h1>El simulacro de hoy</h1><p class="sub">${GRUPO.hoy} · grupo ${GRUPO.nombre}</p></div></div>
  ${tarjetaSabado()}
  ${hp ? `<a class="card mt papel-aviso" href="#/hojas"><span class="ico">${ic('camara')}</span><div><b>${hp} ${hp === 1 ? 'hoja' : 'hojas'} en papel por registrar</b><span class="desc">De quienes no tienen celular: una foto por hoja y cuentan en el seguimiento.</span></div></a>` : ''}`;
  el.querySelector('[data-acc="compartir"]')?.addEventListener('click', () => compartir(render));
}
