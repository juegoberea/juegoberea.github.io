// Modo de muestra: para mirar el panel por dentro en esta PC sin entrar a Supabase.
// Solo existe con `npm run panel:dev` y «?muestra» en la dirección (import.meta.env.DEV): en el panel
// publicado no está. Usa los capítulos del contenido publicado y guarda los cambios solo en memoria.

import type { Contenido } from '../../app/src/contenido/tipos';
import { cargarContenido } from '../../app/src/motor/cargar-contenido';
import { capituloDelJuego, huellaCapitulo, type FilaPregunta } from './compartido/banco';
import type { CapituloGuardado, DatosPanel, FilaRegistro, FilaVersion, Libro } from './datos';
import type { CapituloRevisado, Medicion } from './revision';

export const enMuestra = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('muestra');

export const AUTORA_MUESTRA = { nombre: 'sharon', correo: 'sharon@berea.invalid' };

const LIBRO: Libro = { id: 'patriarcas-y-profetas', titulo: 'Patriarcas y profetas', total_capitulos: 73 };

let cargado: Promise<{ contenido: Contenido; banco: CapituloGuardado[]; version: FilaVersion; registro: FilaRegistro[] }> | null = null;

function cargar() {
  cargado ??= (async () => {
    const { default: url } = await import('../../contenido/publicado/contenido.bin?url');
    const contenido = await cargarContenido(new Uint8Array(await (await fetch(url)).arrayBuffer()));
    const libro = contenido.libros[LIBRO.id].idiomas.es;
    LIBRO.titulo = libro.titulo ?? LIBRO.titulo;
    const banco = await Promise.all(libro.capitulos.map(async (c) => {
      const b = capituloDelJuego(c);
      const huella = await huellaCapitulo(b);
      return { ...b, validacion: 'bien' as const, avisos: [], huella, huella_publicada: huella, medicion: null };
    }));
    const ahora = new Date().toISOString();
    const version: FilaVersion = { numero: 1, publicada_en: ahora, capitulos: banco.map((c) => c.numero), mensaje: '', vuelve_a: null, retirada_en: null };
    const registro: FilaRegistro[] = [{ id: 1, cuando: ahora, accion: 'entrada', detalle: 'Modo de muestra', navegador: 'Esta PC', resultado: 'hecho' }];
    return { contenido, banco, version, registro };
  })();
  return cargado;
}

export async function leerDatos(): Promise<DatosPanel> {
  const m = await cargar();
  return { libro: { ...LIBRO }, capitulos: m.banco, version: m.version, registro: m.registro, vigilancia: { anterior: null, fallos: 0, borrado: null } };
}

export async function leerVersiones(): Promise<FilaVersion[]> {
  return [(await cargar()).version];
}

export async function contenidoPublicado(): Promise<Contenido> {
  return (await cargar()).contenido;
}

export async function leerBanco(): Promise<CapituloGuardado[]> {
  return structuredClone((await cargar()).banco);
}

function poner(guardado: CapituloGuardado, r: CapituloRevisado, medicion: Medicion | null) {
  Object.assign(guardado, { validacion: r.validacion, avisos: r.avisos, huella: r.huella, medicion });
}

export async function guardarCapitulos(revisados: CapituloRevisado[], mediciones: Map<number, Medicion | null>): Promise<void> {
  const m = await cargar();
  for (const r of revisados) {
    const c = r.capitulo;
    let guardado = m.banco.find((b) => b.numero === c.numero);
    if (!guardado) {
      guardado = { ...structuredClone(c), validacion: 'bien', avisos: [], huella: '', huella_publicada: null, medicion: null };
      m.banco.push(guardado);
      m.banco.sort((a, b) => a.numero - b.numero);
    }
    Object.assign(guardado, { titulo: c.titulo, reflexion: c.reflexion, preguntas: structuredClone(c.preguntas) });
    poner(guardado, r, mediciones.get(c.numero) ?? null);
  }
}

export async function guardarRevision(r: CapituloRevisado, medicion: Medicion | null): Promise<void> {
  const guardado = (await cargar()).banco.find((b) => b.numero === r.capitulo.numero);
  if (guardado) poner(guardado, r, medicion);
}

export async function guardarPregunta(capitulo: number, pregunta: FilaPregunta, r: CapituloRevisado, medicion: Medicion | null): Promise<void> {
  const guardado = (await cargar()).banco.find((b) => b.numero === capitulo);
  if (!guardado) return;
  guardado.preguntas = guardado.preguntas.map((p) => (p.orden === pregunta.orden ? { ...pregunta } : p));
  poner(guardado, r, medicion);
}

export async function llamarFuncion<T>(): Promise<T> {
  throw new Error('Esto es una muestra: aquí no se publica ni se cambia nada de verdad.');
}
