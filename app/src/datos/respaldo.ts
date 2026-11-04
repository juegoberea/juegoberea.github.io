// Copia de respaldo: guarda perfiles y su avance en un archivo para recuperarlos en otro
// aparato o después de borrar el navegador.
//
//   bytes 0–3   «BRS1» (marca)
//   byte  4     versión del formato (1)
//   bytes 5–16  vector de inicio (12 bytes al azar)
//   resto       JSON comprimido y cifrado con AES-GCM
//
// AES-GCM detecta cualquier cambio en el archivo. Además, al recuperar se comprueba que
// los puntos y las estrellas cuadren con las reglas, así no se pueden inventar puntos.
// Igual que el contenido: sin servidor, la clave viaja en el juego; frena a un curioso,
// no a un experto.

import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { CLAVE_CIFRADO } from '../contenido/claves';
import { deBase64 } from '../contenido/codificacion';
import { CORRECTAS_PARA_APROBAR, estrellasPorIntento, puntosPorCorrecta } from '../motor/reglas';
import type { Datos } from './base';
import { COLORES_AVATAR, LARGO_MAXIMO_NOMBRE, TAMANOS_LETRA, type Perfil, type ProgresoLibro } from './tipos';

const MARCA = [0x42, 0x52, 0x53, 0x31]; // «BRS1»
const VERSION_FORMATO = 1;
const LARGO_IV = 12;

export const EXTENSION_RESPALDO = '.berea';

export interface ContenidoRespaldo {
  formato: 1;
  exportado: string;
  perfiles: { perfil: Perfil; progresos: ProgresoLibro[] }[];
}

export class ErrorRespaldo extends Error {
  constructor(
    readonly motivo: 'formato' | 'alterado',
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorRespaldo';
  }
}

/** La clave de los respaldos se deriva de la del contenido, para no mezclar usos. */
async function claveRespaldo(base: Uint8Array): Promise<CryptoKey> {
  const etiqueta = strToU8('berea-respaldo-v1');
  const mezcla = new Uint8Array(etiqueta.length + base.length);
  mezcla.set(etiqueta);
  mezcla.set(base, etiqueta.length);
  const derivada = await crypto.subtle.digest('SHA-256', mezcla as BufferSource);
  return crypto.subtle.importKey('raw', derivada, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function empaquetarRespaldo(respaldo: ContenidoRespaldo, base: Uint8Array = deBase64(CLAVE_CIFRADO)): Promise<Uint8Array> {
  const cabecera = new Uint8Array([...MARCA, VERSION_FORMATO]);
  const iv = crypto.getRandomValues(new Uint8Array(LARGO_IV));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: cabecera },
      await claveRespaldo(base),
      deflateSync(strToU8(JSON.stringify(respaldo))) as BufferSource,
    ),
  );
  const archivo = new Uint8Array(cabecera.length + iv.length + cifrado.length);
  archivo.set(cabecera);
  archivo.set(iv, cabecera.length);
  archivo.set(cifrado, cabecera.length + iv.length);
  return archivo;
}

export async function abrirRespaldo(archivo: Uint8Array, base: Uint8Array = deBase64(CLAVE_CIFRADO)): Promise<ContenidoRespaldo> {
  if (archivo.length < 5 + LARGO_IV + 16 || MARCA.some((b, i) => archivo[i] !== b)) {
    throw new ErrorRespaldo('formato', 'Ese archivo no es una copia de respaldo de Berea.');
  }
  if (archivo[4] !== VERSION_FORMATO) {
    throw new ErrorRespaldo('formato', 'La copia de respaldo es de una versión que este juego no conoce.');
  }
  let respaldo: ContenidoRespaldo;
  try {
    const claro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: archivo.subarray(5, 5 + LARGO_IV) as BufferSource, additionalData: archivo.subarray(0, 5) as BufferSource },
      await claveRespaldo(base),
      archivo.subarray(5 + LARGO_IV) as BufferSource,
    );
    respaldo = JSON.parse(strFromU8(inflateSync(new Uint8Array(claro))));
  } catch {
    throw new ErrorRespaldo('alterado', 'La copia de respaldo fue modificada o está dañada.');
  }
  if (!esRespaldoValido(respaldo)) throw new ErrorRespaldo('alterado', 'La copia de respaldo tiene datos que no cuadran.');
  return respaldo;
}

/** Revisa la estructura y que cada capítulo aprobado cumpla las reglas de puntos y estrellas. */
function esRespaldoValido(r: ContenidoRespaldo): boolean {
  if (r?.formato !== 1 || !Array.isArray(r.perfiles)) return false;
  return r.perfiles.every(({ perfil, progresos }) => {
    if (typeof perfil?.id !== 'string' || typeof perfil.nombre !== 'string') return false;
    if (!perfil.nombre.trim() || perfil.nombre.length > LARGO_MAXIMO_NOMBRE) return false;
    if (!COLORES_AVATAR.includes(perfil.color) || !TAMANOS_LETRA.includes(perfil.ajustes?.letra)) return false;
    if (!Array.isArray(progresos)) return false;
    return progresos.every((p) => {
      if (p.perfilId !== perfil.id || typeof p.libroId !== 'string') return false;
      if (typeof p.capitulos !== 'object' || typeof p.diario !== 'object') return false;
      return Object.entries(p.capitulos).every(([capitulo, estado]) => {
        if (!(Number(capitulo) >= 1) || !Number.isInteger(estado.intentos) || estado.intentos < 0) return false;
        const a = estado.aprobado;
        if (!a) return true;
        return (
          Number.isInteger(a.intento) &&
          a.intento >= 1 &&
          a.intento <= estado.intentos &&
          Number.isInteger(a.correctas) &&
          a.correctas >= CORRECTAS_PARA_APROBAR &&
          a.correctas <= 20 &&
          a.puntos === a.correctas * puntosPorCorrecta(a.intento) &&
          a.estrellas === estrellasPorIntento(a.intento)
        );
      });
    });
  });
}

/** Crea el archivo de respaldo de los perfiles indicados (por defecto, todos). */
export async function exportarRespaldo(datos: Datos, perfilIds?: string[], ahora = new Date()): Promise<Uint8Array> {
  const perfiles = (await datos.listarPerfiles()).filter((p) => !perfilIds || perfilIds.includes(p.id));
  const respaldo: ContenidoRespaldo = {
    formato: 1,
    exportado: ahora.toISOString(),
    perfiles: await Promise.all(
      perfiles.map(async (perfil) => ({
        perfil,
        // El intento a medias no viaja en la copia.
        progresos: (await datos.listarProgresos(perfil.id)).map(({ intentoEnCurso: _, ...p }) => p),
      })),
    ),
  };
  return empaquetarRespaldo(respaldo);
}

/**
 * Recupera una copia: cada perfil de la copia reemplaza al perfil con el mismo id en este
 * aparato (o se agrega si no existe). Lanza ErrorRespaldo si el archivo fue alterado.
 */
export async function importarRespaldo(datos: Datos, archivo: Uint8Array): Promise<Perfil[]> {
  const respaldo = await abrirRespaldo(archivo);
  for (const { perfil, progresos } of respaldo.perfiles) await datos.reemplazarPerfil(perfil, progresos);
  return respaldo.perfiles.map((p) => p.perfil);
}

/** Nombre sugerido para el archivo: «Berea-Joshua-2026-11-03.berea». */
export function nombreArchivoRespaldo(nombrePerfil: string, ahora = new Date()): string {
  const limpio = nombrePerfil.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Berea-${limpio || 'copia'}-${ahora.toISOString().slice(0, 10)}${EXTENSION_RESPALDO}`;
}
