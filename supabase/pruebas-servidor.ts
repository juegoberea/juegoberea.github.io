// Panel P2–P6 en Supabase: migración del sello, sello de la autora, secreto de la llave, funciones,
// banco vigente como versión 1, y las pruebas obligatorias de P5 y P6. Deja todo limpio al final.
//   npx vite-node supabase/pruebas-servidor.ts   (necesita claves/supabase-token.txt)
// No lista otros proyectos. No muestra secretos.
import * as ed from '@noble/ed25519';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../app/src/contenido/claves';
import { aHex, deBase64, deHex } from '../app/src/contenido/codificacion';
import { abrirContenido, empaquetarContenido } from '../app/src/contenido/formato';
import type { Contenido } from '../app/src/contenido/tipos';
import { leerArchivoClave } from '../convertidor/src/clave-firma';
import { capituloDelJuego, huellaCapitulo } from '../panel/src/compartido/banco';
import { ACCIONES_DELICADAS, textoDelDesafio, type AccionDelicada } from '../panel/src/compartido/sello';
import { leerExcelBanco, revisarCapitulos } from '../panel/src/revision';

const BEREA = 'C:/Users/reviv/Desktop/berea';
const CLAVES = `${BEREA}/claves`;
const LIBRO = 'patriarcas-y-profetas';
const TOKEN = readFileSync(`${CLAVES}/supabase-token.txt`, 'utf8').trim();
const { proyecto: REF, autora: AUTORA } = JSON.parse(readFileSync(`${CLAVES}/supabase-proyecto.json`, 'utf8'));
const URL_P = `https://${REF}.supabase.co`;
const EXPLICACIONES = /^(contraseña del panel|todo en minúsculas|se pondrá|anótala|usuario|ya no se usa|panel de berea)/i;
const FRASE = readFileSync(`${CLAVES}/frase.txt`, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !EXPLICACIONES.test(l))[0].replace(/^contraseña:\s*/i, '');
const LLAVE_TEXTO = readFileSync(`${CLAVES}/berea-clave-de-firma.json`, 'utf8');

async function api(metodo: string, ruta: string, cuerpo?: unknown, crudo?: BodyInit) {
  const r = await fetch(`https://api.supabase.com${ruta}`, { method: metodo, headers: { Authorization: `Bearer ${TOKEN}`, ...(crudo ? {} : { 'Content-Type': 'application/json' }) }, body: crudo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined) });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}: ${texto.slice(0, 600)}`);
  return texto ? JSON.parse(texto) : null;
}
const sql = (query: string) => api('POST', `/v1/projects/${REF}/database/query`, { query });

const resultados: { nombre: string; ok: boolean }[] = [];
const comprobar = (nombre: string, ok: boolean, detalle = '') => {
  resultados.push({ nombre, ok });
  console.log(`${ok ? '  ✔' : '  ✘'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

function totp(secreto: string, desfase = 0) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secreto.replace(/=+$/, '').toUpperCase()) bits += alfabeto.indexOf(c).toString(2).padStart(5, '0');
  const clave = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + desfase));
  const h = createHmac('sha1', clave).update(contador).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

// ---------- 1. Base de datos, sello y secreto ----------
console.log('== Preparar Supabase ==');
await sql(readFileSync(`${BEREA}/supabase/migrations/20261104140000_sello.sql`, 'utf8'));
console.log('  migración del sello aplicada (y depósito «contenido» público)');
if (!existsSync(`${CLAVES}/sello-de-la-autora.berea`)) {
  execFileSync('C:/Program Files/nodejs/node.exe', [`${BEREA}/node_modules/vite-node/vite-node.mjs`, `${BEREA}/convertidor/crear-sello.ts`], { cwd: BEREA, stdio: 'ignore' });
  console.log('  sello de la autora creado en claves/sello-de-la-autora.berea');
}
const sello = JSON.parse(readFileSync(`${CLAVES}/sello-de-la-autora.berea`, 'utf8'));
await sql(`update privado.config set sello_publico = '${sello.publica.replace(/[^0-9a-f]/g, '')}'`);
console.log('  parte pública del sello guardada en el servidor');
await leerArchivoClave(LLAVE_TEXTO, CLAVE_PUBLICA); // comprueba que es la llave de este juego
await api('POST', `/v1/projects/${REF}/secrets`, [{ name: 'BEREA_CLAVE_FIRMA', value: LLAVE_TEXTO }]);
console.log('  llave de firma guardada como secreto del servidor (la misma de siempre)');

// ---------- 2. Funciones ----------
console.log('== Subir las funciones ==');
execFileSync('C:/Program Files/nodejs/node.exe', [`${BEREA}/supabase/preparar-funciones.mjs`], { cwd: BEREA, stdio: 'ignore' });
function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((n) => (statSync(join(carpeta, n)).isDirectory() ? archivosDe(join(carpeta, n)) : [join(carpeta, n)]));
}
for (const nombre of ['publicar', 'accion-delicada']) {
  const formulario = new FormData();
  formulario.append('metadata', JSON.stringify({ entrypoint_path: `supabase/functions/${nombre}/index.ts`, name: nombre, verify_jwt: true }));
  for (const ruta of [...archivosDe(`${BEREA}/supabase/functions/${nombre}`), ...archivosDe(`${BEREA}/supabase/functions/_shared`)]) {
    formulario.append('file', new Blob([readFileSync(ruta)]), relative(BEREA, ruta).replace(/\\/g, '/'));
  }
  const r = await api('POST', `/v1/projects/${REF}/functions/deploy?slug=${nombre}`, undefined, formulario);
  console.log(`  función «${nombre}» subida (versión ${r.version}, estado ${r.status})`);
}

// ---------- 3. Clientes ----------
const llaves = await api('GET', `/v1/projects/${REF}/api-keys?reveal=true`);
const PUBLICA = llaves.find((k: { name: string }) => k.name === 'anon').api_key;
const admin = createClient(URL_P, llaves.find((k: { name: string }) => k.name === 'service_role').api_key, { auth: { persistSession: false, autoRefreshToken: false } });
const cliente = () => createClient(URL_P, PUBLICA, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------- 4. El banco vigente (10 capítulos) como versión 1 ----------
async function importarBanco() {
  const binario = new Uint8Array(readFileSync(`${BEREA}/contenido/publicado/contenido.bin`));
  const contenido = await abrirContenido(binario, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) });
  const leido = leerExcelBanco(readFileSync(`${BEREA}/contenido/excel/Banco_Preguntas_Patriarcas_y_Profetas.xlsx`), 'Banco_Preguntas_Patriarcas_y_Profetas.xlsx', LIBRO);
  const revisados = await revisarCapitulos(leido.capitulos, leido.capitulos, 'Patriarcas y Profetas');
  const publicados = new Map<number, string>();
  for (const c of contenido.libros[LIBRO].idiomas.es.capitulos) publicados.set(c.numero, await huellaCapitulo(capituloDelJuego(c)));
  await admin.from('capitulos').delete().eq('libro_id', LIBRO);
  for (const r of revisados) {
    const c = r.capitulo;
    const e1 = await admin.from('capitulos').insert({ libro_id: LIBRO, numero: c.numero, titulo: c.titulo, reflexion: c.reflexion, validacion: r.validacion, avisos: r.avisos, huella: r.huella, huella_publicada: publicados.get(c.numero) ?? null });
    const e2 = await admin.from('preguntas').insert(c.preguntas.map((p) => ({ ...p, libro_id: LIBRO, capitulo: c.numero })));
    if (e1.error || e2.error) throw e1.error ?? e2.error;
  }
  await sql(`delete from public.versiones where true`);
  await admin.from('versiones').insert({ numero: 1, version_juego: contenido.version, publicada_en: contenido.generado, capitulos: contenido.libros[LIBRO].idiomas.es.capitulos.map((c) => c.numero), mensaje: '', sha256: createHash('sha256').update(binario).digest('hex'), contenido });
  const deposito = admin.storage.from('contenido');
  const { data: viejos } = await deposito.list('versiones');
  if (viejos?.length) await deposito.remove(viejos.map((f) => `versiones/${f.name}`));
  for (const ruta of ['versiones/1.bin', 'contenido.bin']) {
    const { error } = await deposito.upload(ruta, binario, { contentType: 'application/octet-stream', cacheControl: '60', upsert: true });
    if (error) throw error;
  }
  return { contenido, revisados };
}
const URL_CONTENIDO = `${URL_P}/storage/v1/object/public/contenido/contenido.bin`;
async function bajarPublicado(): Promise<{ bytes: Uint8Array; contenido: Contenido | null }> {
  const r = await fetch(`${URL_CONTENIDO}?buscar=${Date.now()}`, { cache: 'no-store' });
  const bytes = new Uint8Array(await r.arrayBuffer());
  const contenido = r.ok ? await abrirContenido(bytes, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) }).catch(() => null) : null;
  return { bytes, contenido };
}

/** Deja todo como la primera vez para la autora: versión 1 publicada, banco vigente, sin códigos ni registro. */
async function limpiar() {
  console.log('== Limpieza ==');
  await admin.auth.admin.updateUserById(AUTORA, { password: FRASE, email: 'sharon@berea.invalid', email_confirm: true });
  const { data: factores } = await admin.auth.admin.mfa.listFactors({ userId: AUTORA });
  for (const f of factores?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ userId: AUTORA, id: f.id });
  const { contenido } = await importarBanco();
  await sql(`delete from privado.codigos_recuperacion where true; delete from privado.intentos_recuperacion where true; delete from privado.desafios where true; delete from public.registro where true;`);
  const final = await bajarPublicado();
  const { data: vs } = await admin.from('versiones').select('numero');
  const quedan = await admin.auth.admin.mfa.listFactors({ userId: AUTORA });
  console.log(`  versiones: ${vs?.map((v) => v.numero).join(', ')} · publicado = versión 1: ${final.contenido?.version === contenido.version} · códigos de 6 números de la autora: ${quedan.data?.factors.length} · registro vacío`);
}
if (process.argv.includes('--solo-limpiar')) {
  await limpiar();
  process.exit(0);
}

console.log('== Banco vigente → versión 1 ==');
const { contenido: v1, revisados } = await importarBanco();
comprobar('se importaron los 10 capítulos del Excel, sin errores', revisados.length === 10 && revisados.every((r) => r.validacion !== 'errores'));
const { data: estadoCaps } = await admin.from('capitulos').select('numero, huella, huella_publicada').eq('libro_id', LIBRO);
comprobar('los 10 quedan «Publicado» en la versión que tienen hoy los jugadores', estadoCaps?.length === 10 && estadoCaps.every((c) => c.huella === c.huella_publicada));

// ---------- 5. La autora con su código (un código de 6 números de prueba, que se borra al final) ----------
const autora = cliente();
let factorPrueba: string | null = null;
let secreto = '';
async function conCodigo(c: SupabaseClient) {
  const { data: ch } = await c.auth.mfa.challenge({ factorId: factorPrueba! });
  const { error } = await c.auth.mfa.verify({ factorId: factorPrueba!, challengeId: ch!.id, code: totp(secreto) });
  if (error) throw error;
}
async function funcion(c: SupabaseClient, nombre: string, cuerpo: Record<string, unknown>) {
  const { data, error } = await c.functions.invoke(nombre, { body: cuerpo });
  const detalle = error ? await (error as { context?: Response }).context?.json?.().catch(() => null) : null;
  return { data, error: error ? (detalle?.error ?? error.message) : null, estado: error ? (error as { context?: Response }).context?.status : 200 };
}

try {
  const { error } = await autora.auth.signInWithPassword({ email: 'sharon@berea.invalid', password: FRASE });
  if (error) throw error;
  const { data: f, error: e2 } = await autora.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Prueba P5-P6' });
  if (e2) throw e2;
  factorPrueba = f.id;
  secreto = f.totp.secret;
  await conCodigo(autora);

  // ---------- 6. P5 · Publicar ----------
  console.log('== P5 · Publicar ==');
  const sinCodigo = cliente();
  await sinCodigo.auth.signInWithPassword({ email: 'sharon@berea.invalid', password: FRASE });
  const r0 = await funcion(sinCodigo, 'publicar', { capitulos: [4], mensaje: '' });
  comprobar('sin el código de 6 números no se puede publicar', r0.estado === 403, r0.error ?? '');
  const anonimo = await funcion(cliente(), 'publicar', { capitulos: [4], mensaje: '' });
  comprobar('sin cuenta no se puede publicar', !!anonimo.error);

  // Una corrección en el capítulo 4 (pregunta 10, explicación), como en el diseño 07.
  const { data: p10 } = await autora.from('preguntas').select('orden, explicacion').eq('libro_id', LIBRO).eq('capitulo', 4).eq('numero', 10).single();
  await autora.from('preguntas').update({ explicacion: `${p10!.explicacion} (corrección de prueba)` }).eq('libro_id', LIBRO).eq('capitulo', 4).eq('orden', p10!.orden);
  const { data: filas4 } = await autora.from('preguntas').select('orden, numero, ronda, texto, opcion_a, opcion_b, opcion_c, correcta, explicacion, cita').eq('libro_id', LIBRO).eq('capitulo', 4);
  const { data: cab4 } = await autora.from('capitulos').select('titulo, reflexion').eq('libro_id', LIBRO).eq('numero', 4).single();
  await autora.from('capitulos').update({ huella: await huellaCapitulo({ numero: 4, titulo: cab4!.titulo, reflexion: cab4!.reflexion, preguntas: filas4! }) }).eq('libro_id', LIBRO).eq('numero', 4);

  const r1 = await funcion(autora, 'publicar', { capitulos: [4], mensaje: '¡Mensaje de prueba!' });
  comprobar('publicar una versión nueva (versión 2)', !r1.error && r1.data?.numero === 2, r1.error ?? `sha256 ${String(r1.data?.sha256).slice(0, 12)}…`);
  const pub2 = await bajarPublicado();
  const exp2 = pub2.contenido?.libros[LIBRO].idiomas.es.capitulos[3].preguntas.find((p) => p.id === 10)?.explicacion ?? '';
  comprobar('el archivo publicado lleva la firma de Berea (el juego lo abre) y la corrección', exp2.endsWith('(corrección de prueba)'));
  comprobar('su número interno es mayor que el de la versión 1', (pub2.contenido?.version ?? 0) > v1.version);
  comprobar('lleva el mensaje para los jugadores', pub2.contenido?.mensaje === '¡Mensaje de prueba!');
  const { data: c4 } = await autora.from('capitulos').select('huella, huella_publicada').eq('libro_id', LIBRO).eq('numero', 4).single();
  comprobar('el capítulo corregido vuelve a quedar «Publicado»', c4?.huella === c4?.huella_publicada);
  const conErrores = await funcion(autora, 'publicar', { capitulos: [12], mensaje: '' });
  comprobar('un capítulo que no está o salteado no se publica', !!conErrores.error, conErrores.error ?? '');

  const r2 = await funcion(autora, 'publicar', { volverA: 1 });
  comprobar('volver a la versión 1 la publica como versión 3', !r2.error && r2.data?.numero === 3, r2.error ?? '');
  const pub3 = await bajarPublicado();
  comprobar('la versión 3 tiene el contenido de la 1 con un número mayor que la 2', isDeepStrictEqual(pub3.contenido?.libros, v1.libros) && (pub3.contenido?.version ?? 0) > (pub2.contenido?.version ?? 0), `versión 3: ${pub3.contenido?.version} · versión 2: ${pub2.contenido?.version}`);
  const alterado = pub3.bytes.slice();
  alterado[alterado.length - 5] ^= 1;
  const abierto = await abrirContenido(alterado, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) }).then(() => true, () => false);
  comprobar('un archivo con la firma alterada es rechazado por el juego', !abierto);
  const falsificado = await empaquetarContenido(v1, { cifrado: deBase64(CLAVE_CIFRADO), firmaPrivada: ed.utils.randomPrivateKey() });
  comprobar('un archivo firmado con otra llave es rechazado por el juego', !(await abrirContenido(falsificado, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) }).then(() => true, () => false)));
  // Guardado para la prueba del juego en el navegador (flujo-p5.mjs).
  const { writeFileSync } = await import('node:fs');
  writeFileSync('C:/Users/reviv/AppData/Local/Temp/claude/c--Users-reviv-Desktop-ganso-typing/0b21747a-aa98-473f-8a2a-a3faaa7dc7b2/scratchpad/url-contenido.txt', URL_CONTENIDO);

  // ---------- 7. P6 · Sello ----------
  console.log('== P6 · Acciones con el sello ==');
  const privada = deHex(sello.privada);
  const otroSello = ed.utils.randomPrivateKey();
  const desafio = async (accion: AccionDelicada) => ((await autora.rpc('crear_desafio', { accion })).data as { id: string }).id;
  const firmar = async (id: string, accion: AccionDelicada, clave: Uint8Array) => aHex(await ed.signAsync(textoDelDesafio(id, accion), clave));
  const accion = async (a: AccionDelicada, id: string, firma: string, datos: Record<string, unknown> = {}) => funcion(autora, 'accion-delicada', { accion: a, desafio: id, firma, datos });

  for (const a of ACCIONES_DELICADAS) {
    const sinSello = await accion(a, await desafio(a), '');
    const otro = await accion(a, await desafio(a), await firmar(await desafio(a), a, otroSello)); // firma de otro desafío y otra clave
    const id = await desafio(a);
    const conOtro = await accion(a, id, await firmar(id, a, otroSello));
    const viejo = await desafio(a);
    await sql(`update privado.desafios set vence_en = now() - interval '1 minute' where id = '${viejo}'`);
    const conViejo = await accion(a, viejo, await firmar(viejo, a, privada));
    const deOtraAccion = await desafio(a === 'retirar' ? 'descargar_copia' : 'retirar');
    const cruzado = await accion(a, deOtraAccion, await firmar(deOtraAccion, a, privada));
    comprobar(`«${a}»: falla sin sello, con otro sello, con un desafío vencido o de otra acción`, [sinSello, otro, conOtro, conViejo, cruzado].every((r) => r.estado === 403));
  }

  // Funciona con el sello correcto (y un desafío repetido ya no sirve). Las que cambian algo se deshacen enseguida.
  const ok = async (a: AccionDelicada, datos: Record<string, unknown> = {}) => {
    const id = await desafio(a);
    const firma = await firmar(id, a, privada);
    const r = await accion(a, id, firma, datos);
    const repetido = await accion(a, id, firma, datos);
    return { r, repetido };
  };
  const copia = await ok('descargar_copia');
  comprobar('«descargar_copia» funciona con el sello y el desafío no sirve dos veces', !copia.r.error && copia.r.data?.archivo?.texto.includes('berea-copia-del-banco') && copia.repetido.estado === 403);
  const llave = await ok('descargar_llave');
  comprobar('«descargar_llave» devuelve la llave de siempre', llave.r.data?.archivo?.texto === LLAVE_TEXTO);
  const nueva = await ok('crear_llave');
  const nuevaPublica = JSON.parse(nueva.r.data?.archivo?.texto ?? '{}').publica;
  comprobar('«crear_llave» crea una llave distinta y no reemplaza la actual', !!nuevaPublica && nuevaPublica !== CLAVE_PUBLICA);
  comprobar('«pasar_proyecto» funciona con el sello', !(await ok('pasar_proyecto')).r.error);
  const codigos = await ok('ver_codigos');
  comprobar('«ver_codigos» da 10 códigos nuevos', codigos.r.data?.codigos?.length === 10);
  const usuario = await ok('cambiar_usuario', { usuario: 'sharonprueba' });
  const entraNuevo = await cliente().auth.signInWithPassword({ email: 'sharonprueba@berea.invalid', password: FRASE });
  comprobar('«cambiar_usuario» funciona (y se vuelve a «sharon»)', !usuario.r.error && !entraNuevo.error);
  await ok('cambiar_usuario', { usuario: 'sharon' });
  const clave = await ok('cambiar_contrasena', { contrasena: 'contraseña-de-prueba-123' });
  const entraClave = await cliente().auth.signInWithPassword({ email: 'sharon@berea.invalid', password: 'contraseña-de-prueba-123' });
  comprobar('«cambiar_contrasena» funciona (y se vuelve a la de la autora)', !clave.r.error && !entraClave.error);
  await admin.auth.admin.updateUserById(AUTORA, { password: FRASE, email: 'sharon@berea.invalid', email_confirm: true });
  const retirar = await ok('retirar');
  const tras = await fetch(`${URL_CONTENIDO}?buscar=${Date.now()}`, { cache: 'no-store' });
  comprobar('«retirar» quita el contenido publicado (el juego sigue con el que tiene)', !retirar.r.error && tras.status >= 400, retirar.r.error ?? `respuesta ${tras.status}`);
  const borrarLibro = await ok('borrar_libro');
  const { count: quedanLibro } = await admin.from('capitulos').select('*', { count: 'exact', head: true }).eq('libro_id', LIBRO);
  comprobar('«borrar_libro» borra los capítulos del libro', !borrarLibro.r.error && quedanLibro === 0, borrarLibro.r.error ?? `quedan ${quedanLibro}`);
  await importarBanco();
  const borrarBanco = await ok('borrar_banco');
  const { count: quedanBanco } = await admin.from('capitulos').select('*', { count: 'exact', head: true });
  comprobar('«borrar_banco» borra todo el banco', !borrarBanco.r.error && quedanBanco === 0, borrarBanco.r.error ?? `quedan ${quedanBanco}`);
  const { data: registro } = await admin.from('registro').select('accion, resultado').eq('accion', 'accion_delicada');
  comprobar('cada acción delicada, intentada o hecha, queda en el registro', (registro?.filter((r) => r.resultado === 'rechazado').length ?? 0) >= 50 && (registro?.filter((r) => r.resultado === 'hecho').length ?? 0) >= 9, `rechazadas ${registro?.filter((r) => r.resultado === 'rechazado').length} · hechas ${registro?.filter((r) => r.resultado === 'hecho').length}`);
} finally {
  // ---------- 8. Dejar todo limpio para la autora ----------
  await limpiar();
}

const fallos = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallos.length} de ${resultados.length} pruebas bien${fallos.length ? ' · FALLARON: ' + fallos.map((f) => f.nombre).join('; ') : ''}`);
