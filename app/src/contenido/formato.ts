// Formato del archivo contenido.bin: comprimido, cifrado (AES-GCM) y firmado (Ed25519).
//
//   bytes 0–3     «BRA1» (marca del archivo)
//   byte  4       versión del formato (1)
//   bytes 5–16    vector de inicio del cifrado (12 bytes, al azar en cada conversión)
//   bytes 17…N-65 contenido comprimido y cifrado
//   últimos 64    firma Ed25519 de todo lo anterior
//
// Solo quien tiene la clave privada de firma (la autora) puede crear un archivo que el
// juego acepte. La clave de cifrado viaja dentro del juego: sin servidor no hay forma de
// esconderla del todo, así que esto frena a un jugador curioso pero no a un experto.

import * as ed from '@noble/ed25519';
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import type { Contenido } from './tipos';

const MARCA = [0x42, 0x52, 0x41, 0x31]; // «BRA1»
const VERSION_FORMATO = 1;
const LARGO_CABECERA = 5;
const LARGO_IV = 12;
const LARGO_FIRMA = 64;

export type MotivoError = 'formato' | 'alterado';

export class ErrorContenido extends Error {
  constructor(
    readonly motivo: MotivoError,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorContenido';
  }
}

async function claveAes(clave: Uint8Array, uso: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', clave as BufferSource, 'AES-GCM', false, [uso]);
}

export async function empaquetarContenido(
  contenido: Contenido,
  claves: { cifrado: Uint8Array; firmaPrivada: Uint8Array },
): Promise<Uint8Array> {
  const cabecera = new Uint8Array([...MARCA, VERSION_FORMATO]);
  const iv = crypto.getRandomValues(new Uint8Array(LARGO_IV));
  const comprimido = deflateSync(strToU8(JSON.stringify(contenido)), { level: 9 });
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: cabecera },
      await claveAes(claves.cifrado, 'encrypt'),
      comprimido as BufferSource,
    ),
  );

  const firmado = new Uint8Array(LARGO_CABECERA + LARGO_IV + cifrado.length);
  firmado.set(cabecera, 0);
  firmado.set(iv, LARGO_CABECERA);
  firmado.set(cifrado, LARGO_CABECERA + LARGO_IV);

  const firma = await ed.signAsync(firmado, claves.firmaPrivada);
  const archivo = new Uint8Array(firmado.length + LARGO_FIRMA);
  archivo.set(firmado, 0);
  archivo.set(firma, firmado.length);
  return archivo;
}

export async function abrirContenido(
  archivo: Uint8Array,
  claves: { cifrado: Uint8Array; firmaPublica: Uint8Array },
): Promise<Contenido> {
  if (archivo.length < LARGO_CABECERA + LARGO_IV + LARGO_FIRMA + 16) {
    throw new ErrorContenido('formato', 'El archivo de contenido está incompleto.');
  }
  for (let i = 0; i < MARCA.length; i++) {
    if (archivo[i] !== MARCA[i]) throw new ErrorContenido('formato', 'No es un archivo de contenido de Berea.');
  }
  if (archivo[4] !== VERSION_FORMATO) {
    throw new ErrorContenido('formato', 'El archivo de contenido es de una versión que este juego no conoce.');
  }

  const firmado = archivo.subarray(0, archivo.length - LARGO_FIRMA);
  const firma = archivo.subarray(archivo.length - LARGO_FIRMA);
  let firmaValida = false;
  try {
    firmaValida = await ed.verifyAsync(firma, firmado, claves.firmaPublica);
  } catch {
    firmaValida = false;
  }
  if (!firmaValida) throw new ErrorContenido('alterado', 'El archivo de contenido fue alterado.');

  const cabecera = archivo.subarray(0, LARGO_CABECERA);
  const iv = archivo.subarray(LARGO_CABECERA, LARGO_CABECERA + LARGO_IV);
  const cifrado = archivo.subarray(LARGO_CABECERA + LARGO_IV, archivo.length - LARGO_FIRMA);
  let comprimido: Uint8Array;
  try {
    comprimido = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource, additionalData: cabecera as BufferSource },
        await claveAes(claves.cifrado, 'decrypt'),
        cifrado as BufferSource,
      ),
    );
  } catch {
    throw new ErrorContenido('alterado', 'El archivo de contenido no se pudo descifrar.');
  }

  const contenido = JSON.parse(strFromU8(inflateSync(comprimido))) as Contenido;
  if (contenido.formato !== 1 || typeof contenido.libros !== 'object') {
    throw new ErrorContenido('formato', 'El archivo de contenido tiene una estructura desconocida.');
  }
  return contenido;
}
