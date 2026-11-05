// Código de 6 números (TOTP, RFC 6238): el mismo cálculo que hacen Google Authenticator y Microsoft
// Authenticator. Lo usa la página «Código de Berea» del celular. Solo WebCrypto, sin dependencias.

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function deBase32(texto: string): Uint8Array {
  const limpio = texto.replace(/[\s=-]+/g, '').toUpperCase();
  let bits = '';
  for (const c of limpio) {
    const valor = BASE32.indexOf(c);
    if (valor < 0) throw new Error('Clave inválida');
    bits += valor.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return bytes;
}

/** Código de 6 números para el momento `ahora` (milisegundos). Cambia cada 30 segundos. */
export async function codigoDelMomento(clave: Uint8Array, ahora = Date.now(), digitos = 6): Promise<string> {
  const contador = new DataView(new ArrayBuffer(8));
  contador.setBigUint64(0, BigInt(Math.floor(ahora / 30000)));
  const llave = await crypto.subtle.importKey('raw', clave as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', llave, contador.buffer));
  const o = h[h.length - 1] & 15;
  const numero = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(numero % 10 ** digitos).padStart(digitos, '0');
}

/** Segundos que faltan para el próximo código. */
export function segundosRestantes(ahora = Date.now()): number {
  return 30 - (Math.floor(ahora / 1000) % 30);
}
