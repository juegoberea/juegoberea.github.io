import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Capitulo, Contenido } from '../app/src/contenido/tipos';
import { Datos } from '../app/src/datos/base';
import { capituloActual, capituloDisponible, capitulosAprobados, totalEstrellas, totalPuntos } from '../app/src/datos/progreso';
import { aleatorioConSemilla } from '../app/src/motor/aleatorio';
import { cargarContenido, ErrorContenido } from '../app/src/motor/cargar-contenido';
import { descartarIntentoInterrumpido, empezarCapitulo, terminarCapitulo } from '../app/src/motor/capitulo';
import { Partida, type PreguntaEnJuego } from '../app/src/motor/partida';
import { bonoPorRespuesta, estrellasMaximasLibro, puntosMaximosLibro } from '../app/src/motor/reglas';

const LIBRO = 'patriarcas-y-profetas';
const BIN = new Uint8Array(readFileSync(resolve(__dirname, '../contenido/publicado/contenido.bin')));

let contenido: Contenido;
let capitulos: Capitulo[];
beforeAll(async () => {
  contenido = await cargarContenido(BIN);
  capitulos = contenido.libros[LIBRO].idiomas.es.capitulos;
});

let contadorBases = 0;
const abrirBase = () => Datos.abrir(`prueba-motor-${++contadorBases}`);

/** Posición de la opción correcta en el orden mezclado (las pruebas sí la conocen). */
function opcionCorrecta(capitulo: Capitulo, p: PreguntaEnJuego): number {
  const original = capitulo.preguntas.find((o) => o.texto === p.texto)!;
  return p.opciones.indexOf(original.opciones[original.correcta]);
}

/**
 * Juega la partida entera respondiendo bien las primeras `correctas` preguntas y mal las
 * demás. Cada pregunta se responde a los 5 s. Devuelve el reloj final.
 */
function jugar(partida: Partida, correctas: number, inicio = 0): number {
  let ahora = inicio;
  while (partida.estado !== 'terminada') {
    if (partida.empiezaRonda) ahora += 2500; // pantalla de cambio de ronda
    partida.mostrarPregunta(ahora);
    ahora += 5000;
    const buena = opcionCorrecta(partida.capitulo, partida.preguntaActual);
    partida.responder(partida.indice < correctas ? buena : (buena + 1) % 3, ahora);
    partida.siguiente();
  }
  return ahora;
}

async function intentar(datos: Datos, perfilId: string, numero: number, correctas: number, semilla = 1) {
  const partida = await empezarCapitulo(datos, perfilId, LIBRO, capitulos[numero - 1], aleatorioConSemilla(semilla));
  jugar(partida, correctas);
  return terminarCapitulo(datos, perfilId, LIBRO, partida);
}

describe('reglas', () => {
  it('bonos y máximos del libro', () => {
    expect([1, 2, 3, 4].map(bonoPorRespuesta)).toEqual([40, 20, 0, 0]);
    expect(puntosMaximosLibro(73)).toBe(146000);
    expect(estrellasMaximasLibro(73)).toBe(219);
  });
});

describe('contenido', () => {
  it('carga el contenido.bin publicado: 10 capítulos', () => {
    expect(capitulos).toHaveLength(10);
  });

  it('rechaza un contenido alterado', async () => {
    const alterado = BIN.slice();
    alterado[200] ^= 0xff;
    await expect(cargarContenido(alterado)).rejects.toBeInstanceOf(ErrorContenido);
    await expect(cargarContenido(alterado)).rejects.toMatchObject({ motivo: 'alterado' });
  });
});

describe('armar el intento', () => {
  it('mantiene las rondas en orden y mezcla dentro de cada ronda', () => {
    const cap = capitulos[3];
    const a = new Partida(cap, 1, false, aleatorioConSemilla(1));
    const b = new Partida(cap, 1, false, aleatorioConSemilla(2));
    for (const partida of [a, b]) {
      expect(partida.preguntas.map((p) => p.ronda)).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4]);
      for (const ronda of [1, 2, 3, 4]) {
        const enJuego = partida.preguntas.filter((p) => p.ronda === ronda).map((p) => p.texto).sort();
        const originales = cap.preguntas.filter((p) => p.ronda === ronda).map((p) => p.texto).sort();
        expect(enJuego).toEqual(originales);
      }
      partida.preguntas.forEach((p) => {
        const original = cap.preguntas.find((o) => o.texto === p.texto)!;
        expect([...p.opciones].sort()).toEqual([...original.opciones].sort());
      });
    }
    expect(a.preguntas.map((p) => p.texto)).not.toEqual(b.preguntas.map((p) => p.texto));
    expect(a.preguntas.map((p) => p.opciones.join('|'))).not.toEqual(b.preguntas.map((p) => p.opciones.join('|')));
  });

  it('las opciones cambian de letra entre intentos, pero la correcta se sigue por su texto', () => {
    const cap = capitulos[0];
    const letras = new Set<number>();
    for (let semilla = 1; semilla <= 12; semilla++) {
      const partida = new Partida(cap, 1, false, aleatorioConSemilla(semilla));
      partida.mostrarPregunta(0);
      const buena = opcionCorrecta(cap, partida.preguntaActual);
      letras.add(buena);
      expect(partida.responder(buena, 1000).tipo).toBe('correcta');
    }
    expect(letras.size).toBeGreaterThan(1);
  });
});

describe('corrección', () => {
  it('acierto: «Correcto», puntos, explicación y cita', () => {
    const cap = capitulos[3];
    const partida = new Partida(cap, 1, false, aleatorioConSemilla(7));
    partida.mostrarPregunta(0);
    const original = cap.preguntas.find((o) => o.texto === partida.preguntaActual.texto)!;
    const r = partida.responder(opcionCorrecta(cap, partida.preguntaActual), 3000);
    expect(r).toEqual({ tipo: 'correcta', opcion: expect.any(Number), puntos: 100, explicacion: original.explicacion, cita: original.cita });
    expect(partida.puntos).toBe(100);
  });

  it('error: solo «Incorrecto», nunca la correcta', () => {
    const cap = capitulos[3];
    const partida = new Partida(cap, 1, false, aleatorioConSemilla(7));
    partida.mostrarPregunta(0);
    const mala = (opcionCorrecta(cap, partida.preguntaActual) + 1) % 3;
    const r = partida.responder(mala, 3000);
    expect(r).toEqual({ tipo: 'incorrecta', opcion: mala });
    expect(Object.keys(partida.ultimoResultado!).sort()).toEqual(['opcion', 'tipo']);
    expect(partida.puntos).toBe(0);
  });

  it('el resumen marca correcta, incorrecta y sin respuesta, sin mostrar la clave', () => {
    const cap = capitulos[3];
    const partida = new Partida(cap, 1, false, aleatorioConSemilla(3));
    let ahora = 0;
    for (let i = 0; i < 20; i++) {
      partida.mostrarPregunta(ahora);
      const buena = opcionCorrecta(cap, partida.preguntaActual);
      if (i === 9) partida.actualizar((ahora += 30000));
      else partida.responder(i === 14 ? (buena + 1) % 3 : buena, (ahora += 4000));
      partida.siguiente();
    }
    const resumen = partida.resumen();
    expect(resumen.correctas).toBe(18);
    expect(resumen.preguntas[9].estado).toBe('sin-respuesta');
    expect(resumen.preguntas[14].estado).toBe('incorrecta');
    expect(resumen.preguntas.filter((p) => p.estado === 'correcta')).toHaveLength(18);
    expect(Object.keys(resumen.preguntas[0]).sort()).toEqual(['estado', 'numero', 'ronda', 'texto']);
  });
});

describe('reloj de 30 segundos', () => {
  it('arranca al mostrar la pregunta y llega a 0: «Se acabó el tiempo», cuenta como incorrecta', () => {
    const partida = new Partida(capitulos[0], 1, false, aleatorioConSemilla(1));
    partida.mostrarPregunta(10_000);
    expect(partida.segundosRestantes(10_000)).toBe(30);
    expect(partida.segundosRestantes(25_500)).toBe(15);
    expect(partida.actualizar(39_999)).toBeNull();
    expect(partida.segundosRestantes(39_999)).toBe(1);
    expect(partida.actualizar(40_000)).toEqual({ tipo: 'tiempo' });
    expect(partida.estado).toBe('respondida');
    expect(partida.segundosRestantes(50_000)).toBe(0);
    expect(partida.resumen().preguntas[0].estado).toBe('sin-respuesta');
    expect(partida.correctas).toBe(0);
  });

  it('una respuesta que llega tarde cuenta como tiempo agotado', () => {
    const partida = new Partida(capitulos[0], 1, false, aleatorioConSemilla(1));
    partida.mostrarPregunta(0);
    const buena = opcionCorrecta(capitulos[0], partida.preguntaActual);
    expect(partida.responder(buena, 30_500)).toEqual({ tipo: 'tiempo' });
    expect(partida.correctas).toBe(0);
  });

  it('se detiene al responder', () => {
    const partida = new Partida(capitulos[0], 1, false, aleatorioConSemilla(1));
    partida.mostrarPregunta(0);
    partida.responder(0, 16_000);
    expect(partida.segundosRestantes(16_000)).toBe(14);
    expect(partida.segundosRestantes(90_000)).toBe(14);
    expect(partida.actualizar(90_000)).toBeNull();
  });

  it('no corre durante el cambio de ronda: la siguiente pregunta arranca recién al aparecer', () => {
    const partida = new Partida(capitulos[0], 1, false, aleatorioConSemilla(1));
    let ahora = 0;
    for (let i = 0; i < 6; i++) {
      partida.mostrarPregunta(ahora);
      partida.responder(0, (ahora += 1000));
      partida.siguiente();
    }
    expect(partida.indice).toBe(6);
    expect(partida.empiezaRonda).toBe(true);
    expect(partida.preguntaActual.ronda).toBe(2);
    // Pasan 2,5 s de cambio de ronda (y aunque pasaran 5 minutos) sin que corra el reloj.
    expect(partida.segundosRestantes(ahora + 300_000)).toBe(30);
    expect(partida.actualizar(ahora + 300_000)).toBeNull();
    partida.mostrarPregunta(ahora + 2_500);
    expect(partida.segundosRestantes(ahora + 2_500)).toBe(30);
    expect(partida.segundosRestantes(ahora + 12_500)).toBe(20);
  });

  it('no se puede responder dos veces ni saltarse pasos', () => {
    const partida = new Partida(capitulos[0], 1, false, aleatorioConSemilla(1));
    expect(() => partida.responder(0, 0)).toThrow();
    partida.mostrarPregunta(0);
    partida.responder(0, 1000);
    expect(() => partida.responder(1, 1500)).toThrow();
    expect(() => partida.mostrarPregunta(2000)).toThrow();
  });
});

describe('aprobar, puntos y estrellas', () => {
  it('aprueba en el 1.er intento: 100 por correcta y 3 estrellas', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Joshua', 'turquesa');
    const r = await intentar(datos, perfil.id, 1, 17);
    expect(r).toMatchObject({ aprobado: true, correctas: 17, puntos: 1700, estrellas: 3, numeroIntento: 1, practica: false, faltaron: 0 });
    const progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(progreso.capitulos[1]).toMatchObject({ intentos: 1, aprobado: { puntos: 1700, estrellas: 3, intento: 1, correctas: 17 } });
    expect(progreso.intentoEnCurso).toBeUndefined();
    expect(capituloDisponible(progreso, 2)).toBe(true);
    expect(capituloActual(progreso)).toBe(2);
  });

  it('aprueba en el 2.º intento: 80 por correcta y 2 estrellas', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('María', 'morado');
    expect((await intentar(datos, perfil.id, 1, 12)).aprobado).toBe(false);
    const r = await intentar(datos, perfil.id, 1, 19, 2);
    expect(r).toMatchObject({ aprobado: true, puntos: 1520, estrellas: 2, numeroIntento: 2 });
    const progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(progreso.capitulos[1]).toMatchObject({ intentos: 2, aprobado: { puntos: 1520, estrellas: 2, intento: 2 } });
  });

  it('aprueba en el 3.er intento (y en adelante): 60 por correcta y 1 estrella', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Papá', 'naranja');
    await intentar(datos, perfil.id, 1, 5);
    await intentar(datos, perfil.id, 1, 13, 2);
    const r = await intentar(datos, perfil.id, 1, 20, 3);
    expect(r).toMatchObject({ aprobado: true, puntos: 1200, estrellas: 1, numeroIntento: 3 });

    // Capítulo 2 aprobado al 4.º intento: también 60 y 1 estrella.
    for (let i = 0; i < 3; i++) await intentar(datos, perfil.id, 2, 10, 10 + i);
    expect(await intentar(datos, perfil.id, 2, 18, 20)).toMatchObject({ puntos: 1080, estrellas: 1, numeroIntento: 4 });

    const progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(totalPuntos(progreso)).toBe(2280);
    expect(totalEstrellas(progreso)).toBe(2);
    expect(capitulosAprobados(progreso).map((c) => [c.capitulo, c.intento])).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it('con 13 correctas no aprueba y el siguiente sigue bloqueado', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Sofi', 'azul');
    const r = await intentar(datos, perfil.id, 1, 13);
    expect(r).toMatchObject({ aprobado: false, correctas: 13, faltaron: 1, puntos: 0, estrellas: 0 });
    const progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(progreso.capitulos[1]).toEqual({ intentos: 1 });
    expect(capituloDisponible(progreso, 2)).toBe(false);
    await expect(empezarCapitulo(datos, perfil.id, LIBRO, capitulos[1])).rejects.toThrow('bloqueado');
  });

  it('con 14 correctas aprueba justo', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Ana', 'rojo');
    expect(await intentar(datos, perfil.id, 1, 14)).toMatchObject({ aprobado: true, puntos: 1400 });
  });
});

describe('intentos', () => {
  it('cerrar el juego a mitad de capítulo pierde el intento y cuenta como intento', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Joshua', 'turquesa');

    const partida = await empezarCapitulo(datos, perfil.id, LIBRO, capitulos[0], aleatorioConSemilla(1));
    for (let i = 0; i < 5; i++) {
      partida.mostrarPregunta(i * 10_000);
      partida.responder(opcionCorrecta(capitulos[0], partida.preguntaActual), i * 10_000 + 3000);
      partida.siguiente();
    }
    // Se cierra el juego: la partida se pierde sin llamar a terminarCapitulo.
    let progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(progreso.capitulos[1]).toEqual({ intentos: 1 });
    expect(progreso.intentoEnCurso).toMatchObject({ capitulo: 1, numeroIntento: 1 });

    // Al volver a abrir el juego.
    expect(await descartarIntentoInterrumpido(datos, perfil.id, LIBRO)).toBe(1);
    expect(await descartarIntentoInterrumpido(datos, perfil.id, LIBRO)).toBeNull();
    progreso = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(progreso.intentoEnCurso).toBeUndefined();
    expect(progreso.capitulos[1]).toEqual({ intentos: 1 });

    // El siguiente intento es el 2.º: 80 por correcta y 2 estrellas.
    expect(await intentar(datos, perfil.id, 1, 20, 5)).toMatchObject({ numeroIntento: 2, puntos: 1600, estrellas: 2 });
  });

  it('empezar otro intento sin terminar el anterior también lo cuenta', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Leo', 'indigo');
    await empezarCapitulo(datos, perfil.id, LIBRO, capitulos[0]);
    const segunda = await empezarCapitulo(datos, perfil.id, LIBRO, capitulos[0]);
    expect(segunda.numeroIntento).toBe(2);
    expect((await datos.obtenerProgreso(perfil.id, LIBRO)).capitulos[1].intentos).toBe(2);
  });

  it('repetir un capítulo aprobado es práctica: no cambia puntos, estrellas ni registro', async () => {
    const datos = await abrirBase();
    const perfil = await datos.crearPerfil('Joshua', 'turquesa');
    await intentar(datos, perfil.id, 1, 13);
    await intentar(datos, perfil.id, 1, 16, 2);
    const antes = await datos.obtenerProgreso(perfil.id, LIBRO);
    expect(antes.capitulos[1]).toMatchObject({ intentos: 2, aprobado: { puntos: 1280, estrellas: 2, intento: 2 } });

    const mejor = await intentar(datos, perfil.id, 1, 20, 3);
    expect(mejor).toMatchObject({ practica: true, aprobado: true });
    const peor = await intentar(datos, perfil.id, 1, 3, 4);
    expect(peor).toMatchObject({ practica: true, aprobado: false });
    const cerrada = await empezarCapitulo(datos, perfil.id, LIBRO, capitulos[0]);
    expect(cerrada.practica).toBe(true);

    expect(await datos.obtenerProgreso(perfil.id, LIBRO)).toEqual(antes);
  });
});
