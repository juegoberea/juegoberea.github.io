import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Capitulo } from '../app/src/contenido/tipos';
import { Datos } from '../app/src/datos/base';
import { capituloActual, capituloDisponible, diarioOrdenado, totalPuntos } from '../app/src/datos/progreso';
import {
  abrirRespaldo,
  empaquetarRespaldo,
  ErrorRespaldo,
  exportarRespaldo,
  importarRespaldo,
  nombreArchivoRespaldo,
} from '../app/src/datos/respaldo';
import { aleatorioConSemilla } from '../app/src/motor/aleatorio';
import { cargarContenido } from '../app/src/motor/cargar-contenido';
import { empezarCapitulo, terminarCapitulo } from '../app/src/motor/capitulo';
import type { Partida } from '../app/src/motor/partida';

const LIBRO = 'patriarcas-y-profetas';
const BIN = new Uint8Array(readFileSync(resolve(__dirname, '../contenido/publicado/contenido.bin')));

let contador = 0;
const abrirBase = () => Datos.abrir(`prueba-datos-${++contador}`);

function jugarPerfecto(partida: Partida) {
  let t = 0;
  while (partida.estado !== 'terminada') {
    partida.mostrarPregunta(t);
    const p = partida.preguntaActual;
    const original = partida.capitulo.preguntas.find((o) => o.texto === p.texto)!;
    partida.responder(p.opciones.indexOf(original.opciones[original.correcta]), (t += 2000));
    partida.siguiente();
  }
}

async function aprobar(datos: Datos, perfilId: string, capitulo: Capitulo) {
  const partida = await empezarCapitulo(datos, perfilId, LIBRO, capitulo, aleatorioConSemilla(capitulo.numero));
  jugarPerfecto(partida);
  return terminarCapitulo(datos, perfilId, LIBRO, partida);
}

describe('perfiles', () => {
  it('varios perfiles con nombre y color; sin otros datos', async () => {
    const datos = await abrirBase();
    await datos.crearPerfil('  Joshua  ', 'turquesa');
    await datos.crearPerfil('María', 'morado');
    const perfiles = await datos.listarPerfiles();
    expect(perfiles.map((p) => [p.nombre, p.color])).toEqual([
      ['Joshua', 'turquesa'],
      ['María', 'morado'],
    ]);
    expect(Object.keys(perfiles[0]).sort()).toEqual(['ajustes', 'color', 'creado', 'id', 'nombre']);
    expect(perfiles[0].ajustes).toEqual({ letra: 'normal', sonidos: true, musica: false });
  });

  it('rechaza nombre vacío y colores desconocidos', async () => {
    const datos = await abrirBase();
    await expect(datos.crearPerfil('   ', 'azul')).rejects.toThrow('nombre');
    await expect(datos.crearPerfil('Ana', 'verde' as never)).rejects.toThrow('Color');
  });

  it('guarda los ajustes de cada perfil por separado', async () => {
    const datos = await abrirBase();
    const a = await datos.crearPerfil('Ana', 'rojo');
    const b = await datos.crearPerfil('Beto', 'azul');
    await datos.guardarAjustes(a.id, { letra: 'muyGrande', sonidos: false, musica: true });
    expect((await datos.obtenerPerfil(a.id))!.ajustes).toEqual({ letra: 'muyGrande', sonidos: false, musica: true });
    expect((await datos.obtenerPerfil(b.id))!.ajustes.letra).toBe('normal');
  });

  it('el avance de cada perfil y de cada libro va por separado', async () => {
    const datos = await abrirBase();
    const capitulos = (await cargarContenido(BIN)).libros[LIBRO].idiomas.es.capitulos;
    const a = await datos.crearPerfil('Ana', 'rojo');
    const b = await datos.crearPerfil('Beto', 'azul');
    await aprobar(datos, a.id, capitulos[0]);
    expect(totalPuntos(await datos.obtenerProgreso(a.id, LIBRO))).toBe(2000);
    expect(totalPuntos(await datos.obtenerProgreso(b.id, LIBRO))).toBe(0);
    expect(totalPuntos(await datos.obtenerProgreso(a.id, 'profetas-y-reyes'))).toBe(0);
  });
});

describe('Mi diario', () => {
  it('guarda las reflexiones por capítulo; las vacías no se guardan', async () => {
    const datos = await abrirBase();
    const p = await datos.crearPerfil('Ana', 'rojo');
    await datos.guardarReflexion(p.id, LIBRO, 4, '  Que valgo muchísimo.  ');
    await datos.guardarReflexion(p.id, LIBRO, 1, 'Por amor.');
    await datos.guardarReflexion(p.id, LIBRO, 2, '   ');
    const diario = diarioOrdenado(await datos.obtenerProgreso(p.id, LIBRO));
    expect(diario.map((r) => [r.capitulo, r.texto])).toEqual([
      [1, 'Por amor.'],
      [4, 'Que valgo muchísimo.'],
    ]);
  });
});

describe('actualizar el contenido', () => {
  it('nunca borra el avance; si cambia una pregunta de un capítulo aprobado, se conservan sus puntos', async () => {
    const datos = await abrirBase();
    const p = await datos.crearPerfil('Ana', 'rojo');
    const viejo = (await cargarContenido(BIN)).libros[LIBRO].idiomas.es.capitulos;
    await aprobar(datos, p.id, viejo[0]);
    await aprobar(datos, p.id, viejo[1]);
    await datos.guardarReflexion(p.id, LIBRO, 1, 'Mi reflexión');
    const antes = await datos.obtenerProgreso(p.id, LIBRO);

    // Llega un contenido nuevo: la autora corrigió una pregunta del capítulo 1 y agregó el 11.
    const nuevo = (await cargarContenido(BIN)).libros[LIBRO].idiomas.es.capitulos;
    nuevo[0].preguntas[0] = { ...nuevo[0].preguntas[0], texto: 'Pregunta corregida', opciones: ['Uno', 'Dos', 'Tres'] };
    nuevo.push({ ...nuevo[9], numero: 11, titulo: 'Capítulo nuevo' });

    const despues = await datos.obtenerProgreso(p.id, LIBRO);
    expect(despues).toEqual(antes);
    expect(totalPuntos(despues)).toBe(4000);
    expect(capituloActual(despues, nuevo.length)).toBe(3);
    expect(capituloDisponible(despues, 3)).toBe(true);
    // El capítulo 1 corregido se puede practicar sin cambiar sus puntos.
    const practica = await empezarCapitulo(datos, p.id, LIBRO, nuevo[0]);
    expect(practica.practica).toBe(true);
  });
});

describe('copia de respaldo', () => {
  async function perfilConAvance() {
    const datos = await abrirBase();
    const capitulos = (await cargarContenido(BIN)).libros[LIBRO].idiomas.es.capitulos;
    const p = await datos.crearPerfil('Joshua', 'turquesa');
    await datos.guardarAjustes(p.id, { letra: 'grande', sonidos: true, musica: false });
    await aprobar(datos, p.id, capitulos[0]);
    await datos.guardarReflexion(p.id, LIBRO, 1, 'Por amor.');
    await empezarCapitulo(datos, p.id, LIBRO, capitulos[1]); // intento a medias
    return { datos, perfil: (await datos.obtenerPerfil(p.id))! };
  }

  it('se guarda y se recupera en otro aparato', async () => {
    const { datos, perfil } = await perfilConAvance();
    const archivo = await exportarRespaldo(datos, [perfil.id]);
    expect(new TextDecoder().decode(archivo)).not.toContain('Joshua');

    const otroAparato = await abrirBase();
    const recuperados = await importarRespaldo(otroAparato, archivo);
    expect(recuperados.map((p) => p.nombre)).toEqual(['Joshua']);
    expect(await otroAparato.obtenerPerfil(perfil.id)).toEqual(perfil);

    const original = await datos.obtenerProgreso(perfil.id, LIBRO);
    const copia = await otroAparato.obtenerProgreso(perfil.id, LIBRO);
    const { intentoEnCurso: _, ...sinIntento } = original;
    expect(copia).toEqual(sinIntento);
    expect(totalPuntos(copia)).toBe(2000);
    expect(diarioOrdenado(copia)[0].texto).toBe('Por amor.');
  });

  it('al recuperar, reemplaza el avance del mismo perfil en este aparato', async () => {
    const { datos, perfil } = await perfilConAvance();
    const archivo = await exportarRespaldo(datos, [perfil.id]);
    await datos.guardarProgreso({ perfilId: perfil.id, libroId: LIBRO, capitulos: {}, diario: {} });
    await importarRespaldo(datos, archivo);
    expect(totalPuntos(await datos.obtenerProgreso(perfil.id, LIBRO))).toBe(2000);
  });

  it('rechaza una copia alterada', async () => {
    const { datos, perfil } = await perfilConAvance();
    const archivo = await exportarRespaldo(datos, [perfil.id]);
    for (const pos of [6, 40, archivo.length - 1]) {
      const alterado = archivo.slice();
      alterado[pos] ^= 0x01;
      await expect(importarRespaldo(await abrirBase(), alterado)).rejects.toMatchObject({ motivo: 'alterado' });
    }
  });

  it('rechaza una copia con puntos inventados aunque esté bien cifrada', async () => {
    const { datos, perfil } = await perfilConAvance();
    const respaldo = await abrirRespaldo(await exportarRespaldo(datos, [perfil.id]));
    const trucado = structuredClone(respaldo);
    trucado.perfiles[0].progresos[0].capitulos[1].aprobado!.puntos = 5000;
    await expect(abrirRespaldo(await empaquetarRespaldo(trucado))).rejects.toBeInstanceOf(ErrorRespaldo);

    const estrellas = structuredClone(respaldo);
    estrellas.perfiles[0].progresos[0].capitulos[1].aprobado!.intento = 2; // 2.º intento con 100 por correcta
    await expect(abrirRespaldo(await empaquetarRespaldo(estrellas))).rejects.toMatchObject({ motivo: 'alterado' });
  });

  it('rechaza archivos que no son copias de Berea', async () => {
    await expect(abrirRespaldo(new TextEncoder().encode('hola, esto no es una copia de nada'))).rejects.toMatchObject({ motivo: 'formato' });
  });

  it('sugiere un nombre de archivo legible', () => {
    expect(nombreArchivoRespaldo('María José', new Date('2026-11-03T10:00:00Z'))).toBe('Berea-Maria-Jose-2026-11-03.berea');
  });
});
