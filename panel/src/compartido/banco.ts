// Banco de preguntas → contenido del juego. Lo usan el panel (en el navegador) y la función
// que publica (en el servidor de Supabase), así los dos arman y firman exactamente lo mismo.
// Sin dependencias: solo tipos del juego y WebCrypto (está en navegadores y en Deno).

import { PREGUNTAS_POR_CAPITULO, RONDAS, type Capitulo, type Contenido, type NumeroRonda } from '../../../app/src/contenido/tipos';

/** Una fila del banco (tabla «preguntas»): como en el Excel; en un borrador puede estar incompleta. */
export interface FilaPregunta {
  orden: number;
  numero: number | null;
  ronda: number | null;
  texto: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  correcta: number | null;
  explicacion: string;
  cita: string;
}

export interface CapituloBanco {
  numero: number;
  titulo: string;
  reflexion: string;
  preguntas: FilaPregunta[];
}

const comparable = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Orden del juego: por ronda y luego por N.º (las incompletas al final, en su orden). */
export function ordenadas(filas: FilaPregunta[]): FilaPregunta[] {
  return [...filas].sort((a, b) => (a.ronda ?? 9) - (b.ronda ?? 9) || (a.numero ?? 999) - (b.numero ?? 999) || a.orden - b.orden);
}

async function sha256(texto: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Código que cambia si cambia cualquier cosa que ve el jugador. Se calcula igual desde el banco
 * y desde un contenido publicado, para saber si un capítulo tiene correcciones sin publicar.
 */
export function huellaCapitulo(c: CapituloBanco): Promise<string> {
  const filas = ordenadas(c.preguntas).map((p) => [p.numero, p.ronda, p.texto, p.opcion_a, p.opcion_b, p.opcion_c, p.correcta, p.explicacion, p.cita]);
  return sha256(JSON.stringify([c.titulo, c.reflexion, filas]));
}

/** Un capítulo del juego, de vuelta al formato del banco (para comparar con lo publicado). */
export function capituloDelJuego(c: Capitulo): CapituloBanco {
  return {
    numero: c.numero,
    titulo: c.titulo,
    reflexion: c.reflexion,
    preguntas: c.preguntas.map((p, i) => ({
      orden: i,
      numero: p.id,
      ronda: p.ronda,
      texto: p.texto,
      opcion_a: p.opciones[0],
      opcion_b: p.opciones[1],
      opcion_c: p.opciones[2],
      correcta: p.correcta,
      explicacion: p.explicacion,
      cita: p.cita,
    })),
  };
}

/** Lo que impide publicar un capítulo (las mismas reglas que el convertidor); vacío si está bien. */
export function erroresDeEstructura(c: CapituloBanco): string[] {
  const errores: string[] = [];
  if (!c.titulo.trim()) errores.push('no tiene título');
  if (c.preguntas.length !== PREGUNTAS_POR_CAPITULO) errores.push(`tiene ${c.preguntas.length} preguntas; deben ser ${PREGUNTAS_POR_CAPITULO}`);
  const porRonda = RONDAS.map((r) => c.preguntas.filter((p) => p.ronda === r.numero).length);
  if (RONDAS.some((r, i) => porRonda[i] !== r.cantidad)) errores.push(`las rondas tienen ${porRonda.join('·')}; deben ser 6·6·6·2`);
  const numeros = new Set<number>();
  for (const p of c.preguntas) {
    const n = p.numero ?? `fila ${p.orden + 1}`;
    if (p.numero === null || p.numero < 1) errores.push(`la pregunta ${n} no tiene N.º válido`);
    else if (numeros.has(p.numero)) errores.push(`el N.º ${p.numero} está repetido`);
    else numeros.add(p.numero);
    if (!p.texto.trim()) errores.push(`la pregunta ${n} está vacía`);
    const opciones = [p.opcion_a, p.opcion_b, p.opcion_c];
    if (opciones.some((o) => !o.trim())) errores.push(`la pregunta ${n} tiene una opción vacía`);
    if (new Set(opciones.map(comparable)).size < 3) errores.push(`la pregunta ${n} tiene opciones repetidas`);
    if (p.correcta === null || ![0, 1, 2].includes(p.correcta)) errores.push(`la pregunta ${n} no tiene respuesta correcta`);
  }
  return errores;
}

/** Capítulo del banco → capítulo del juego. Lanza un error si no se puede publicar. */
export function capituloAlJuego(c: CapituloBanco): Capitulo {
  const errores = erroresDeEstructura(c);
  if (errores.length) throw new Error(`El capítulo ${c.numero} no se puede publicar: ${errores.join('; ')}.`);
  return {
    numero: c.numero,
    titulo: c.titulo.trim(),
    reflexion: c.reflexion.trim(),
    preguntas: ordenadas(c.preguntas).map((p) => ({
      id: p.numero!,
      ronda: p.ronda as NumeroRonda,
      texto: p.texto.trim(),
      opciones: [p.opcion_a.trim(), p.opcion_b.trim(), p.opcion_c.trim()],
      correcta: p.correcta as 0 | 1 | 2,
      explicacion: p.explicacion.trim(),
      cita: p.cita.trim(),
    })),
  };
}

export interface DatosVersion {
  /** Lo publicado antes (null la primera vez). Los capítulos que no se tocan se conservan tal cual. */
  anterior: Contenido | null;
  libro: { id: string; titulo: string; idioma: string };
  /** Capítulos nuevos o corregidos que entran en esta versión. */
  capitulos: CapituloBanco[];
  /** Número interno que compara el juego: debe ser mayor que el de la versión anterior. */
  version: number;
  generado: string;
  mensaje: string;
}

/** Arma el contenido de una versión nueva. Lanza un error si quedan capítulos salteados. */
export function armarVersion(d: DatosVersion): Contenido {
  if (d.anterior && d.version <= d.anterior.version) throw new Error('El número de versión debe ser mayor que el anterior.');
  const libros = structuredClone(d.anterior?.libros ?? {});
  const libro = (libros[d.libro.id] ??= { id: d.libro.id, idiomas: {} });
  const enIdioma = (libro.idiomas[d.libro.idioma] ??= { titulo: d.libro.titulo, capitulos: [] });
  const porNumero = new Map(enIdioma.capitulos.map((c) => [c.numero, c]));
  for (const c of d.capitulos) porNumero.set(c.numero, capituloAlJuego(c));
  enIdioma.capitulos = [...porNumero.values()].sort((a, b) => a.numero - b.numero);
  const faltan = enIdioma.capitulos.flatMap((c, i) => (c.numero === i + 1 ? [] : [i + 1]));
  if (faltan.length) throw new Error(`Los capítulos deben ir seguidos desde el 1: falta el capítulo ${faltan[0]}.`);
  const contenido: Contenido = { formato: 1, version: d.version, generado: d.generado, libros };
  if (d.mensaje.trim()) contenido.mensaje = d.mensaje.trim();
  return contenido;
}
