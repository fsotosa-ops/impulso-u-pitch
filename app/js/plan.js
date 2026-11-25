// Los dos agentes de la solución (demo/prompt-solucion-impulsou.md):
// el de diagnóstico lee el simulacro y ubica las debilidades por conocimiento y competencia;
// el de plan ordena el curso según las clases disponibles y los estudiantes, y cada simulacro lo ajusta.
import { ic, esc, GRUPO } from './ui.js';

const DEBILIDADES = [
  { que: 'Porcentajes y proporciones', area: 'Matemáticas', tipo: 'Conocimiento', comp: 'Formulación y ejecución', falla: 60 },
  { que: 'Inferir la intención del autor', area: 'Lectura crítica', tipo: 'Competencia', comp: 'Reflexiona y evalúa', falla: 54 },
  { que: 'Leer gráficas y tablas', area: 'Ciencias naturales', tipo: 'Competencia', comp: 'Indagación', falla: 48 },
  { que: 'Argumentar con evidencia', area: 'Sociales y ciudadanas', tipo: 'Competencia', comp: 'Pensamiento reflexivo', falla: 41 }
];

export function diagnostico(el) {
  el.innerHTML = `
  <div class="titulo">
    <div><h1>Diagnóstico del grupo</h1><p class="sub">Simulacro diagnóstico · ${GRUPO.inscritos - 3} en el celular y 3 hojas en papel · grupo ${GRUPO.nombre}</p></div>
  </div>
  <div class="card dg-agente"><span class="etiqueta e-ia">${ic('chispa', 12)} Agente de diagnóstico</span>
    <p>Compara cada respuesta con lo que evalúan el <b>Saber 11</b> y la <b>admisión a la universidad</b>, y separa lo que falta saber (conocimientos) de lo que falta saber hacer (competencias).</p></div>
  <div class="card mt">
    <h2>Debilidades del grupo, de mayor a menor</h2>
    <table class="dg-tabla">
      <thead><tr><th>Debilidad</th><th>Área</th><th>Tipo</th><th>Competencia que evalúa el examen</th><th>Del grupo falla</th></tr></thead>
      <tbody>${DEBILIDADES.map((d, k) => `
        <tr class="${k === 0 ? 'top' : ''}"><td><b>${esc(d.que)}</b></td><td>${esc(d.area)}</td>
        <td><span class="etiqueta ${d.tipo === 'Conocimiento' ? 'e-pend' : 'e-gris'}">${d.tipo}</span></td><td>${esc(d.comp)}</td>
        <td><div class="dg-barra"><div style="width:${d.falla}%"></div></div><b>${d.falla} %</b></td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// El plan del ciclo: clases 1 a 5 hechas, la 6 es este sábado.
const BASE = [
  [6, 'Matemáticas: porcentajes', 'Porcentajes y proporciones', 'sabado'],
  [7, 'Ciencias: leer gráficas y tablas', 'Leer gráficas y tablas', ''],
  [8, 'Lectura crítica: inferencias II', 'Inferir la intención del autor', ''],
  [9, 'Sociales: argumentar con evidencia', 'Argumentar con evidencia', '']
];
const AJUSTADO = [
  [6, 'Matemáticas: porcentajes', 'Simulacro de la clase: 58 % de aciertos', 'hecha'],
  [7, 'Matemáticas: porcentajes II, refuerzo', 'Sigue bajo la meta de 70 %', 'nueva'],
  [8, 'Ciencias: leer gráficas y tablas', 'Pasa una clase más adelante', 'movida'],
  [9, 'Lectura crítica: inferencias II', 'Pasa una clase más adelante', 'movida']
];
let ajustado = false;
export const reiniciarPlan = () => { ajustado = false; };

export function roadmap(el, render) {
  const filas = ajustado ? AJUSTADO : BASE;
  el.innerHTML = `
  <div class="titulo">
    <div><h1>Roadmap del curso</h1><p class="sub">Lo arma el agente de plan con el diagnóstico; cada simulacro lo ajusta</p></div>
  </div>
  <div class="grilla g3 rm-entradas">
    <div class="card"><div class="lbl">Clases disponibles</div><div class="cifra azul">16</div><p class="desc">sábados de febrero a junio</p></div>
    <div class="card"><div class="lbl">Estudiantes</div><div class="cifra azul">${GRUPO.inscritos}</div><p class="desc">un grupo, en parejas por nivel</p></div>
    <div class="card"><div class="lbl">Debilidades prioritarias</div><div class="cifra azul">4</div><p class="desc">del diagnóstico</p></div>
  </div>
  ${ajustado ? `<div class="card ambar mt rm-aviso"><b>${ic('chispa', 14)} Plan ajustado con el simulacro de la clase 6.</b> Porcentajes subió de 40 % a 58 %, pero sigue bajo la meta: la clase 7 lo refuerza y lo demás se corre una clase.</div>` : ''}
  <div class="card mt">
    <div class="fila-sep"><h2>Clases</h2><span class="desc">1 a 5 hechas · ${ajustado ? '7' : '6'} es la próxima</span></div>
    <ul class="rm-lista">${filas.map(([n, t, d, e]) => `
      <li class="${e}"><span class="n">${n}</span><div><b>${esc(t)}</b><span class="desc">${esc(d)}</span></div>
      ${e === 'sabado' ? '<a class="btn chico" href="#/clase">Ver la didáctica</a>' : e === 'nueva' ? '<span class="etiqueta e-ia">Nueva</span>' : e === 'hecha' ? `<span class="etiqueta e-ok">${ic('ok', 12)} Hecha</span>` : ''}</li>`).join('')}
      <li class="mas"><span class="n">…</span><div><span class="desc">Clases 10 a 16, hasta el examen</span></div></li>
    </ul>
    ${ajustado ? '' : `<div class="acciones"><button class="btn primario" data-acc="ajustar">${ic('sync', 16)} Ajustar con el simulacro de la clase 6</button></div>`}
  </div>`;
  el.querySelector('[data-acc="ajustar"]')?.addEventListener('click', () => { ajustado = true; render(); });
}
