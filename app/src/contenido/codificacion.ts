// Conversión de bytes a texto (hex y base64) para guardar claves en archivos.

export function aHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

export function deHex(hex: string): Uint8Array {
  const limpio = hex.trim().toLowerCase();
  if (!/^([0-9a-f]{2})*$/.test(limpio)) throw new Error('Texto hexadecimal inválido');
  const bytes = new Uint8Array(limpio.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(limpio.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function aBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function deBase64(texto: string): Uint8Array {
  const s = atob(texto.trim());
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}
