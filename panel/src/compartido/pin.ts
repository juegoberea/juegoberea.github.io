// PIN de «Código de Berea»: la clave del código de 6 números se guarda en el celular cifrada con un
// PIN de 4 números (PBKDF2 + AES-GCM, solo WebCrypto). Sin el PIN, quien tome el celular no ve el código.

export const LARGO_PIN = 4;
const VUELTAS = 310_000;

export type CajaCifrada = { sal: string; iv: string; cifrado: string };

const aBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const deBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function llaveDelPin(pin: string, sal: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal as BufferSource, iterations: VUELTAS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function cerrarConPin(clave: string, pin: string): Promise<CajaCifrada> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llaveDelPin(pin, sal), new TextEncoder().encode(clave));
  return { sal: aBase64(sal), iv: aBase64(iv), cifrado: aBase64(new Uint8Array(cifrado)) };
}

/** La clave guardada, o null si el PIN no es el correcto. */
export async function abrirConPin(caja: CajaCifrada, pin: string): Promise<string | null> {
  try {
    const llave = await llaveDelPin(pin, deBase64(caja.sal));
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deBase64(caja.iv) as BufferSource }, llave, deBase64(caja.cifrado) as BufferSource);
    return new TextDecoder().decode(claro);
  } catch {
    return null;
  }
}

/** PIN que cualquiera probaría primero: todos iguales (0000) o seguidos (1234, 9876). */
export function pinFacil(pin: string): boolean {
  const d = [...pin].map(Number);
  const pasos = new Set(d.slice(1).map((n, i) => n - d[i]));
  return pasos.size === 1 && [0, 1, -1].includes([...pasos][0]);
}

/** Después de 5 PIN equivocados seguidos, hay que esperar 5 minutos (y otros 5 cada 5 fallos más). */
export function esperaTrasFallos(fallos: number): number {
  return fallos > 0 && fallos % 5 === 0 ? 5 * 60_000 : 0;
}
