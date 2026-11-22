// Escenas del deck: cada una prepara el estado de la app real y define qué pasa en cada clic.
// Los rótulos leen los números que muestra la app (contadores, porcentajes, estados de conexión).
const CUENTA = () => ({ nombre: 'Laura', apellido: 'Martínez', nacimiento: 2010, autorizacion: 'ok', creada: new Date().toISOString() });
const CODIGO = 'SAB-2741';

function fijar(app, fn) {
  const e = app.win.__app.estado();
  fn(e);
  app.win.__app.guardar();
  app.win.__app.render();
}
const recargar = app => app.win.__app.recargar();
const ir = async (app, hash, ms = 500) => { app.win.location.hash = hash; await new Promise(r => setTimeout(r, ms)); };
const publicar = (e, haceMs = 0) => { e.simulacro = { ...e.simulacro, codigo: CODIGO, publicado: Date.now() - haceMs }; };
const texto = el => el.textContent.trim();
const numero = el => (el.textContent.match(/\d[\d.,]*/) || [''])[0];

window.ESCENAS = {
  // Portada: la app tal como la usa la tallerista un sábado, y un estudiante respondiendo.
  portada: {
    async preparar({ tel }) {
      fijar(tel, e => { publicar(e, 14000); e.cuenta = CUENTA(); e.avion = true; e.intento = { simulacro: e.simulacro.numero, i: 3, respuestas: { 0: 1, 1: 2, 2: 1 }, vuelta: 1 }; });
      await ir(tel, `#/estudiante?c=${CODIGO}`);
    }
  },


  // La solución: el ciclo pasa de 1 simulacro a 8, y la tallerista entra a una pantalla de «Hoy».
  solucion: {
    async preparar({ lap }) { fijar(lap, e => { e.cuenta = CUENTA(); }); },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.a-hero', { dato: '8 simulacros', texto: 'en el ciclo de febrero a agosto. Hoy el colectivo hace 1, en papel.', lado: 'aba', ancho: 520 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.a-semana button:first-child', { dato: 'El comité decide', texto: 'la IA propone preguntas entre semana; ninguna llega a un estudiante sin aprobación', lado: 'aba', ancho: 420 })
    ]
  },

  // Entre semana: el banco es del colectivo; la IA propone y el comité decide.
  banco: {
    async preparar({ lap }) { fijar(lap, e => { e.cuenta = CUENTA(); }); await ir(lap, '#/banco'); },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.pestanas [data-p="colectivo"]', { dato: el => numero(el.querySelector('.n')), texto: 'preguntas escritas por el colectivo: el punto de partida', lado: 'aba', ancho: 380, dx: -120 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.card.suave.lote', { dato: '150', texto: 'propuestas por la IA a partir de las del colectivo. Ninguna llega a un estudiante sin aprobación.', lado: 'izq', ancho: 400, dy: 40 }),
      async ({ lap }, lam, H) => {
        await H.clic(lam, lap, '[data-acc="corregir"]');
        await H.clic(lam, lap, '.opciones.editable li[data-i="1"]', 350);
        await H.clic(lam, lap, '[data-acc="aprobar"]');
        await H.espera(300);
        H.rotulo(lam, lap, '.pestanas [data-p="aprobadas"]', { dato: el => numero(el.querySelector('.n')), texto: 'aprobadas. El comité corrigió una clave antes de aprobar.', lado: 'aba', ancho: 380, dx: 60 });
      }
    ]
  },

  // El sábado: publica, el grupo responde, se va la señal y no se pierde nada.
  sabado: {
    async preparar({ lap, tel }) {
      fijar(lap, e => { e.cuenta = CUENTA(); });
      await recargar(tel);
    },
    pasos: [
      async ({ lap }, lam, H) => {
        await ir(lap, '#/simulacros?editar', 600);
        await H.clic(lam, lap, '[data-acc="publicar"]');
        await H.espera(500);
        lap.doc.querySelector('.modal [data-cerrar]')?.click();
        fijar(lap, e => { e.simulacro.codigo = CODIGO; });
        await ir(lap, '#/', 500);
        H.rotulo(lam, lap, '.en-curso .cifra', { dato: el => `${numero(el)} de 50`, texto: 'respondieron. Un código para el grupo, cero fotocopias.', lado: 'aba', ancho: 420, vivo: 400 });
      },
      async ({ tel }, lam, H) => {
        await recargar(tel);
        await ir(tel, `#/estudiante?c=${CODIGO}`, 500);
        await H.clic(lam, tel, '[data-c="entrar"]', 350);
        await H.clic(lam, tel, '[data-c="empezar"]', 350);
        await H.clic(lam, tel, '[data-r="1"]', 300);
        H.rotulo(lam, tel, '.resp', { texto: 'Laura responde en su celular, con su cuenta.', lado: 'izq', ancho: 330 });
      },
      async ({ tel }, lam, H) => {
        H.quitarRotulos(lam);
        await H.clic(lam, tel, '.barra-estado [data-c="avion"]', 400);
        const n = tel.win.__app.estado().simulacro.ids.length;
        for (let q = 0; q < n; q++) {
          tel.doc.querySelector(`[data-r="${q % 4 === 1 ? 2 : 1}"]`)?.click();
          await H.espera(70);
          tel.doc.querySelector('[data-c="sig"]')?.click();
          await H.espera(90);
        }
        await H.espera(300);
        H.rotulo(lam, tel, '.sync', { dato: 'Sin señal', texto: 'Terminó igual: sus respuestas quedan guardadas en el celular.', lado: 'izq', ancho: 360 });
      },
      async ({ tel, lap }, lam, H) => {
        H.quitarRotulos(lam);
        await H.clic(lam, tel, '.barra-estado [data-c="avion"]', 400);
        await H.espera(1500);
        H.rotulo(lam, tel, '.aviso-red', { dato: '0', texto: 'respuestas perdidas al volver la señal', lado: 'izq', ancho: 340 });
        await recargar(lap);
        H.rotulo(lam, lap, '.en-curso .cifra', { dato: el => `${numero(el)} de 50`, texto: 'ya respondieron, incluida Laura', lado: 'aba', ancho: 380, vivo: 400 });
      }
    ]
  },

  // Primera vez: cuenta con nombre y permiso de la familia antes de guardar nada.
  cuenta: {
    async preparar({ tel }) {
      fijar(tel, e => { publicar(e, 60000); e.cuenta = null; });
      await ir(tel, `#/estudiante?c=${CODIGO}`, 500);
      tel.doc.querySelector('[data-c="entrar"]')?.click();
      await new Promise(r => setTimeout(r, 300));
    },
    pasos: [
      async ({ tel }, lam, H) => {
        await H.escribir(tel, '#c-nombre', 'Laura');
        await H.escribir(tel, '#c-apellido', 'Martínez');
        await H.escribir(tel, '#c-anio', '2010', 90);
        tel.doc.querySelector('#c-acepto').checked = true;
        H.rotulo(lam, tel, '.form-cel', { texto: 'Nombre, apellido y año de nacimiento. Ni documento, ni foto, ni ubicación.', lado: 'der', ancho: 380 });
      },
      async ({ tel }, lam, H) => {
        H.quitarRotulos(lam);
        await H.clic(lam, tel, '[data-c="cuenta"]', 400);
        await H.espera(300);
        H.rotulo(lam, tel, '.etiqueta.e-pend', { dato: 'Menor de edad', texto: 'Su mamá, su papá o quien la cuida firma el formato del colectivo. Hasta que la tallerista lo registra, no se guarda ninguna respuesta.', lado: 'der', ancho: 420 });
      },
      async ({ tel }, lam, H) => {
        H.quitarRotulos(lam);
        tel.doc.querySelector('[data-c="autorizar"]')?.click();
        await H.espera(500);
        H.rotulo(lam, tel, '.etiqueta.e-ok', { dato: 'Autorizado', texto: 'La tallerista registró el formato firmado: queda constancia de cuándo.', lado: 'der', ancho: 380 });
      },
      async ({ tel }, lam, H) => {
        H.quitarRotulos(lam);
        await H.clic(lam, tel, '[data-c="datos"]', 350);
        await H.espera(300);
        H.rotulo(lam, tel, '.datos-l', { texto: 'Laura ve qué se guarda, quién la ve con nombre, cuánto tiempo y cómo pedir el borrado.', lado: 'der', ancho: 400 });
      }
    ]
  },

  // El lunes: a quién llamar antes de que abandone; es la palanca de la métrica central.
  lunes: {
    async preparar({ lap }) {
      fijar(lap, e => {
        e.cuenta = CUENTA(); publicar(e, 3600000);
        e.servidor.push({ estudiante: 'Laura M.', simulacro: e.simulacro.numero, respuestas: {}, origen: 'celular', terminado: new Date().toISOString(), recibido: new Date().toISOString() });
      });
      await ir(lap, '#/grupo', 600);
    },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.grilla.g3 .card:first-child .cifra', { dato: el => `${numero(el)} de 50`, texto: 'siguen activos en la semana 12. Es la métrica que el piloto busca mover.', lado: 'izq', ancho: 400 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.card.ambar', { dato: el => texto(el.querySelector('.cifra')), texto: 'de aciertos en Matemáticas: la clase del próximo sábado', lado: 'izq', ancho: 380, dy: 120 }),
      async ({ lap }, lam, H) => {
        H.quitarRotulos(lam);
        const s = lap.doc.querySelector('.seguimiento');
        lap.win.scrollTo({ top: s.getBoundingClientRect().top + lap.win.scrollY - 140, behavior: 'smooth' });
        await H.espera(800);
        H.rotulo(lam, lap, '.seguimiento li.riesgo', { dato: '11', texto: 'dejaron de responder. Con nombre, la tallerista sabe a quién contactar esta semana.', lado: 'izq', ancho: 400 });
      }
    ]
  },

  // Pruebas técnicas: los contadores de la propia app.
  pruebas: {
    async preparar({ lap }) {
      fijar(lap, e => { e.cuenta = CUENTA(); publicar(e, 600000); });
      await ir(lap, `#/estudiante?c=${CODIGO}`, 600);
    },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.controles .contador:nth-child(2)', { dato: '0', texto: 'respuestas perdidas al cortar la señal', lado: 'der', ancho: 340 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.controles .contador:nth-child(4)', { dato: '0', texto: 'llamadas a la IA durante el simulacro', lado: 'der', ancho: 340, dy: 60 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.controles .contador:nth-child(3)', { dato: el => `${texto(el.querySelector('b'))}`, texto: 'pesa el simulacro: baja una vez y funciona con datos mínimos', lado: 'der', ancho: 340, dy: -150 })
    ]
  },

  // Modelo de negocio: lo que recibe la universidad que paga, sin nombres.
  modelo: {
    async preparar({ lap }) { fijar(lap, e => { e.cuenta = CUENTA(); publicar(e, 3600000); }); await ir(lap, '#/reporte', 600); },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.grilla.g3 .card:nth-child(2) .cifra', { dato: el => texto(el), texto: 'siguen activos: la cobertura medida que la universidad reporta en su proyección social', lado: 'aba', ancho: 420 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.excluye', { texto: 'Sin nombres ni respuestas individuales, y solo grupos de 10 o más.', lado: 'aba', ancho: 400 })
    ]
  },

  // Láminas sin app: animaciones de entrada.
  sabadoHoy: { entrar(lam) { const p = lam.querySelector('.pila'); p.classList.remove('ver'); setTimeout(() => p.classList.add('ver'), 450); } },
  metas: {
    async preparar({ and }) {
      fijar(and, e => { e.cuenta = CUENTA(); publicar(e, 3600000); });
      await ir(and, '#/andrea?p=acompanar', 600);
    },
    pasos: [
      async ({ and }, lam, H) => H.rotulo(lam, and, '.app-cel > .a-sub', { dato: '39 de 50', texto: 'siguen activos: la app mide la meta cada semana, sin encuestas.', lado: 'izq', ancho: 400 }),
      async (a, lam, H) => H.quitarRotulos(lam)
    ]
  },
  gtm: {
    async preparar({ lap1 }) {
      fijar(lap1, e => { e.cuenta = CUENTA(); publicar(e, 3600000); });
      await ir(lap1, '#/', 400);
    }
  },

  // ---------- Video de la demo: una escena por momento de la semana. grabar_video.py dispara los pasos con la voz.
  vPreparar: {
    async preparar({ lap }) { fijar(lap, e => { e.cuenta = CUENTA(); e.simulacro.publicado = null; }); await ir(lap, '#/', 600); },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.a-semana', { texto: 'Su semana en tres momentos: preparar, aplicar y acompañar.', lado: 'aba', ancho: 420 }),
      async ({ lap }, lam, H) => {
        await ir(lap, '#/preparar', 600);
        H.rotulo(lam, lap, '.a-chip', { texto: 'La IA propone; el comité del colectivo revisa una por una.', lado: 'der', ancho: 400 });
      },
      async ({ lap }, lam, H) => {
        await H.clic(lam, lap, '[data-acc="aprobar"]', 700);
        await ir(lap, '#/', 600);
        H.rotulo(lam, lap, '.a-hero', { texto: 'Con las aprobadas, el simulacro del sábado queda listo.', lado: 'der', ancho: 400 });
      }
    ]
  },
  vAplicar: {
    async preparar({ and, tel }) {
      fijar(and, e => { e.cuenta = null; e.simulacro.publicado = null; e.simulacro.codigo = null; e.intento = null; e.cola = []; e.servidor = []; e.avion = false; });
      await recargar(tel);
      await ir(and, '#/andrea?p=aplicar', 500);
      await ir(tel, '#/estudiante', 400);
    },
    pasos: [
      async ({ and }, lam, H) => {
        await H.clic(lam, and, '[data-acc="publicar"]', 600);
        H.rotulo(lam, and, '.a-codigo', { texto: 'Un código para el grupo. Cero fotocopias.', lado: 'izq', ancho: 340 });
      },
      async ({ tel }, lam, H) => {
        await recargar(tel);
        await ir(tel, `#/estudiante?c=${CODIGO}`, 500);
        await H.clic(lam, tel, '[data-c="entrar"]', 350);
        await H.escribir(tel, '#c-nombre', 'Laura');
        await H.escribir(tel, '#c-apellido', 'Martínez');
        await H.escribir(tel, '#c-anio', '2010', 90);
        tel.doc.querySelector('#c-acepto').checked = true;
        await H.clic(lam, tel, '[data-c="cuenta"]', 400);
        await H.espera(300);
        H.rotulo(lam, tel, '.etiqueta.e-pend', { dato: 'Menor de edad', texto: 'Queda habilitada cuando el colectivo registra el permiso firmado por su familia.', lado: 'der', ancho: 380 });
      },
      async ({ tel }, lam, H) => {
        tel.doc.querySelector('[data-c="autorizar"]')?.click();
        await H.espera(500);
        await H.clic(lam, tel, '[data-c="datos"]', 350);
        await H.espera(300);
        H.rotulo(lam, tel, '.datos-l', { texto: 'Tus datos: qué se guarda, quién lo ve y cuándo se borra.', lado: 'der', ancho: 360 });
      },
      async ({ tel }, lam, H) => {
        tel.doc.querySelector('[data-c="cerrar-datos"]')?.click();
        await H.espera(300);
        await H.clic(lam, tel, '[data-c="empezar"]', 350);
        await H.clic(lam, tel, '[data-r="1"]', 250);
        await H.clic(lam, tel, '.barra-estado [data-c="avion"]', 400);
        const n = tel.win.__app.estado().simulacro.ids.length;
        for (let q = 0; q < n; q++) {
          tel.doc.querySelector(`[data-r="${q % 4 === 1 ? 2 : 1}"]`)?.click();
          await H.espera(70);
          tel.doc.querySelector('[data-c="sig"]')?.click();
          await H.espera(90);
        }
        await H.espera(300);
        H.rotulo(lam, tel, '.sync', { dato: 'Sin señal', texto: 'Terminó igual: las respuestas quedan en el celular.', lado: 'der', ancho: 340 });
      },
      async ({ tel, and }, lam, H) => {
        await H.clic(lam, tel, '.barra-estado [data-c="avion"]', 400);
        await H.espera(1200);
        H.rotulo(lam, tel, '.aviso-red', { dato: '0', texto: 'respuestas perdidas al volver la señal', lado: 'der', ancho: 320 });
        await recargar(and);
      }
    ]
  },
  vAcompanar: {
    async preparar({ and }) {
      fijar(and, e => { e.cuenta = CUENTA(); publicar(e, 3600000); });
      await ir(and, '#/andrea?p=acompanar', 600);
    },
    pasos: [
      async ({ and }, lam, H) => H.rotulo(lam, and, '.a-personas li:first-child', { texto: 'Con nombre y desde cuándo: a quién contactar esta semana.', lado: 'der', ancho: 400 }),
      async ({ and }, lam, H) => {
        await H.clic(lam, and, '.a-personas li:first-child [data-acc="contactar"]', 500);
        H.rotulo(lam, and, '.a-personas li:first-child', { texto: 'Contactado antes de que abandone.', lado: 'der', ancho: 360 });
      },
      async ({ and }, lam, H) => {
        and.doc.querySelector('.a-cuerpo')?.scrollTo({ top: 400, behavior: 'smooth' });
        await H.espera(700);
        H.rotulo(lam, and, '[data-acc="refuerzo"]', { texto: 'Un toque: la IA arma la práctica de refuerzo de Matemáticas.', lado: 'der', ancho: 400 });
      }
    ]
  },
  vReporte: {
    async preparar({ lap }) { fijar(lap, e => { e.cuenta = CUENTA(); publicar(e, 3600000); }); await ir(lap, '#/reporte', 600); },
    pasos: [
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.grilla.g3 .card:nth-child(2) .cifra', { dato: el => texto(el), texto: 'siguen activos: la cobertura que la universidad reporta.', lado: 'aba', ancho: 420 }),
      async ({ lap }, lam, H) => H.rotulo(lam, lap, '.excluye', { texto: 'Sin nombres ni respuestas individuales, y solo grupos de 10 o más.', lado: 'aba', ancho: 400 })
    ]
  },
  // La demo: la frase de entrada; con un clic el video llena la pantalla; al terminar aparece el resultado.
  demo: {
    entrar(lam) {
      const v = lam.querySelector('video');
      if (v.error || v.readyState === 0) { v.src = `video/demo.mp4?v=${Date.now()}`; v.load(); }
      v.pause(); v.currentTime = 0; lam.classList.remove('sonando', 'fin');
      if (!lam._fin) {
        lam._fin = true;
        v.addEventListener('ended', () => lam.classList.add('fin'));
        // Si quien presenta avanza durante el video, primero se muestra el puente; la siguiente tecla sigue a la próxima lámina.
        addEventListener('keydown', ev => {
          if (!['ArrowRight', ' ', 'PageDown', 'Enter'].includes(ev.key)) return;
          if (!lam.classList.contains('activa') || !lam.classList.contains('sonando') || lam.classList.contains('fin')) return;
          ev.preventDefault(); ev.stopImmediatePropagation();
          v.pause(); lam.classList.add('fin');
        }, true);
        new MutationObserver(() => { if (!lam.classList.contains('activa')) v.pause(); }).observe(lam, { attributes: true, attributeFilter: ['class'] });
      }
    },
    pasos: [async (a, lam) => { lam.classList.add('sonando'); await lam.querySelector('video').play().catch(() => {}); }]
  },

  // Frontera: los nombres cruzan la línea y se vuelven totales; después se escribe la frase para el informe.
  frontera: {
    entrar(lam) {
      lam.querySelectorAll('.fantasma').forEach(f => f.remove());
      lam.querySelector('.frontera').classList.remove('cruza');
      lam.querySelector('.cuenta-f').textContent = '0';
      lam.querySelector('.escribe').textContent = '';
    },
    pasos: [
      async (a, lam, H) => {
        const fr = lam.querySelector('.frontera'), base = fr.getBoundingClientRect(), linea = fr.querySelector('.linea-f').getBoundingClientRect();
        const esc = base.width / fr.offsetWidth;
        fr.querySelectorAll('.nom').forEach((n, k) => {
          const r = n.getBoundingClientRect(), f = document.createElement('span');
          f.className = 'fantasma'; f.textContent = n.textContent;
          f.style.left = `${(r.left - base.left) / esc}px`; f.style.top = `${(r.top - base.top) / esc}px`;
          f.style.setProperty('--hasta', `${(linea.left + linea.width / 2 - r.left) / esc - 60}px`);
          f.style.transitionDelay = `${k * 90}ms, ${k * 90 + 700}ms, ${k * 90 + 550}ms`;
          fr.appendChild(f);
          requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add('va')));
        });
        fr.classList.add('cruza');
        await H.espera(1700);
        const el = lam.querySelector('.cuenta-f'), t0 = performance.now();
        await new Promise(fin => {
          const paso = now => { const t = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(117 * (1 - Math.pow(1 - t, 3))); t < 1 ? requestAnimationFrame(paso) : fin(); };
          requestAnimationFrame(paso);
        });
      },
      async (a, lam, H) => {
        const frase = 'La extensión de la Universidad aliada acompañó en 2027 a 150 jóvenes de Suba y Ciudad Bolívar: 117 siguen preparándose.';
        const el = lam.querySelector('.escribe');
        for (let k = 1; k <= frase.length; k++) { el.textContent = frase.slice(0, k); await H.espera(22); }
      }
    ]
  },
  graf: {},
  // Bogotá: la cifra cuenta hasta 27.000 y la barra muestra la proporción de los 73.747.
  bogota: {
    entrar(lam) {
      const el = lam.querySelector('.cuenta'), hasta = +el.dataset.hasta, t0 = performance.now();
      const paso = now => {
        const t = Math.min(1, (now - t0 - 500) / 1400), e = 1 - Math.pow(1 - Math.max(0, t), 3);
        el.textContent = Math.round(hasta * e).toLocaleString('es-CO');
        if (t < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  },
  // Figuras del Doc de viabilidad (anexo): se escalan para llenar la lámina.
  fig: {
    entrar(lam) {
      const doc = lam.querySelector('.fig-doc'), fig = lam.querySelector('.fig');
      doc.style.transform = 'none';
      const k = Math.min(1640 / fig.offsetWidth, 800 / fig.offsetHeight);
      doc.style.transform = `scale(${k})`;
    }
  },

  // Anexo: la app libre, para usarla con el mouse.
  libre: {}
};
