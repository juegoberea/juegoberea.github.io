// Un intento de un capítulo: 20 preguntas mezcladas, reloj de 30 s y corrección.
//
// La partida no lee el reloj del aparato: cada método recibe `ahora` (en milisegundos,
// por ejemplo performance.now()). Así las pruebas pueden simular el paso del tiempo y la
// pantalla decide cuándo arranca el reloj de cada pregunta.
//
// Estados de cada pregunta:
//   «antes-de-pregunta» → el reloj NO corre (aquí va la pantalla de cambio de ronda).
//   «pregunta»          → la pregunta está a la vista y el reloj corre.
//   «respondida»        → correcta, incorrecta o se acabó el tiempo; el reloj queda detenido.
//   «terminada»         → ya se respondieron todas.

import { RONDAS, type Capitulo, type NumeroRonda, type Pregunta } from '../contenido/tipos';
import { mezclar, type Aleatorio } from './aleatorio';
import { CORRECTAS_PARA_APROBAR, SEGUNDOS_POR_PREGUNTA, estrellasPorIntento, puntosPorCorrecta } from './reglas';

const DURACION_MS = SEGUNDOS_POR_PREGUNTA * 1000;

export type EstadoPartida = 'antes-de-pregunta' | 'pregunta' | 'respondida' | 'terminada';
export type EstadoRespuesta = 'correcta' | 'incorrecta' | 'sin-respuesta';

export interface PreguntaEnJuego {
  /** Posición en este intento: 1 a 20. */
  numero: number;
  ronda: NumeroRonda;
  texto: string;
  /** Las 3 opciones en el orden mezclado de este intento (se muestran como A, B y C). */
  opciones: string[];
}

/**
 * Lo que ve el jugador al responder. A propósito, «incorrecta» y «tiempo» NO dicen cuál
 * era la correcta.
 */
export type Resultado =
  | { tipo: 'correcta'; opcion: number; puntos: number; explicacion: string; cita: string }
  | { tipo: 'incorrecta'; opcion: number }
  | { tipo: 'tiempo' };

export interface ResumenIntento {
  /** En el orden en que se jugaron. Nunca incluye la respuesta correcta. */
  preguntas: { numero: number; ronda: NumeroRonda; texto: string; estado: EstadoRespuesta }[];
  correctas: number;
  aprobado: boolean;
}

export class Partida {
  readonly preguntas: readonly PreguntaEnJuego[];
  /** Puntos que vale cada correcta en este intento (100, 80 o 60). */
  readonly puntosPorCorrecta: number;

  private readonly originales: readonly Pregunta[];
  private readonly respuestas: (EstadoRespuesta | null)[];
  private _indice = 0;
  private _estado: EstadoPartida = 'antes-de-pregunta';
  private inicio = 0;
  private restanteAlResponder = DURACION_MS;
  private _ultimo: Resultado | null = null;

  /**
   * @param numeroIntento 1 para el primer intento, 2 para el segundo…
   * @param practica true si el capítulo ya estaba aprobado: se juega igual pero no cambia nada guardado.
   */
  constructor(
    readonly capitulo: Capitulo,
    readonly numeroIntento: number,
    readonly practica: boolean,
    aleatorio: Aleatorio = Math.random,
  ) {
    // Las rondas van siempre en orden; se mezclan las preguntas dentro de cada ronda.
    this.originales = RONDAS.flatMap((r) => mezclar(capitulo.preguntas.filter((p) => p.ronda === r.numero), aleatorio));
    // Las opciones se mezclan dentro de cada pregunta. La correcta se sigue por su texto.
    this.preguntas = this.originales.map((p, i) => ({ numero: i + 1, ronda: p.ronda, texto: p.texto, opciones: mezclar(p.opciones, aleatorio) }));
    this.respuestas = this.originales.map(() => null);
    // En práctica se muestran los puntos del primer intento, pero no se guardan.
    this.puntosPorCorrecta = puntosPorCorrecta(practica ? 1 : numeroIntento);
  }

  get estado(): EstadoPartida {
    return this._estado;
  }

  /** Índice de la pregunta actual (0 a 19). */
  get indice(): number {
    return this._indice;
  }

  get total(): number {
    return this.preguntas.length;
  }

  get preguntaActual(): PreguntaEnJuego {
    return this.preguntas[Math.min(this._indice, this.preguntas.length - 1)];
  }

  /** true si la pregunta actual es la primera de su ronda (la pantalla muestra el cambio de ronda). */
  get empiezaRonda(): boolean {
    return this._indice === 0 || this.preguntas[this._indice].ronda !== this.preguntas[this._indice - 1].ronda;
  }

  /** El resultado de la última pregunta respondida. */
  get ultimoResultado(): Resultado | null {
    return this._ultimo;
  }

  get correctas(): number {
    return this.respuestas.filter((r) => r === 'correcta').length;
  }

  /** Puntos acumulados en este intento (como bono: nunca bajan). */
  get puntos(): number {
    return this.correctas * this.puntosPorCorrecta;
  }

  /** Estado de cada pregunta hasta ahora, para la barra de 20 segmentos. */
  get respuestasHastaAhora(): readonly (EstadoRespuesta | null)[] {
    return this.respuestas;
  }

  /** Muestra la pregunta actual: desde este momento corre su reloj. */
  mostrarPregunta(ahora: number): void {
    if (this._estado !== 'antes-de-pregunta') throw new Error(`No se puede mostrar una pregunta en el estado «${this._estado}».`);
    this._estado = 'pregunta';
    this.inicio = ahora;
    this.restanteAlResponder = DURACION_MS;
  }

  /** Milisegundos que le quedan al reloj (30.000 antes de mostrar la pregunta; detenido al responder). */
  msRestantes(ahora: number): number {
    switch (this._estado) {
      case 'antes-de-pregunta':
        return DURACION_MS;
      case 'pregunta':
        return Math.max(0, DURACION_MS - (ahora - this.inicio));
      case 'respondida':
        return this.restanteAlResponder;
      case 'terminada':
        return 0;
    }
  }

  /** Segundos que muestra el reloj: 30, 29… 1, 0. */
  segundosRestantes(ahora: number): number {
    return Math.ceil(this.msRestantes(ahora) / 1000);
  }

  /**
   * Revisa el reloj. Si llegó a 0 sin respuesta, la pregunta cuenta como incorrecta
   * («Se acabó el tiempo») y lo devuelve; si no, devuelve null.
   */
  actualizar(ahora: number): Resultado | null {
    if (this._estado === 'pregunta' && ahora - this.inicio >= DURACION_MS) return this.registrar('sin-respuesta', 0, { tipo: 'tiempo' });
    return null;
  }

  /** Responde con la opción en la posición `opcion` (0 = A, 1 = B, 2 = C) del orden mezclado. */
  responder(opcion: number, ahora: number): Resultado {
    if (this._estado !== 'pregunta') throw new Error(`No se puede responder en el estado «${this._estado}».`);
    const vencida = this.actualizar(ahora);
    if (vencida) return vencida;

    const original = this.originales[this._indice];
    const elegida = this.preguntas[this._indice].opciones[opcion];
    if (elegida === undefined) throw new Error(`La opción ${opcion} no existe.`);
    const restante = DURACION_MS - (ahora - this.inicio);

    if (elegida === original.opciones[original.correcta]) {
      return this.registrar('correcta', restante, {
        tipo: 'correcta',
        opcion,
        puntos: this.puntosPorCorrecta,
        explicacion: original.explicacion,
        cita: original.cita,
      });
    }
    return this.registrar('incorrecta', restante, { tipo: 'incorrecta', opcion });
  }

  /** Pasa a la siguiente pregunta (botón «Siguiente»). Devuelve el nuevo estado. */
  siguiente(): EstadoPartida {
    if (this._estado !== 'respondida') throw new Error(`No se puede avanzar en el estado «${this._estado}».`);
    this._indice++;
    this._estado = this._indice >= this.preguntas.length ? 'terminada' : 'antes-de-pregunta';
    return this._estado;
  }

  /** Resumen para la pantalla final: correcta, incorrecta o sin respuesta. Sin la clave. */
  resumen(): ResumenIntento {
    const correctas = this.correctas;
    return {
      preguntas: this.preguntas.map((p, i) => ({ numero: p.numero, ronda: p.ronda, texto: p.texto, estado: this.respuestas[i] ?? 'sin-respuesta' })),
      correctas,
      aprobado: correctas >= CORRECTAS_PARA_APROBAR,
    };
  }

  /** Estrellas que daría este intento si aprueba. */
  get estrellas(): number {
    return estrellasPorIntento(this.numeroIntento);
  }

  private registrar(estado: EstadoRespuesta, restanteMs: number, resultado: Resultado): Resultado {
    this.respuestas[this._indice] = estado;
    this.restanteAlResponder = Math.max(0, restanteMs);
    this._estado = 'respondida';
    this._ultimo = resultado;
    return resultado;
  }
}
