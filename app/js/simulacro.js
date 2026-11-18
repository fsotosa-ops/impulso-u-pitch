import { banco, estado, guardar, pregunta, enLinea, sincronizar, textoDe } from './estado.js';
import { ic, esc, LETRAS, toast, GRUPO } from './ui.js';
import { respondieronHoy } from './hoy.js';

// Lo que baja el celular: las preguntas y los textos del simulacro, nada más.
export function pesoSimulacro(ids) {
  const qs = ids.map(pregunta);
  const textos = Object.fromEntries(qs.filter(q => q.texto).map(q => [q.texto, banco.textos[q.texto]]));
  const bytes = new Blob([JSON.stringify({ preguntas: qs, textos })]).size;
  return (bytes / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 });
}

// Peso de toda la página ya cargada (HTML, CSS, JS y banco), según el navegador.
export function medirPaquete() {
  const recursos = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
  const bytes = recursos.reduce((s, r) => s + (r.decodedBodySize || 0), 0);
  return Math.max(1, Math.round(bytes / 1024));
}

function resultado(respuestas, ids) {
  const porArea = {};
  for (const id of ids) {
    const q = pregunta(id);
    const a = porArea[q.area] || (porArea[q.area] = { ok: 0, n: 0 });
    a.n++;
    if (respuestas[id] === q.clave) a.ok++;
  }
  return porArea;
}

let error = '';
let verDatos = false;
const ANIO = 2027;
// Estados de sincronización, como en las apps offline-first: sin señal (con cola), enviando, enviado.
let sincronizando = false;
let avisoOk = 0;
let ultimaSync = null;

const hhmm = d => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

function estadoSync() {
  if (sincronizando) return `<span class="sync enviando"><span class="giro"></span> Enviando…</span>`;
  if (!enLinea()) return `<span class="sync off">${ic('avion', 12)} Sin señal${estado.cola.length ? ` · ${estado.cola.length} por enviar` : ''}</span>`;
  if (estado.cola.length) return `<span class="sync off">${estado.cola.length} por enviar</span>`;
  return `<span class="sync on">${ic('ok', 12)} Al día</span>`;
}

function avisos() {
  if (!enLinea()) return `<div class="aviso-red off" role="status">${ic('avion', 14)}<span><b>Sin conexión.</b> Puedes seguir respondiendo: todo se guarda en este celular.</span></div>`;
  if (sincronizando) return `<div class="aviso-red enviando" role="status"><span class="giro"></span><span>Volvió la señal. Enviando lo que respondiste…</span></div>`;
  if (Date.now() - avisoOk < 3500) return `<div class="aviso-red ok" role="status">${ic('ok', 14)}<span><b>Enviado.</b> 0 respuestas perdidas.</span></div>`;
  return '';
}

// Lo que el estudiante ve de sus datos: qué se guarda, quién lo ve, quién responde, cuánto tiempo y sus derechos.
function hojaDatos() {
  return `
    <h2>Tus datos</h2>
    <dl class="datos-l">
      <dt>Qué guardamos</dt><dd>Tu nombre, tu apellido, tu año de nacimiento y tus respuestas a cada simulacro. Nada más: ni documento, ni foto, ni ubicación.</dd>
      <dt>Quién te ve con nombre</dt><dd>Tu tallerista y el comité de tu colectivo, para acompañarte. Quien financia solo recibe totales de grupos de 10 o más.</dd>
      <dt>Quién responde</dt><dd>Tu colectivo es el responsable de tus datos; Impulso U los procesa por encargo suyo.</dd>
      <dt>La IA</dt><dd>Nunca ve tu nombre ni tus respuestas: trabaja con las preguntas del banco y con totales del grupo.</dd>
      <dt>Cuánto tiempo</dt><dd>Tus respuestas se borran 6 meses después del examen. Quedan solo totales sin nombre.</dd>
      <dt>Tus derechos</dt><dd>Puedes conocer, corregir o pedir que borren tus datos cuando quieras.</dd>
    </dl>
    <div class="cel-pie"><button class="btn" data-c="borrar">Pedir borrado</button><button class="btn primario" data-c="cerrar-datos">Entendido</button></div>`;
}

// Al volver la señal: un momento «enviando» y después la confirmación.
function reconectar(render) {
  if (!estado.cola.length) return render();
  sincronizando = true;
  render();
  setTimeout(() => {
    const n = sincronizar();
    sincronizando = false;
    if (n) { avisoOk = Date.now(); ultimaSync = Date.now(); }
    render();
    setTimeout(() => { if (location.hash.startsWith('#/estudiante')) render(); }, 3600);
  }, 1300);
}

function pantallaCel() {
  const sim = estado.simulacro;
  const it = estado.intento;
  const red = enLinea();
  const cuenta = estado.cuenta;
  const hola = cuenta ? `<p class="hola">Hola, <b>${esc(cuenta.nombre)}</b> · <a href="#" data-c="datos">Tus datos</a></p>` : '';
  const top = `<div class="cel-top"><span class="marca"><img class="logo" src="img/logo-isotipo.svg" alt="">Impulso <b>U</b></span>${estadoSync()}</div>${hola}${avisos()}`;

  if (verDatos) return `${top}${hojaDatos()}`;

  if (!it || it.simulacro !== sim.numero) {
    const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('c') || '';
    return `${top}
      <h2>Entra con el código de tu grupo</h2>
      <p class="desc" style="margin-top:6px">Te lo dio tu tallerista. La primera vez creas tu cuenta.</p>
      <input class="campo-codigo" id="codigo" value="${esc(pre)}" placeholder="SAB-0000" autocomplete="off" aria-label="Código de grupo">
      <p class="guardado" style="color:var(--mal)" role="alert">${esc(error)}</p>
      <div class="cel-pie"><button class="btn primario" data-c="entrar">Entrar</button></div>`;
  }

  if (!cuenta) {
    return `${top}
      <h2>Crea tu cuenta</h2>
      <p class="desc" style="margin-top:6px">Tu tallerista usa tu nombre para acompañarte durante el ciclo. Fuera de tu colectivo nadie lo ve.</p>
      <div class="form-cel">
        <label class="campo-l">Nombre<input id="c-nombre" autocomplete="given-name" placeholder="Tu nombre"></label>
        <label class="campo-l">Primer apellido<input id="c-apellido" autocomplete="family-name" placeholder="Tu apellido"></label>
        <label class="campo-l">Año de nacimiento<input id="c-anio" inputmode="numeric" maxlength="4" placeholder="2010"></label>
        <label class="check-l"><input type="checkbox" id="c-acepto"> Leí <a href="#" data-c="datos">cómo se usan mis datos</a></label>
      </div>
      <p class="guardado" style="color:var(--mal)" role="alert">${esc(error)}</p>
      <div class="cel-pie"><button class="btn primario" data-c="cuenta">Crear cuenta</button></div>`;
  }

  if (cuenta.autorizacion === 'pendiente') {
    return `${top}
      <span class="etiqueta e-pend" style="align-self:flex-start">${ic('candado', 12)} Esperando autorización</span>
      <h2 style="margin-top:12px">Falta el permiso de tu familia</h2>
      <p style="font-size:14px;margin-top:6px">Como eres menor de edad, tu mamá, tu papá o quien te cuida firma el formato de autorización del colectivo. Cuando tu tallerista lo registre, podrás empezar.</p>
      <div class="card suave mt" style="padding:12px"><p style="font-size:14px">Mientras tanto no guardamos ninguna respuesta tuya.</p></div>`;
  }

  const qs = sim.ids;
  if (it.i < 0) {
    return `${top}
      <span class="etiqueta e-ok" style="align-self:flex-start">${ic('ok', 12)} Descargado en tu celular</span>
      <h2 style="margin-top:12px">Simulacro ${sim.numero}</h2>
      <p class="desc" style="margin-top:6px">${qs.length} preguntas · ${pesoSimulacro(qs)} KB</p>
      <div class="card suave mt" style="padding:12px">
        <p style="font-size:14px">Ya puedes responder aunque se vaya la señal. Tus respuestas se guardan en el celular y se envían solas cuando vuelvas a tener conexión.</p>
      </div>
      ${it.vuelta > 1 ? `<p class="desc mt">Esta es tu vuelta ${it.vuelta} a este simulacro.</p>` : ''}
      <div class="cel-pie"><button class="btn primario" data-c="empezar">Empezar</button></div>`;
  }

  if (it.fin) {
    const res = resultado(it.respuestas, qs);
    const ok = Object.values(res).reduce((s, a) => s + a.ok, 0);
    const pendiente = estado.cola.length > 0;
    return `${top}
      <h2>Terminaste el simulacro ${sim.numero}</h2>
      <p style="font-size:15px;margin-top:6px"><b style="font-size:26px;color:var(--azul)">${ok}</b> de ${qs.length} correctas</p>
      <div class="res-area">${Object.entries(res).map(([a, r]) => `
        <div class="r"><span>${esc(banco.areas[a])}</span><b>${r.ok} de ${r.n}</b><div class="progreso"><div style="width:${100 * r.ok / r.n}%"></div></div></div>`).join('')}
      </div>
      ${(() => {
        const mal = qs.map(pregunta).filter(q => it.respuestas[q.id] !== q.clave && q.explicacion).slice(0, 3);
        return mal.length ? `<span class="lbl">Repasa lo que fallaste</span><ul class="repaso">${mal.map(q => `<li><b>${esc(q.enunciado.length > 70 ? q.enunciado.slice(0, 68) + '…' : q.enunciado)}</b>Respuesta: ${LETRAS[q.clave]}. ${esc(q.explicacion)}</li>`).join('')}</ul>` : '';
      })()}
      <div class="card ${pendiente ? 'ambar' : 'suave'}" style="padding:12px">
        <p style="font-size:14px">${pendiente ? `${ic('avion', 14)} Guardado en tu celular. Se enviará solo cuando vuelva la señal.` : `${ic('ok', 14)} Enviado${ultimaSync ? ` a las ${hhmm(ultimaSync)}` : ''}. Tu tallerista ve tu avance para acompañarte; quien financia solo ve totales del grupo.`}</p>
      </div>
      <div class="cel-pie"><button class="btn" data-c="repetir">Repetir</button></div>`;
  }

  const q = pregunta(qs[it.i]);
  const elegida = it.respuestas[q.id];
  return `${top}
    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gris)"><span>${esc(banco.areas[q.area])}</span><span>${it.i + 1} de ${qs.length}</span></div>
    <div class="progreso"><div style="width:${100 * (it.i + 1) / qs.length}%"></div></div>
    ${textoDe(q) ? `<div class="texto-base" style="margin:0 0 10px">${esc(textoDe(q))}</div>` : ''}
    <p style="font-size:15px;font-weight:500">${esc(q.enunciado)}</p>
    ${q.pista ? `<p class="desc" style="font-size:13px;margin-top:4px">Pista: ${esc(q.pista)}</p>` : ''}
    <ul class="resp">${q.opciones.map((o, k) => `
      <li><button data-r="${k}" aria-pressed="${elegida === k}"><span class="letra">${LETRAS[k]}</span><span>${esc(o)}</span></button></li>`).join('')}
    </ul>
    <p class="guardado">${elegida !== undefined ? ic('ok', 12) + ' Guardada en el celular' : ''}</p>
    <div class="cel-pie">
      <button class="btn" data-c="atras" ${it.i === 0 ? 'disabled' : ''}>Anterior</button>
      <button class="btn primario" data-c="sig" ${elegida === undefined ? 'disabled' : ''}>${it.i === qs.length - 1 ? 'Entregar' : 'Siguiente'}</button>
    </div>`;
}

export function estudiante(el, render) {
  const red = enLinea();
  const ult = estado.servidor.filter(x => x.origen !== 'papel').at(-1);
  const recien = ult && Date.now() - new Date(ult.recibido).getTime() < 6000;
  const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

  el.innerHTML = `
  <div class="escena">
    <div class="celular"><div class="pantalla">
      <div class="barra-estado"><span>${hora}</span><button data-c="avion" aria-label="${estado.avion ? 'Quitar' : 'Activar'} modo avión">${red ? ic('wifi', 15) : `<span class="avion-on">${ic('avion', 15)}</span>`}</button></div>
      <div class="app-cel" id="app-cel">${pantallaCel()}</div>
    </div></div>

    <aside class="controles" aria-label="Controles de la demo">
      <div class="titulo-ctrl">Controles de la demo</div>
      <div class="card">
        <div class="interruptor">
          <div><h3>${ic('avion', 16)} Modo avión</h3><p class="desc" style="font-size:13px">Corta la señal del celular</p></div>
          <button class="switch" role="switch" aria-checked="${estado.avion}" aria-label="Modo avión" data-c="avion"></button>
        </div>
      </div>
      ${estado.cuenta?.autorizacion === 'pendiente' ? `<div class="card"><div class="interruptor"><div><h3>${ic('hoja', 16)} Formato firmado por la familia</h3><p class="desc" style="font-size:13px">La tallerista registra la autorización</p></div><button class="btn primario chico" data-c="autorizar">Registrar</button></div></div>` : ''}
      <div class="titulo-ctrl" style="margin-top:6px">Lo que ve la tallerista</div>
      <div class="card oscura espejo ${recien ? 'recien' : ''}">
        <div class="lbl">Simulacro ${estado.simulacro.numero} · ${GRUPO.nombre}</div>
        ${estado.simulacro.publicado ? `<div class="cifra" style="margin-top:4px">${respondieronHoy()} <small>de ${GRUPO.inscritos} respondieron</small></div>
        <div class="progreso" style="margin-top:10px"><div style="width:${100 * respondieronHoy() / GRUPO.inscritos}%"></div></div>
        ${recien ? `<p class="llego">${ic('ok', 13)} Llegó el tuyo: respondido sin señal, recibido al reconectar</p>` : ''}` : '<p class="desc" style="margin-top:6px">Aún no publicado</p>'}
      </div>
      <div class="card">
        <div class="contador"><span>Guardados en el celular</span><b style="color:${estado.cola.length ? 'var(--ambar-t)' : 'inherit'}">${estado.cola.length}</b></div>
        <div class="contador"><span>Respuestas perdidas</span><b>0</b></div>
        <div class="contador"><span>Peso del simulacro</span><b>${pesoSimulacro(estado.simulacro.ids)} KB</b></div>
        <div class="contador"><span>Llamadas a la IA</span><b>0</b></div>
      </div>
      ${!navigator.onLine ? `<p class="etiqueta e-pend">${ic('avion', 12)} El navegador está sin red: la app abrió desde el celular</p>` : ''}
      <p class="desc" style="font-size:13px">${estado.simulacro.publicado ? `Código vigente: <b>${estado.simulacro.codigo}</b>` : 'El simulacro de hoy aún no está publicado: <a href="#/simulacros?editar">publicarlo</a>'}</p>
    </aside>
  </div>`;

  const cel = el.querySelector('#app-cel');
  const it = estado.intento;

  cel.querySelector('[data-c="entrar"]')?.addEventListener('click', () => {
    const v = cel.querySelector('#codigo').value.trim().toUpperCase();
    if (!estado.simulacro.publicado || v !== estado.simulacro.codigo) {
      error = !estado.simulacro.publicado ? 'Todavía no hay un simulacro abierto. Tu tallerista te dará el código.' : v ? 'Ese código no corresponde a un simulacro abierto. Revisa el mensaje de tu tallerista.' : 'Escribe el código que te dio tu tallerista.';
      return render();
    }
    error = '';
    estado.intento = { simulacro: estado.simulacro.numero, i: -1, respuestas: {}, vuelta: 1 };
    guardar();
    render();
  });
  cel.querySelector('#codigo')?.addEventListener('keydown', e => { if (e.key === 'Enter') cel.querySelector('[data-c="entrar"]').click(); });
  cel.querySelector('[data-c="empezar"]')?.addEventListener('click', () => { it.i = 0; guardar(); render(); });
  cel.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => {
    it.respuestas[estado.simulacro.ids[it.i]] = Number(b.dataset.r);
    guardar();
    render();
  }));
  cel.querySelector('[data-c="atras"]')?.addEventListener('click', () => { it.i--; guardar(); render(); });
  cel.querySelector('[data-c="sig"]')?.addEventListener('click', () => {
    if (it.i < estado.simulacro.ids.length - 1) { it.i++; guardar(); return render(); }
    it.fin = true;
    estado.cola.push({ estudiante: estado.cuenta ? `${estado.cuenta.nombre} ${estado.cuenta.apellido[0]}.` : null, simulacro: it.simulacro, respuestas: { ...it.respuestas }, dispositivo: estado.dispositivo, origen: 'celular', terminado: new Date().toISOString() });
    guardar();
    if (enLinea()) { sincronizar(); ultimaSync = Date.now(); toast('Enviado a tu tallerista'); }
    render();
  });
  cel.querySelector('[data-c="repetir"]')?.addEventListener('click', () => {
    estado.intento = { simulacro: estado.simulacro.numero, i: -1, respuestas: {}, vuelta: (it.vuelta || 1) + 1 };
    guardar();
    render();
  });
  cel.querySelector('[data-c="cuenta"]')?.addEventListener('click', () => {
    const v = id => cel.querySelector(id).value.trim();
    const nombre = v('#c-nombre'), apellido = v('#c-apellido'), anio = Number(v('#c-anio'));
    const menor = ANIO - anio < 18;
    error = !nombre || !apellido ? 'Escribe tu nombre y tu apellido.' : !(anio > 1950 && anio < ANIO) ? 'Escribe tu año de nacimiento.'
      : !cel.querySelector('#c-acepto').checked ? 'Lee cómo se usan tus datos y marca la casilla.' : '';
    if (error) return render();
    estado.cuenta = { nombre, apellido, nacimiento: anio, autorizacion: menor ? 'pendiente' : 'ok', creada: new Date().toISOString() };
    guardar();
    render();
  });
  el.querySelectorAll('[data-c="autorizar"]').forEach(b => b.addEventListener('click', () => {
    estado.cuenta.autorizacion = 'ok';
    estado.cuenta.autorizada = new Date().toISOString();
    guardar();
    toast('Autorización registrada. Ya puedes empezar');
    render();
  }));
  cel.querySelectorAll('[data-c="datos"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); verDatos = true; render(); }));
  cel.querySelector('[data-c="cerrar-datos"]')?.addEventListener('click', () => { verDatos = false; render(); });
  cel.querySelector('[data-c="borrar"]')?.addEventListener('click', () => { toast('Solicitud enviada a tu colectivo'); verDatos = false; render(); });
  el.querySelectorAll('[data-c="avion"]').forEach(b => b.addEventListener('click', () => {
    estado.avion = !estado.avion;
    guardar();
    if (enLinea()) reconectar(render); else render();
  }));
}
