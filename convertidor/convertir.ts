// Versión por terminal del convertidor (la autora usa la página Convertidor-Berea.html).
//   npm run contenido
// Lee todos los .xlsx de contenido/excel/, muestra los avisos y, si no hay errores,
// escribe contenido/publicado/contenido.bin firmado con la clave de claves/.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../app/src/contenido/claves';
import { deBase64 } from '../app/src/contenido/codificacion';
import { empaquetarContenido } from '../app/src/contenido/formato';
import { armarContenido } from './src/armar-contenido';
import { describirAviso } from './src/avisos';
import { leerArchivoClave, NOMBRE_ARCHIVO_CLAVE } from './src/clave-firma';
import { leerExcel } from './src/leer-excel';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaExcel = resolve(raiz, 'contenido', 'excel');
const rutaClave = resolve(raiz, 'claves', NOMBRE_ARCHIVO_CLAVE);
const rutaSalida = resolve(raiz, 'contenido', 'publicado', 'contenido.bin');

const archivos = readdirSync(carpetaExcel).filter((n) => /\.xlsx$/i.test(n) && !n.startsWith('~$'));
if (archivos.length === 0) {
  console.error(`No hay archivos .xlsx en ${carpetaExcel}`);
  process.exit(1);
}

const lecturas = archivos.map((n) => leerExcel(readFileSync(resolve(carpetaExcel, n)), n));
const resultado = armarContenido(lecturas);

for (const libro of resultado.resumen) {
  const preguntas = libro.capitulos.reduce((s, c) => s + c.preguntas, 0);
  console.log(`${libro.titulo} (${libro.idioma}): ${libro.capitulos.length} capítulos, ${preguntas} preguntas`);
}
const errores = resultado.avisos.filter((a) => a.tipo === 'error');
const advertencias = resultado.avisos.filter((a) => a.tipo === 'advertencia');
for (const a of errores) console.log(`  ERROR · ${describirAviso(a)}`);
for (const a of advertencias) console.log(`  Revisar · ${describirAviso(a)}`);
console.log(`${errores.length} errores, ${advertencias.length} advertencias.`);

if (resultado.hayErrores) {
  console.error('No se generó contenido.bin: corrige los errores en el Excel y vuelve a intentarlo.');
  process.exit(1);
}
if (!existsSync(rutaClave)) {
  console.error(`Falta la clave de firma: ${rutaClave}`);
  process.exit(1);
}

const bin = await empaquetarContenido(resultado.contenido, {
  cifrado: deBase64(CLAVE_CIFRADO),
  firmaPrivada: await leerArchivoClave(readFileSync(rutaClave, 'utf8'), CLAVE_PUBLICA),
});
mkdirSync(dirname(rutaSalida), { recursive: true });
writeFileSync(rutaSalida, bin);
console.log(`Listo: ${rutaSalida} (${(bin.length / 1024).toFixed(1)} KB)`);
