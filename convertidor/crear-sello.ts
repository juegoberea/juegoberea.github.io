// Crea el SELLO DE LA AUTORA (una sola vez): un par de claves Ed25519 NUEVO, distinto de la llave
// que firma el contenido. Solo sirve para las acciones muy delicadas del panel.
//   npm run sello:crear
// La parte privada queda en claves/sello-de-la-autora.berea: la autora la copia a su pendrive (y una
// segunda copia al sobre). La parte pública se guarda en el servidor; la privada nunca se sube.

import * as ed from '@noble/ed25519';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aHex } from '../app/src/contenido/codificacion';
import { TIPO_SELLO, type ArchivoSello } from '../panel/src/compartido/sello';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ruta = resolve(raiz, 'claves', 'sello-de-la-autora.berea');
if (existsSync(ruta)) {
  console.error(`Ya existe ${ruta}. No se crea otro: el sello es uno solo.`);
  process.exit(1);
}

const privada = ed.utils.randomPrivateKey();
const publica = await ed.getPublicKeyAsync(privada);
const archivo: ArchivoSello = {
  tipo: TIPO_SELLO,
  version: 1,
  creado: new Date().toISOString(),
  aviso: 'Sello de la autora de Berea. Guárdalo en tu pendrive y una copia en el sobre. No lo envíes ni lo subas a internet. Es distinto de la llave que firma al publicar.',
  publica: aHex(publica),
  privada: aHex(privada),
};
mkdirSync(dirname(ruta), { recursive: true });
writeFileSync(ruta, JSON.stringify(archivo, null, 2));
console.log(`Sello creado: ${ruta}`);
console.log(`Parte pública (va al servidor): ${archivo.publica}`);
