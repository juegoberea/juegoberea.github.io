// Convierte las filas del Excel en el contenido del juego y revisa que cumpla las reglas:
// 20 preguntas por capítulo (6/6/6/2 por ronda), una correcta A/B/C, opciones completas y
// distintas, capítulos seguidos desde el 1 y una reflexión por capítulo.

import { PREGUNTAS_POR_CAPITULO, RONDAS, type Capitulo, type Contenido, type NumeroRonda, type Pregunta } from '../../app/src/contenido/tipos';
import type { Aviso } from './avisos';
import { normalizar, type FilaBanco, type LecturaExcel } from './leer-excel';

export interface ResumenCapitulo {
  numero: number;
  titulo: string;
  preguntas: number;
  tieneReflexion: boolean;
  errores: number;
  advertencias: number;
}

export interface ResumenLibro {
  id: string;
  titulo: string;
  idioma: string;
  capitulos: ResumenCapitulo[];
}

export interface ResultadoConversion {
  contenido: Contenido;
  avisos: Aviso[];
  resumen: ResumenLibro[];
  /** true si hay al menos un error: en ese caso no se debe generar el archivo. */
  hayErrores: boolean;
}

const LETRAS = ['A', 'B', 'C'] as const;

/** «Patriarcas y Profetas» → «patriarcas-y-profetas». */
export function idDeLibro(titulo: string): string {
  return normalizar(titulo).replace(/ /g, '-');
}

/** Acepta «1 Fácil», «1», «Fácil», «facil», «4 Aplicación», «Aplicacion»… */
export function leerRonda(texto: string): NumeroRonda | null {
  const n = normalizar(texto);
  const numero = /^([1-4])\b/.exec(n);
  if (numero) return Number(numero[1]) as NumeroRonda;
  const ronda = RONDAS.find((r) => n.startsWith(r.clave));
  return ronda ? ronda.numero : null;
}

/** Acepta «A», «a», «A)», « B. »… Devuelve 0, 1 o 2. */
export function leerCorrecta(texto: string): 0 | 1 | 2 | null {
  const limpio = texto.trim().toUpperCase().replace(/[^A-Z]/g, '');
  const pos = LETRAS.indexOf(limpio as (typeof LETRAS)[number]);
  return pos >= 0 ? (pos as 0 | 1 | 2) : null;
}

export function leerEntero(texto: string): number | null {
  const limpio = texto.trim().replace(/\.0+$/, '');
  return /^\d+$/.test(limpio) && Number(limpio) > 0 ? Number(limpio) : null;
}

function comparable(texto: string): string {
  return texto.toLowerCase().replace(/\s+/g, ' ').trim();
}

interface Grupo {
  idioma: string;
  libro: string;
  tituloLibro: string;
  capitulo: number;
  filas: (FilaBanco & { archivo: string })[];
}

export function armarContenido(lecturas: LecturaExcel[], ahora: Date = new Date()): ResultadoConversion {
  const avisos: Aviso[] = lecturas.flatMap((l) => l.avisos);

  // 1. Agrupar las preguntas por libro, idioma y capítulo.
  const grupos = new Map<string, Grupo>();
  for (const lectura of lecturas) {
    for (const fila of lectura.banco) {
      const lugar = { archivo: lectura.archivo, hoja: 'Banco', fila: fila.fila, capitulo: fila.capitulo };
      if (!fila.libro) {
        avisos.push({ tipo: 'error', ...lugar, mensaje: 'falta el nombre del libro.' });
        continue;
      }
      const capitulo = leerEntero(fila.capitulo);
      if (capitulo === null) {
        avisos.push({ tipo: 'error', ...lugar, mensaje: `el capítulo «${fila.capitulo}» no es un número válido.` });
        continue;
      }
      const libro = idDeLibro(fila.libro);
      const clave = `${libro}|${fila.idioma}|${capitulo}`;
      let grupo = grupos.get(clave);
      if (!grupo) {
        grupo = { idioma: fila.idioma, libro, tituloLibro: fila.libro, capitulo, filas: [] };
        grupos.set(clave, grupo);
      }
      grupo.filas.push({ ...fila, archivo: lectura.archivo });
    }
  }

  // 2. Reflexiones por libro, idioma y capítulo.
  const reflexiones = new Map<string, { texto: string; titulo: string; fila: number; archivo: string }>();
  for (const lectura of lecturas) {
    for (const fila of lectura.reflexiones) {
      const lugar = { archivo: lectura.archivo, hoja: 'Reflexiones', fila: fila.fila, capitulo: fila.capitulo };
      const capitulo = leerEntero(fila.capitulo);
      if (capitulo === null || !fila.libro) {
        avisos.push({ tipo: 'advertencia', ...lugar, mensaje: 'falta el libro o el número de capítulo; se ignora esta reflexión.' });
        continue;
      }
      if (!fila.reflexion) continue;
      const clave = `${idDeLibro(fila.libro)}|${fila.idioma}|${capitulo}`;
      if (reflexiones.has(clave)) {
        avisos.push({ tipo: 'advertencia', ...lugar, mensaje: 'el capítulo tiene más de una reflexión; se usa la primera.' });
        continue;
      }
      reflexiones.set(clave, { texto: fila.reflexion, titulo: fila.titulo, fila: fila.fila, archivo: lectura.archivo });
    }
  }

  // 3. Revisar y armar cada capítulo.
  const contenido: Contenido = { formato: 1, version: ahora.getTime(), generado: ahora.toISOString(), libros: {} };
  const resumen = new Map<string, ResumenLibro>();

  const ordenados = [...grupos.values()].sort(
    (x, y) => x.libro.localeCompare(y.libro) || x.idioma.localeCompare(y.idioma) || x.capitulo - y.capitulo,
  );

  for (const grupo of ordenados) {
    const avisosCapitulo: Aviso[] = [];
    const aviso = (tipo: Aviso['tipo'], mensaje: string, fila?: FilaBanco & { archivo: string }) =>
      avisosCapitulo.push({
        tipo,
        mensaje,
        libro: grupo.tituloLibro,
        capitulo: grupo.capitulo,
        ...(fila ? { archivo: fila.archivo, hoja: 'Banco', fila: fila.fila } : {}),
      });

    const titulo = grupo.filas[0].titulo;
    if (!titulo) aviso('error', 'el capítulo no tiene título.', grupo.filas[0]);
    for (const fila of grupo.filas) {
      if (fila.titulo && titulo && fila.titulo !== titulo) {
        aviso('advertencia', `el título «${fila.titulo}» no coincide con «${titulo}» de las otras filas; se usa «${titulo}».`, fila);
      }
    }

    const preguntas: Pregunta[] = [];
    const filaPorNumero = new Map<number, number>();
    for (const fila of grupo.filas) {
      const numero = leerEntero(fila.numero);
      if (numero === null) {
        aviso('error', `el N.º «${fila.numero}» no es válido; debe ser un número.`, fila);
      } else if (filaPorNumero.has(numero)) {
        aviso('error', `el N.º ${numero} está repetido (también en la fila ${filaPorNumero.get(numero)}).`, fila);
      } else {
        filaPorNumero.set(numero, fila.fila);
      }

      const ronda = leerRonda(fila.ronda);
      if (ronda === null) {
        aviso('error', `la ronda «${fila.ronda}» no es válida; usa «1 Fácil», «2 Intermedia», «3 Avanzada» o «4 Aplicación».`, fila);
      }

      if (!fila.pregunta) aviso('error', 'la pregunta está vacía.', fila);

      fila.opciones.forEach((opcion, i) => {
        if (!opcion) aviso('error', `la opción ${LETRAS[i]} está vacía.`, fila);
      });
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          if (fila.opciones[i] && comparable(fila.opciones[i]) === comparable(fila.opciones[j])) {
            aviso('error', `las opciones ${LETRAS[i]} y ${LETRAS[j]} son iguales.`, fila);
          }
        }
      }

      const correcta = leerCorrecta(fila.correcta);
      if (!fila.correcta) aviso('error', 'no tiene respuesta correcta.', fila);
      else if (correcta === null) aviso('error', `la respuesta correcta «${fila.correcta}» no es válida; debe ser A, B o C.`, fila);

      if (!fila.explicacion) aviso('advertencia', 'no tiene explicación (se muestra al acertar).', fila);
      if (!fila.cita) aviso('advertencia', 'no tiene cita bíblica.', fila);

      if (numero !== null && ronda !== null && correcta !== null) {
        preguntas.push({
          id: numero,
          ronda,
          texto: fila.pregunta,
          opciones: fila.opciones,
          correcta,
          explicacion: fila.explicacion,
          cita: fila.cita,
        });
      }
    }

    if (grupo.filas.length !== PREGUNTAS_POR_CAPITULO) {
      aviso('error', `tiene ${grupo.filas.length} preguntas; deben ser ${PREGUNTAS_POR_CAPITULO}.`);
    }
    const porRonda = RONDAS.map((r) => grupo.filas.filter((f) => leerRonda(f.ronda) === r.numero).length);
    if (RONDAS.some((r, i) => porRonda[i] !== r.cantidad)) {
      aviso(
        'error',
        `las rondas tienen ${porRonda[0]} fáciles, ${porRonda[1]} intermedias, ${porRonda[2]} avanzadas y ${porRonda[3]} de aplicación; ` +
          `deben ser ${RONDAS.map((r) => r.cantidad).join(', ').replace(/, (\d+)$/, ' y $1')}.`,
      );
    }

    const reflexion = reflexiones.get(`${grupo.libro}|${grupo.idioma}|${grupo.capitulo}`);
    if (!reflexion) aviso('advertencia', 'no tiene pregunta de reflexión en la hoja «Reflexiones».');

    preguntas.sort((x, y) => x.ronda - y.ronda || x.id - y.id);
    const capitulo: Capitulo = { numero: grupo.capitulo, titulo, reflexion: reflexion?.texto ?? '', preguntas };

    const libro = (contenido.libros[grupo.libro] ??= { id: grupo.libro, idiomas: {} });
    const enIdioma = (libro.idiomas[grupo.idioma] ??= { titulo: grupo.tituloLibro, capitulos: [] });
    enIdioma.capitulos.push(capitulo);

    const claveResumen = `${grupo.libro}|${grupo.idioma}`;
    let resumenLibro = resumen.get(claveResumen);
    if (!resumenLibro) {
      resumenLibro = { id: grupo.libro, titulo: grupo.tituloLibro, idioma: grupo.idioma, capitulos: [] };
      resumen.set(claveResumen, resumenLibro);
    }
    resumenLibro.capitulos.push({
      numero: grupo.capitulo,
      titulo,
      preguntas: grupo.filas.length,
      tieneReflexion: Boolean(reflexion),
      errores: avisosCapitulo.filter((a) => a.tipo === 'error').length,
      advertencias: avisosCapitulo.filter((a) => a.tipo === 'advertencia').length,
    });
    avisos.push(...avisosCapitulo);
  }

  // 4. Los capítulos se desbloquean en orden: deben ir seguidos desde el 1.
  for (const libro of resumen.values()) {
    let esperado = 1;
    for (const cap of libro.capitulos) {
      while (esperado < cap.numero) {
        avisos.push({ tipo: 'error', libro: libro.titulo, mensaje: `En «${libro.titulo}» falta el capítulo ${esperado}: los capítulos deben ir seguidos desde el 1.` });
        esperado++;
      }
      esperado = cap.numero + 1;
    }
  }

  // 5. Reflexiones de capítulos que no tienen preguntas.
  for (const [clave, r] of reflexiones) {
    if (!grupos.has(clave)) {
      avisos.push({
        tipo: 'advertencia',
        archivo: r.archivo,
        hoja: 'Reflexiones',
        fila: r.fila,
        capitulo: clave.split('|')[2],
        mensaje: 'hay reflexión, pero el capítulo no tiene preguntas en la hoja «Banco»; se ignora.',
      });
    }
  }

  if (grupos.size === 0 && !avisos.some((a) => a.tipo === 'error')) {
    avisos.push({ tipo: 'error', mensaje: 'No se encontró ninguna pregunta en la hoja «Banco».' });
  }

  return {
    contenido,
    avisos,
    resumen: [...resumen.values()],
    hayErrores: avisos.some((a) => a.tipo === 'error'),
  };
}
