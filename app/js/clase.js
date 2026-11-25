// La clase del sábado: un agente la propone a partir de lo que el grupo falló; la tallerista la usa o la ajusta.
// Es la misma clase que muestra la lámina «solución» del deck (clase 6, porcentajes).
import { ic, esc, GRUPO, toast } from './ui.js';
import { areaMasBaja } from './grupo.js';

const CLASE = {
  n: 6,
  tema: 'Porcentajes',
  diagnostico: 'el grupo falla 3 de 5 preguntas de porcentajes',
  objetivo: 'Calcular descuentos y aumentos porcentuales en situaciones del barrio.',
  actividades: [
    ['Problema guía: el pasaje con descuento de estudiante', 20],
    ['Parejas por nivel: 4 preguntas del Icfes', 25],
    ['Cada pareja explica una respuesta', 15]
  ],
  manejo: 'Junta a quien va adelante con quien va atrás; rota cada 10 minutos.'
};

const ROADMAP = [
  [5, 'Lectura crítica: idea principal', 'hecha'],
  [6, 'Matemáticas: porcentajes', 'sábado'],
  [7, 'Ciencias: leer gráficas y tablas', 'plan'],
  [8, 'Lectura crítica: inferencias II', 'plan']
];

let usada = false;

export function clase(el, render) {
  const bajo = areaMasBaja();
  el.innerHTML = `
  <div class="titulo">
    <div><h1>La clase del sábado</h1><p class="sub">Clase ${CLASE.n} de 16 · grupo ${GRUPO.nombre} · la propone el agente de plan; tú la usas o la ajustas</p></div>
  </div>

  <div class="grilla g21">
    <div class="card cl-clase">
      <div class="fila-sep"><span class="etiqueta e-ia">${ic('chispa', 12)} Clase ${CLASE.n} · sábado</span><span class="desc">60 minutos</span></div>
      <h2 class="cl-tema">${esc(bajo.nombre)}: ${esc(CLASE.tema.toLowerCase())}</h2>
      <div class="card ambar cl-motivo"><span class="lbl">Por qué esta clase</span><p>Diagnóstico: ${esc(CLASE.diagnostico)}. ${esc(bajo.nombre)} es el área más baja del grupo (${bajo.pct} %).</p></div>
      <div class="cl-bloque cl-obj"><span class="lbl">Objetivo</span><p>${esc(CLASE.objetivo)}</p></div>
      <div class="cl-bloque cl-act"><span class="lbl">Actividades</span>
        <ol>${CLASE.actividades.map(([t, m]) => `<li><span>${esc(t)}</span><em>${m} min</em></li>`).join('')}</ol>
      </div>
      <div class="cl-bloque cl-man"><span class="lbl">Manejo del grupo</span><p>${esc(CLASE.manejo)}</p></div>
      <p class="desc cl-fuente">${ic('libro', 13)} Se apoya en simulacros liberados del Icfes, la descripción de las competencias del examen y material de didáctica y manejo de grupos.</p>
      <div class="acciones">
        <button class="btn primario" data-acc="usar">${usada ? `${ic('ok', 16)} Lista para el sábado` : 'Usar esta clase'}</button>
        <button class="btn" data-acc="practica">${ic('chispa', 16)} Pedir un ajuste</button>
      </div>
    </div>
    <div class="card suave cl-roadmap" style="align-self:start">
      <h2>Roadmap del ciclo</h2>
      <p class="desc">Cada simulacro ajusta las clases que vienen</p>
      <ul class="cl-ruta">${ROADMAP.map(([n, t, e]) => `
        <li class="${e === 'sábado' ? 'ahora' : e === 'hecha' ? 'hecha' : ''}"><span class="n">${n}</span><div><b>${esc(t)}</b><span class="desc">${e === 'hecha' ? 'Hecha' : e === 'sábado' ? 'Este sábado' : 'Planeada'}</span></div></li>`).join('')}
      </ul>
      <p class="desc" style="font-size:13px;margin-top:10px">El roadmap y las clases quedan en el colectivo aunque cambie la tallerista.</p>
    </div>
  </div>`;

  el.querySelector('[data-acc="usar"]').addEventListener('click', () => { usada = true; render(); });
  el.querySelector('[data-acc="practica"]').addEventListener('click', () => toast('El agente rehace la clase con tu pedido'));
}
