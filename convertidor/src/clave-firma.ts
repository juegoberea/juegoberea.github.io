// Archivo de la clave privada de firma de la autora (claves/berea-clave-de-firma.json).
// Solo existe en la PC de la autora y nunca se sube al repositorio.

import * as ed from '@noble/ed25519';
import { aHex, deHex } from '../../app/src/contenido/codificacion';

export const NOMBRE_ARCHIVO_CLAVE = 'berea-clave-de-firma.json';
const TIPO = 'berea-clave-de-firma';

export interface ArchivoClave {
  tipo: typeof TIPO;
  version: 1;
  creada: string;
  aviso: string;
  publica: string;
  privada: string;
}

export function crearArchivoClave(privada: Uint8Array, publica: Uint8Array, ahora = new Date()): ArchivoClave {
  return {
    tipo: TIPO,
    version: 1,
    creada: ahora.toISOString(),
    aviso: 'Clave privada de firma de Berea. No la compartas ni la subas a internet. Si la pierdes, habrá que crear otra y publicar una versión nueva del juego.',
    publica: aHex(publica),
    privada: aHex(privada),
  };
}

/**
 * Lee el archivo de la clave y comprueba que corresponde a este juego (a `clavePublica`,
 * en hexadecimal). Devuelve la clave privada.
 */
export async function leerArchivoClave(textoJson: string, clavePublica: string): Promise<Uint8Array> {
  let datos: Partial<ArchivoClave>;
  try {
    datos = JSON.parse(textoJson);
  } catch {
    throw new Error('Ese archivo no es una clave de firma de Berea.');
  }
  if (datos.tipo !== TIPO || typeof datos.privada !== 'string') {
    throw new Error('Ese archivo no es una clave de firma de Berea.');
  }
  const privada = deHex(datos.privada);
  const publica = aHex(await ed.getPublicKeyAsync(privada));
  if (publica !== clavePublica) {
    throw new Error('Esta clave de firma no corresponde a esta versión del juego. Usa la clave de la carpeta «claves».');
  }
  return privada;
}
