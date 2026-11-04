// Música suave de los menús, generada en el momento con Web Audio (no usa archivos: no
// pesa, funciona sin internet y no necesita licencia). Nunca suena durante las preguntas.

import { contextoDeAudio, tocarNota } from './audio';

const TEMPO_S = 0.42;
const VOLUMEN = 0.045;
const ANTICIPO_S = 0.3;

// Melodía en pentatónica de Do, sobre un bajo que cambia cada 4 notas.
const MELODIA = [0, 2, 4, 7, 4, 2, 4, 9, 7, 4, 2, 4, 0, 2, -3, 0];
const BAJOS = [-12, -12, -15, -17];
const DO = 523.25;

const frecuencia = (semitonos: number) => DO * Math.pow(2, semitonos / 12);

let salida: GainNode | null = null;
let reloj: ReturnType<typeof setInterval> | null = null;
let siguiente = 0;
let paso = 0;

function programar(ctx: AudioContext, destino: AudioNode) {
  while (siguiente < ctx.currentTime + ANTICIPO_S) {
    tocarNota(ctx, destino, frecuencia(MELODIA[paso % MELODIA.length]), siguiente, TEMPO_S * 1.6, 1, 'triangle');
    if (paso % 4 === 0) tocarNota(ctx, destino, frecuencia(BAJOS[Math.floor(paso / 4) % BAJOS.length]), siguiente, TEMPO_S * 4, 0.7, 'sine');
    siguiente += TEMPO_S;
    paso++;
  }
}

/** Enciende o apaga la música del menú. Encenderla debe ocurrir después de un toque del jugador. */
export function musicaDelMenu(sonar: boolean): void {
  const ctx = sonar || salida ? contextoDeAudio() : null;
  if (!sonar) {
    if (reloj) clearInterval(reloj);
    reloj = null;
    if (salida && ctx) salida.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    return;
  }
  if (reloj || !ctx) return;
  if (!salida) {
    salida = ctx.createGain();
    salida.gain.value = 0;
    salida.connect(ctx.destination);
  }
  const destino = salida;
  destino.gain.cancelScheduledValues(ctx.currentTime);
  destino.gain.setTargetAtTime(VOLUMEN, ctx.currentTime, 0.4);
  siguiente = ctx.currentTime + 0.1;
  reloj = setInterval(() => programar(ctx, destino), 100);
  programar(ctx, destino);
}
