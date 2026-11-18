import { estado } from './estado.js';
import { ic, esc, GRUPO, CICLO, toast } from './ui.js';
import { activosHoy, aciertosPorArea, AUTORIZACIONES } from './grupo.js';

// Lo que recibe el aliado que financia (la extensión universitaria): totales del grupo, sin nombres.
// Regla: solo se reportan grupos de 10 estudiantes o más, para que nadie sea reconocible.
export function reporte(el) {
  const aplicados = CICLO.filter(s => s.respondieron).length + (estado.simulacro.publicado ? 1 : 0);
  const areas = aciertosPorArea().sort((a, b) => a.pct - b.pct);
  const pctActivos = Math.round(100 * activosHoy() / GRUPO.inscritos);
  el.innerHTML = `
  <div class="titulo">
    <div><h1>Reporte al aliado</h1><p class="sub">Lo que recibe la extensión universitaria que financia el ciclo · semana ${GRUPO.semana} de ${GRUPO.semanas}</p></div>
    <button class="btn primario" data-acc="enviar">${ic('descarga', 16)} Enviar reporte</button>
  </div>

  <div class="grilla g3">
    <div class="card"><div class="lbl">Estudiantes atendidos</div><div class="cifra azul" style="margin-top:4px">${GRUPO.inscritos}</div><p class="desc">${AUTORIZACIONES.ok} con autorización vigente</p></div>
    <div class="card"><div class="lbl">Siguen activos</div><div class="cifra azul" style="margin-top:4px">${pctActivos} %</div><p class="desc">meta del ciclo: 40 % hasta el examen</p></div>
    <div class="card"><div class="lbl">Simulacros aplicados</div><div class="cifra azul" style="margin-top:4px">${aplicados} <small>de 8</small></div><p class="desc">sin fotocopias; 0 respuestas perdidas</p></div>
  </div>

  <div class="grilla g2 mt">
    <div class="card">
      <h2>Aciertos del grupo por área</h2>
      <div class="barras">${areas.map(a => `
        <div class="r"><span>${esc(a.nombre)}</span><div class="pista"><div style="width:${a.pct}%"></div></div><span class="v">${a.pct} %</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2>${ic('candado', 18)} Qué no incluye</h2>
      <ul class="excluye">
        <li>${ic('x', 14)} Nombres, documentos ni datos de contacto</li>
        <li>${ic('x', 14)} Respuestas o puntajes de un estudiante</li>
        <li>${ic('x', 14)} Grupos de menos de 10 estudiantes</li>
      </ul>
      <p class="desc mt">El colectivo es el responsable de los datos; Impulso U los procesa por encargo. Las respuestas por estudiante se borran 6 meses después del examen y este reporte queda.</p>
    </div>
  </div>`;
  el.querySelector('[data-acc="enviar"]').addEventListener('click', () => toast('Reporte enviado al aliado'));
}
