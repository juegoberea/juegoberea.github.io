// Empezar y terminar un capítulo, guardando lo que corresponde.
//
// El intento cuenta desde que se pulsa «Empezar»: se suma en ese momento y se anota como
// «intento en curso». Si el juego se cierra a mitad, al volver ese intento ya está contado
// y simplemente se descarta: se perdió y hay que empezar de nuevo.

import type { Capitulo } from '../contenido/tipos';
import type { Datos } from '../datos/base';
import { capituloDisponible, estaAprobado } from '../datos/progreso';
import type { Aleatorio } from './aleatorio';
import { Partida, type ResumenIntento } from './partida';
import { CORRECTAS_PARA_APROBAR, estrellasPorIntento } from './reglas';

export interface ResultadoCapitulo {
  aprobado: boolean;
  correctas: number;
  /** Cuántas correctas le faltaron para aprobar (0 si aprobó). */
  faltaron: number;
  /** Puntos ganados si aprobó (0 si no). */
  puntos: number;
  /** Estrellas ganadas si aprobó (0 si no). */
  estrellas: number;
  numeroIntento: number;
  /** true si el capítulo ya estaba aprobado: no se guardó nada. */
  practica: boolean;
  resumen: ResumenIntento;
}

/** Botón «Empezar»: crea la partida y, si no es práctica, cuenta el intento. */
export async function empezarCapitulo(
  datos: Datos,
  perfilId: string,
  libroId: string,
  capitulo: Capitulo,
  aleatorio?: Aleatorio,
): Promise<Partida> {
  const progreso = await datos.obtenerProgreso(perfilId, libroId);
  if (!capituloDisponible(progreso, capitulo.numero)) {
    throw new Error(`El capítulo ${capitulo.numero} todavía está bloqueado: aprueba el ${capitulo.numero - 1} para abrirlo.`);
  }

  const estado = progreso.capitulos[capitulo.numero];
  if (estado?.aprobado) {
    // Práctica: se juega igual, pero no cambia sus puntos, estrellas ni registro.
    return new Partida(capitulo, estado.aprobado.intento, true, aleatorio);
  }

  const numeroIntento = (estado?.intentos ?? 0) + 1;
  progreso.capitulos[capitulo.numero] = { ...estado, intentos: numeroIntento };
  progreso.intentoEnCurso = { capitulo: capitulo.numero, numeroIntento, inicio: new Date().toISOString() };
  await datos.guardarProgreso(progreso);
  return new Partida(capitulo, numeroIntento, false, aleatorio);
}

/** Al responder la última pregunta: guarda el resultado si aprobó (y no era práctica). */
export async function terminarCapitulo(datos: Datos, perfilId: string, libroId: string, partida: Partida): Promise<ResultadoCapitulo> {
  if (partida.estado !== 'terminada') throw new Error('La partida todavía no terminó.');

  const resumen = partida.resumen();
  const numero = partida.capitulo.numero;
  let aprobadoAhora = false;

  if (!partida.practica) {
    const progreso = await datos.obtenerProgreso(perfilId, libroId);
    if (progreso.intentoEnCurso?.capitulo === numero) delete progreso.intentoEnCurso;
    const estado = progreso.capitulos[numero] ?? { intentos: partida.numeroIntento };
    if (resumen.aprobado && !estaAprobado(progreso, numero)) {
      estado.aprobado = {
        puntos: partida.puntos,
        estrellas: estrellasPorIntento(partida.numeroIntento),
        intento: partida.numeroIntento,
        correctas: resumen.correctas,
        fecha: new Date().toISOString(),
      };
      aprobadoAhora = true;
    }
    progreso.capitulos[numero] = estado;
    await datos.guardarProgreso(progreso);
  }

  const gano = aprobadoAhora || (partida.practica && resumen.aprobado);
  return {
    aprobado: resumen.aprobado,
    correctas: resumen.correctas,
    faltaron: Math.max(0, CORRECTAS_PARA_APROBAR - resumen.correctas),
    puntos: gano ? partida.puntos : 0,
    estrellas: gano ? partida.estrellas : 0,
    numeroIntento: partida.numeroIntento,
    practica: partida.practica,
    resumen,
  };
}

/**
 * Al abrir el juego: si quedó un intento a medias (se cerró el juego), se descarta.
 * Ya estaba contado al empezar. Devuelve el capítulo del intento perdido, si había uno.
 */
export async function descartarIntentoInterrumpido(datos: Datos, perfilId: string, libroId: string): Promise<number | null> {
  const progreso = await datos.obtenerProgreso(perfilId, libroId);
  if (!progreso.intentoEnCurso) return null;
  const capitulo = progreso.intentoEnCurso.capitulo;
  delete progreso.intentoEnCurso;
  await datos.guardarProgreso(progreso);
  return capitulo;
}
