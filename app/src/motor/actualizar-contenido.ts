// De dónde sale el contenido del juego y cómo se actualiza sin borrar el avance.
//
// 1. Al abrir: la copia guardada en el aparato y la que viene con el juego (que el
//    service worker sirve sin internet). Se usa la de versión más alta.
// 2. Con internet: se busca contenido.bin nuevo. Solo se acepta si la firma es válida
//    y la versión es más alta; entonces se guarda y se usa. Si no hay internet, el
//    servidor falla o la firma no es válida, se sigue con el que hay, sin avisar.
// El avance vive aparte (IndexedDB, por número de capítulo): actualizar nunca lo toca.
// La búsqueda no envía ningún dato del jugador: es un GET sin cabeceras propias.

import type { Contenido } from '../contenido/tipos';
import { cargarContenido } from './cargar-contenido';

/** Dónde se guarda el último contenido.bin válido. */
export interface AlmacenContenido {
  leer(): Promise<Uint8Array | null>;
  guardar(archivo: Uint8Array): Promise<void>;
}

export type Descargar = (url: string, opciones?: { sinCache?: boolean }) => Promise<Uint8Array>;

export const descargarArchivo: Descargar = async (url, opciones) => {
  const respuesta = await fetch(url, opciones?.sinCache ? { cache: 'no-store' } : undefined);
  if (!respuesta.ok) throw new Error(`No se pudo descargar el contenido (${respuesta.status}).`);
  return new Uint8Array(await respuesta.arrayBuffer());
};

async function abrir(archivo: Promise<Uint8Array | null>): Promise<Contenido | null> {
  try {
    const bytes = await archivo;
    return bytes ? await cargarContenido(bytes) : null;
  } catch {
    return null;
  }
}

/**
 * El contenido con que arranca el juego: el de versión más alta entre la copia guardada
 * y la incluida. Lanza el error de la incluida si ninguna sirve.
 */
export async function contenidoInicial(almacen: AlmacenContenido, urlIncluido: string, descargar: Descargar = descargarArchivo): Promise<Contenido> {
  const [guardado, incluido] = await Promise.allSettled([abrir(almacen.leer()), descargar(urlIncluido).then(cargarContenido)]);
  const opciones = [guardado, incluido].flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
  if (!opciones.length) throw incluido.status === 'rejected' ? incluido.reason : new Error('Sin contenido.');
  return opciones.reduce((a, b) => (b.version > a.version ? b : a));
}

/**
 * Busca un contenido más nuevo que `actual`. Devuelve el nuevo (ya guardado en el aparato)
 * o null si no hay, no hay internet o el archivo no es válido. Nunca lanza.
 */
export async function buscarContenidoNuevo(actual: Contenido, almacen: AlmacenContenido, url: string, descargar: Descargar = descargarArchivo): Promise<Contenido | null> {
  try {
    const bytes = await descargar(url, { sinCache: true });
    const nuevo = await cargarContenido(bytes);
    if (nuevo.version <= actual.version) return null;
    await almacen.guardar(bytes);
    return nuevo;
  } catch {
    return null;
  }
}

/** Guarda la copia en la caché del navegador (Cache Storage). Sin caché, no guarda nada. */
export function almacenNavegador(nombre = 'berea-contenido', clave = 'contenido.bin'): AlmacenContenido {
  const disponible = () => typeof caches !== 'undefined';
  const url = new URL(clave, 'https://berea.invalid/').href;
  return {
    async leer() {
      if (!disponible()) return null;
      try {
        const respuesta = await (await caches.open(nombre)).match(url);
        return respuesta ? new Uint8Array(await respuesta.arrayBuffer()) : null;
      } catch {
        return null;
      }
    },
    async guardar(archivo) {
      if (!disponible()) return;
      try {
        await (await caches.open(nombre)).put(url, new Response(new Blob([archivo as Uint8Array<ArrayBuffer>]), { headers: { 'Content-Type': 'application/octet-stream' } }));
      } catch {
        // Sin espacio o sin permiso: se volverá a descargar la próxima vez.
      }
    },
  };
}
