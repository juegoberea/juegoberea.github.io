import { describe, expect, it, vi } from 'vitest';
import { empaquetarContenido } from '../app/src/contenido/formato';
import type { Contenido } from '../app/src/contenido/tipos';
import { buscarContenidoNuevo, contenidoInicial, type AlmacenContenido, type Descargar } from '../app/src/motor/actualizar-contenido';

// Claves de prueba en lugar de las del juego: así se firma sin la llave real.
const PRIVADA = new Uint8Array(32).fill(7);
const CIFRADO = new Uint8Array(32).fill(3);
vi.mock('../app/src/contenido/claves', async () => {
  const { getPublicKeyAsync } = await import('@noble/ed25519');
  const { aBase64: b64, aHex: hex } = await import('../app/src/contenido/codificacion');
  return { CLAVE_PUBLICA: hex(await getPublicKeyAsync(new Uint8Array(32).fill(7))), CLAVE_CIFRADO: b64(new Uint8Array(32).fill(3)) };
});

function contenido(version: number): Contenido {
  return { formato: 1, version, generado: '2026-11-04T00:00:00Z', libros: {} };
}
const firmar = (version: number, privada = PRIVADA) => empaquetarContenido(contenido(version), { cifrado: CIFRADO, firmaPrivada: privada });

function almacen(inicial: Uint8Array | null = null): AlmacenContenido & { guardado: Uint8Array | null } {
  return {
    guardado: inicial,
    async leer() { return this.guardado; },
    async guardar(a) { this.guardado = a; },
  };
}

/** Un «servidor» con un archivo por dirección; sin archivo = sin internet. */
function servidor(archivos: Record<string, Uint8Array>): Descargar {
  return async (url) => {
    const archivo = archivos[url.split('?')[0]];
    if (!archivo) throw new TypeError('Failed to fetch');
    return archivo;
  };
}

describe('contenido al abrir el juego', () => {
  it('usa el incluido si no hay copia guardada', async () => {
    const c = await contenidoInicial(almacen(), 'contenido.bin', servidor({ 'contenido.bin': await firmar(3) }));
    expect(c.version).toBe(3);
  });

  it('usa la copia guardada si es más nueva que la incluida', async () => {
    const c = await contenidoInicial(almacen(await firmar(5)), 'contenido.bin', servidor({ 'contenido.bin': await firmar(3) }));
    expect(c.version).toBe(5);
  });

  it('usa la incluida si una actualización del juego trajo una más nueva', async () => {
    const c = await contenidoInicial(almacen(await firmar(5)), 'contenido.bin', servidor({ 'contenido.bin': await firmar(6) }));
    expect(c.version).toBe(6);
  });

  it('sin internet funciona con la copia guardada', async () => {
    const c = await contenidoInicial(almacen(await firmar(4)), 'contenido.bin', servidor({}));
    expect(c.version).toBe(4);
  });

  it('ignora una copia guardada alterada', async () => {
    const alterada = await firmar(9);
    alterada[30] ^= 1;
    const c = await contenidoInicial(almacen(alterada), 'contenido.bin', servidor({ 'contenido.bin': await firmar(3) }));
    expect(c.version).toBe(3);
  });
});

describe('buscar contenido nuevo', () => {
  it('acepta una versión más nueva con firma válida y la guarda', async () => {
    const a = almacen();
    const nuevo = await buscarContenidoNuevo(contenido(3), a, 'contenido.bin?buscar=1', servidor({ 'contenido.bin': await firmar(4) }));
    expect(nuevo?.version).toBe(4);
    expect(a.guardado).not.toBeNull();
  });

  it('no cambia nada si la versión es la misma o más vieja', async () => {
    const a = almacen();
    expect(await buscarContenidoNuevo(contenido(4), a, 'contenido.bin', servidor({ 'contenido.bin': await firmar(4) }))).toBeNull();
    expect(await buscarContenidoNuevo(contenido(4), a, 'contenido.bin', servidor({ 'contenido.bin': await firmar(2) }))).toBeNull();
    expect(a.guardado).toBeNull();
  });

  it('rechaza un archivo con la firma alterada o firmado con otra llave, sin lanzar errores', async () => {
    const a = almacen();
    const alterado = await firmar(8);
    alterado[alterado.length - 1] ^= 1;
    expect(await buscarContenidoNuevo(contenido(3), a, 'contenido.bin', servidor({ 'contenido.bin': alterado }))).toBeNull();
    const otraLlave = await firmar(8, new Uint8Array(32).fill(9));
    expect(await buscarContenidoNuevo(contenido(3), a, 'contenido.bin', servidor({ 'contenido.bin': otraLlave }))).toBeNull();
    expect(a.guardado).toBeNull();
  });

  it('sin internet o con el servidor caído sigue con el que tiene, sin lanzar errores', async () => {
    expect(await buscarContenidoNuevo(contenido(3), almacen(), 'contenido.bin', servidor({}))).toBeNull();
  });
});
