// Publicar una versión: arma contenido.bin con los capítulos marcados (o vuelve a una versión
// anterior), lo comprime, lo cifra y lo FIRMA con la llave de Berea, que solo existe aquí como
// secreto del servidor (BEREA_CLAVE_FIRMA). Lo sube a Storage, donde lo busca el juego.
//   { capitulos: number[], mensaje: string }   o   { volverA: number }

import { leerArchivoClave } from '../_shared/generado/clave-firma.ts';
import { armarVersion, capituloAlJuego, capituloDelJuego, huellaCapitulo, type CapituloBanco, type FilaPregunta } from '../_shared/generado/banco.ts';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../_shared/generado/claves.ts';
import { deBase64 } from '../_shared/generado/codificacion.ts';
import { empaquetarContenido } from '../_shared/generado/formato.ts';
import type { Contenido } from '../_shared/generado/tipos.ts';
import { anotar, comprobarAutora, json, LIBRO, Rechazo, servir, sha256Hex } from '../_shared/servidor.ts';

const listaCapitulos = (ns: number[]) => {
  const o = [...ns].sort((a, b) => a - b);
  return o.length && o.every((n, i) => n === o[0] + i) ? `capítulos ${o[0]} a ${o[o.length - 1]}` : `capítulos ${o.join(', ')}`;
};

servir(async (pedido) => {
  const l = await comprobarAutora(pedido);
  const cuerpo = (await pedido.json().catch(() => ({}))) as { capitulos?: unknown; mensaje?: unknown; volverA?: unknown };
  const { admin } = l;

  const { data: ultima } = await admin.from('versiones').select('numero, version_juego').order('numero', { ascending: false }).limit(1).maybeSingle();
  const numero = (ultima?.numero ?? 0) + 1;
  // El número que compara el juego siempre crece, aunque se vuelva a una versión vieja.
  const versionJuego = Math.max(Date.now(), (ultima?.version_juego ?? 0) + 1);
  const generado = new Date().toISOString();

  let contenido: Contenido;
  let mensaje: string;
  let vuelveA: number | null = null;
  let incluidos: number[];

  if (cuerpo.volverA !== undefined) {
    vuelveA = Number(cuerpo.volverA);
    const { data: vieja } = await admin.from('versiones').select('contenido, mensaje').eq('numero', vuelveA).maybeSingle();
    if (!vieja) throw new Rechazo(`No existe la versión ${vuelveA}.`);
    mensaje = vieja.mensaje ?? '';
    contenido = { ...(vieja.contenido as Contenido), version: versionJuego, generado };
    incluidos = [];
  } else {
    incluidos = Array.isArray(cuerpo.capitulos) ? [...new Set(cuerpo.capitulos.map(Number))].filter((n) => Number.isInteger(n) && n > 0) : [];
    if (!incluidos.length) throw new Rechazo('Marca al menos un capítulo para publicar.');
    mensaje = typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje.slice(0, 300) : '';
    const [{ data: libro }, { data: filas }, { data: preguntas }, { data: vigente }] = await Promise.all([
      admin.from('libros').select('id, titulo, idioma').eq('id', LIBRO).single(),
      admin.from('capitulos').select('numero, titulo, reflexion, validacion').eq('libro_id', LIBRO).in('numero', incluidos),
      admin.from('preguntas').select('capitulo, orden, numero, ronda, texto, opcion_a, opcion_b, opcion_c, correcta, explicacion, cita').eq('libro_id', LIBRO).in('capitulo', incluidos).limit(10000),
      admin.from('versiones').select('contenido').is('retirada_en', null).order('numero', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!libro || !filas) throw new Rechazo('No se pudo leer el banco.');
    for (const n of incluidos) {
      const fila = filas.find((f) => f.numero === n);
      if (!fila) throw new Rechazo(`El capítulo ${n} no está en el banco.`);
      if (fila.validacion === 'errores') throw new Rechazo(`El capítulo ${n} tiene errores: corrígelo antes de publicar.`);
    }
    const capitulos: CapituloBanco[] = filas.map((f) => ({
      numero: f.numero,
      titulo: f.titulo,
      reflexion: f.reflexion,
      preguntas: (preguntas ?? []).filter((p) => p.capitulo === f.numero).map(({ capitulo: _, ...p }) => p as FilaPregunta),
    }));
    try {
      contenido = armarVersion({ anterior: (vigente?.contenido as Contenido | undefined) ?? null, libro, capitulos, version: versionJuego, generado, mensaje });
    } catch (e) {
      throw new Rechazo((e as Error).message);
    }
  }

  // Última revisión: cada capítulo que se va a firmar cumple las reglas del juego.
  const enLibro = contenido.libros[LIBRO]?.idiomas.es?.capitulos ?? [];
  for (const c of enLibro) capituloAlJuego(capituloDelJuego(c));

  const llave = await leerArchivoClave(Deno.env.get('BEREA_CLAVE_FIRMA') ?? '', CLAVE_PUBLICA);
  const archivo = await empaquetarContenido(contenido, { cifrado: deBase64(CLAVE_CIFRADO), firmaPrivada: llave });
  const sha256 = await sha256Hex(archivo);

  const deposito = admin.storage.from('contenido');
  const opciones = { contentType: 'application/octet-stream', cacheControl: '60', upsert: true };
  for (const ruta of [`versiones/${numero}.bin`, 'contenido.bin']) {
    const { error } = await deposito.upload(ruta, archivo, opciones);
    if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
  }

  const todos = enLibro.map((c) => c.numero);
  const { error: errorVersion } = await admin.from('versiones').insert({ numero, version_juego: versionJuego, capitulos: todos, mensaje, sha256, contenido, vuelve_a: vuelveA });
  if (errorVersion) throw new Error(errorVersion.message);
  // Lo que ahora tienen los jugadores: cada capítulo queda «publicado» si el banco no cambió desde entonces.
  for (const c of enLibro) {
    await admin.from('capitulos').update({ huella_publicada: await huellaCapitulo(capituloDelJuego(c)) }).eq('libro_id', LIBRO).eq('numero', c.numero);
  }

  await anotar(l, 'version_publicada', vuelveA
    ? `Versión ${numero} = versión ${vuelveA} · ${listaCapitulos(todos)} · firmada automáticamente`
    : `Versión ${numero} · ${listaCapitulos(incluidos)} · firmada automáticamente`);
  return json({ numero, sha256, capitulos: todos, tamano: archivo.length });
});
