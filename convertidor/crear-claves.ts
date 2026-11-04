// Crea las claves del juego. Se ejecuta UNA sola vez:  npm run claves:crear
//
// - claves/berea-clave-de-firma.json  → clave privada de firma (solo en la PC de la autora).
// - app/src/contenido/claves.ts        → clave pública de firma y clave de cifrado (van dentro del juego).
//
// Crear claves nuevas invalida todo contenido.bin anterior, por eso no se reemplazan
// salvo con:  npm run claves:crear -- --forzar

import * as ed from '@noble/ed25519';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aBase64, aHex } from '../app/src/contenido/codificacion';
import { crearArchivoClave, NOMBRE_ARCHIVO_CLAVE } from './src/clave-firma';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rutaPrivada = resolve(raiz, 'claves', NOMBRE_ARCHIVO_CLAVE);
const rutaPublicas = resolve(raiz, 'app', 'src', 'contenido', 'claves.ts');

if (existsSync(rutaPrivada) && !process.argv.includes('--forzar')) {
  console.error(`Ya existe ${rutaPrivada}.`);
  console.error('Crear claves nuevas invalida todos los contenido.bin publicados. Si de verdad quieres hacerlo:');
  console.error('  npm run claves:crear -- --forzar');
  process.exit(1);
}

const privada = ed.utils.randomPrivateKey();
const publica = await ed.getPublicKeyAsync(privada);
const cifrado = crypto.getRandomValues(new Uint8Array(32));

mkdirSync(dirname(rutaPrivada), { recursive: true });
writeFileSync(rutaPrivada, JSON.stringify(crearArchivoClave(privada, publica), null, 2) + '\n', 'utf8');

writeFileSync(
  rutaPublicas,
  `// Generado por «npm run claves:crear». No lo edites a mano.
// La clave pública solo sirve para COMPROBAR la firma del contenido; firmar requiere la
// clave privada, que vive en claves/ en la PC de la autora.
// La clave de cifrado tiene que ir dentro del juego para poder leer el contenido sin
// servidor: frena a un jugador curioso, no a un experto.

export const CLAVE_PUBLICA = '${aHex(publica)}';
export const CLAVE_CIFRADO = '${aBase64(cifrado)}';
`,
  'utf8',
);

console.log('Claves creadas:');
console.log(`  Privada (NO compartir): ${rutaPrivada}`);
console.log(`  Públicas (van en el juego): ${rutaPublicas}`);
