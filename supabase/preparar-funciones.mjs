// Copia el código que el servidor comparte con el juego y el panel a supabase/functions/_shared/generado/,
// adaptado a Deno (extensiones .ts e importaciones npm:). Así el servidor firma con EXACTAMENTE el
// mismo formato que el juego verifica.   node supabase/preparar-funciones.mjs

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destino = resolve(raiz, 'supabase/functions/_shared/generado');
const version = (paquete) => JSON.parse(readFileSync(resolve(raiz, 'node_modules', paquete, 'package.json'), 'utf8')).version;

const ARCHIVOS = {
  'app/src/contenido/formato.ts': 'formato.ts',
  'app/src/contenido/tipos.ts': 'tipos.ts',
  'app/src/contenido/codificacion.ts': 'codificacion.ts',
  'app/src/contenido/claves.ts': 'claves.ts',
  'convertidor/src/clave-firma.ts': 'clave-firma.ts',
  'panel/src/compartido/banco.ts': 'banco.ts',
  'panel/src/compartido/sello.ts': 'sello.ts',
};
const PAQUETES = { fflate: `npm:fflate@${version('fflate')}`, '@noble/ed25519': `npm:@noble/ed25519@${version('@noble/ed25519')}` };

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
for (const [origen, nombre] of Object.entries(ARCHIVOS)) {
  let texto = readFileSync(resolve(raiz, origen), 'utf8');
  texto = texto.replace(/from '([^']+)'/g, (todo, ruta) => {
    if (PAQUETES[ruta]) return `from '${PAQUETES[ruta]}'`;
    if (!ruta.startsWith('.')) return todo;
    const archivo = resolve(dirname(resolve(raiz, origen)), ruta).replace(/\\/g, '/').replace(`${raiz.replace(/\\/g, '/')}/`, '') + '.ts';
    if (!ARCHIVOS[archivo]) throw new Error(`${origen} importa ${ruta}, que no se copia al servidor.`);
    return `from './${ARCHIVOS[archivo]}'`;
  });
  writeFileSync(resolve(destino, nombre), `// GENERADO por supabase/preparar-funciones.mjs desde ${origen}. No editar aquí.\n${texto}`);
}
console.log(`Listo: ${Object.keys(ARCHIVOS).length} archivos en supabase/functions/_shared/generado/`);
