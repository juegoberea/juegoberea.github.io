// Carga y verifica contenido.bin con las claves del juego. Un archivo alterado se rechaza.

import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../contenido/claves';
import { deBase64, deHex } from '../contenido/codificacion';
import { abrirContenido } from '../contenido/formato';
import type { Capitulo, Contenido, LibroEnIdioma } from '../contenido/tipos';

export { ErrorContenido } from '../contenido/formato';

/** Verifica la firma y descifra. Lanza ErrorContenido si el archivo fue alterado. */
export function cargarContenido(archivo: Uint8Array): Promise<Contenido> {
  return abrirContenido(archivo, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) });
}

export function libroEnIdioma(contenido: Contenido, libroId: string, idioma = 'es'): LibroEnIdioma | undefined {
  return contenido.libros[libroId]?.idiomas[idioma];
}

export function buscarCapitulo(contenido: Contenido, libroId: string, numero: number, idioma = 'es'): Capitulo | undefined {
  return libroEnIdioma(contenido, libroId, idioma)?.capitulos.find((c) => c.numero === numero);
}
