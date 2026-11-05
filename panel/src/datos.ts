// Lo que muestra el panel, leído de Supabase. Las reglas RLS solo lo entregan a la autora con el código puesto.

import type { Contenido } from '../../app/src/contenido/tipos';
import type { CapituloBanco, FilaPregunta } from './compartido/banco';
import type { FilaCapitulo } from './estados';
import * as muestra from './muestra';
import type { CapituloRevisado, Medicion } from './revision';
import { db } from './supabase';

export const LIBRO = 'patriarcas-y-profetas';

export interface FilaVersion {
  numero: number;
  publicada_en: string;
  capitulos: number[];
  mensaje: string;
  vuelve_a: number | null;
  retirada_en: string | null;
}

export interface FilaRegistro {
  id: number;
  cuando: string;
  accion: string;
  detalle: string;
  navegador: string;
  resultado: 'hecho' | 'rechazado';
}

export interface Libro {
  id: string;
  titulo: string;
  total_capitulos: number;
}

export interface DatosPanel {
  libro: Libro;
  capitulos: FilaCapitulo[];
  version: FilaVersion | null;
  registro: FilaRegistro[];
}

/** Un capítulo del banco con sus datos de revisión. */
export type CapituloGuardado = FilaCapitulo & CapituloBanco & { medicion: Medicion | null };

function revisar<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data;
}

export async function leerDatos(): Promise<DatosPanel> {
  if (muestra.enMuestra) return muestra.leerDatos();
  const cliente = db();
  const [libro, capitulos, versiones, registro] = await Promise.all([
    cliente.from('libros').select('id, titulo, total_capitulos').eq('id', LIBRO).single(),
    cliente.from('capitulos').select('numero, titulo, validacion, avisos, huella, huella_publicada').eq('libro_id', LIBRO).order('numero'),
    leerVersiones(),
    cliente.from('registro').select('id, cuando, accion, detalle, navegador, resultado').order('id', { ascending: false }).limit(8),
  ]);
  return { libro: revisar(libro) as Libro, capitulos: revisar(capitulos) ?? [], version: versiones.find((v) => !v.retirada_en) ?? null, registro: revisar(registro) ?? [] };
}

export async function leerVersiones(): Promise<FilaVersion[]> {
  if (muestra.enMuestra) return muestra.leerVersiones();
  const r = await db().from('versiones').select('numero, publicada_en, capitulos, mensaje, vuelve_a, retirada_en').order('numero', { ascending: false });
  return revisar(r) ?? [];
}

/** El contenido de la última versión publicada (para comparar «antes» y «ahora»). */
export async function contenidoPublicado(): Promise<Contenido | null> {
  if (muestra.enMuestra) return muestra.contenidoPublicado();
  const r = await db().from('versiones').select('contenido').is('retirada_en', null).order('numero', { ascending: false }).limit(1).maybeSingle();
  return (revisar(r)?.contenido as Contenido | undefined) ?? null;
}

/** Todo el banco del libro: capítulos con sus preguntas. */
export async function leerBanco(): Promise<CapituloGuardado[]> {
  if (muestra.enMuestra) return muestra.leerBanco();
  const cliente = db();
  const [capitulos, preguntas] = await Promise.all([
    cliente.from('capitulos').select('numero, titulo, reflexion, validacion, avisos, huella, huella_publicada, medicion').eq('libro_id', LIBRO).order('numero'),
    cliente.from('preguntas').select('capitulo, orden, numero, ronda, texto, opcion_a, opcion_b, opcion_c, correcta, explicacion, cita').eq('libro_id', LIBRO).order('orden').limit(10000),
  ]);
  const filas = (revisar(preguntas) ?? []) as (FilaPregunta & { capitulo: number })[];
  return ((revisar(capitulos) ?? []) as Omit<CapituloGuardado, 'preguntas'>[]).map((c) => ({
    ...c,
    preguntas: filas.filter((p) => p.capitulo === c.numero).map(({ capitulo: _, ...p }) => p),
  }));
}

/** Guarda capítulos revisados: reemplaza sus preguntas. No toca lo publicado (huella_publicada). */
export async function guardarCapitulos(revisados: CapituloRevisado[], mediciones: Map<number, Medicion | null>): Promise<void> {
  if (muestra.enMuestra) return muestra.guardarCapitulos(revisados, mediciones);
  const cliente = db();
  for (const r of revisados) {
    const c = r.capitulo;
    revisar(await cliente.from('capitulos').upsert({
      libro_id: LIBRO,
      numero: c.numero,
      titulo: c.titulo,
      reflexion: c.reflexion,
      validacion: r.validacion,
      avisos: r.avisos,
      huella: r.huella,
      medicion: mediciones.get(c.numero) ?? null,
      actualizado_en: new Date().toISOString(),
    }, { onConflict: 'libro_id,numero' }));
    revisar(await cliente.from('preguntas').delete().eq('libro_id', LIBRO).eq('capitulo', c.numero));
    if (c.preguntas.length) revisar(await cliente.from('preguntas').insert(c.preguntas.map((p) => ({ ...p, libro_id: LIBRO, capitulo: c.numero }))));
  }
}

/** Actualiza solo la revisión de un capítulo (avisos, validación, medición), sin tocar sus preguntas. */
export async function guardarRevision(r: CapituloRevisado, medicion: Medicion | null): Promise<void> {
  if (muestra.enMuestra) return muestra.guardarRevision(r, medicion);
  revisar(await db().from('capitulos').update({ validacion: r.validacion, avisos: r.avisos, huella: r.huella, medicion }).eq('libro_id', LIBRO).eq('numero', r.capitulo.numero));
}

/** Guarda una pregunta corregida y la revisión nueva de su capítulo. */
export async function guardarPregunta(capitulo: number, pregunta: FilaPregunta, r: CapituloRevisado, medicion: Medicion | null): Promise<void> {
  if (muestra.enMuestra) return muestra.guardarPregunta(capitulo, pregunta, r, medicion);
  const { orden, ...campos } = pregunta;
  revisar(await db().from('preguntas').update(campos).eq('libro_id', LIBRO).eq('capitulo', capitulo).eq('orden', orden));
  await guardarRevision(r, medicion);
}

/** Llama a una función del servidor (publicar, acciones delicadas) con la sesión de la autora. */
export async function llamarFuncion<T>(nombre: string, cuerpo: Record<string, unknown>): Promise<T> {
  if (muestra.enMuestra) return muestra.llamarFuncion<T>();
  const { data, error } = await db().functions.invoke(nombre, { body: cuerpo });
  if (error) {
    // El servidor explica el problema en el cuerpo de la respuesta.
    const detalle = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detalle?.error ?? error.message);
  }
  return data as T;
}
