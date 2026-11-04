// Sonidos cortos, alegres y no estridentes, generados con Web Audio (sin archivos ni
// licencias). Solo suenan si el perfil tiene los sonidos encendidos y no está todo silenciado.

import { contextoDeAudio, tocarNota } from './audio';

export type Efecto = 'toque' | 'correcto' | 'incorrecto' | 'tiempo' | 'tic' | 'ronda' | 'aprobado' | 'casi';

const VOLUMEN = 0.12;
const nota = (semitonosDesdeLa: number) => 440 * Math.pow(2, semitonosDesdeLa / 12);

/** Cada efecto: [semitonos desde La 440, retraso en s, duración en s, forma]. */
const EFECTOS: Record<Efecto, [number, number, number, OscillatorType][]> = {
  toque: [[15, 0, 0.07, 'triangle']],
  // Arpegio que sube: Do–Mi–Sol.
  correcto: [
    [3, 0, 0.16, 'triangle'],
    [7, 0.08, 0.16, 'triangle'],
    [10, 0.16, 0.3, 'triangle'],
  ],
  // Dos notas que bajan, suaves (no es un «error» estridente).
  incorrecto: [
    [-2, 0, 0.18, 'sine'],
    [-6, 0.13, 0.3, 'sine'],
  ],
  tiempo: [
    [-5, 0, 0.22, 'sine'],
    [-5, 0.26, 0.3, 'sine'],
  ],
  tic: [[22, 0, 0.04, 'sine']],
  ronda: [
    [3, 0, 0.12, 'triangle'],
    [10, 0.1, 0.12, 'triangle'],
    [15, 0.2, 0.35, 'triangle'],
  ],
  // Pequeña fanfarria: Do–Mi–Sol–Do agudo.
  aprobado: [
    [3, 0, 0.14, 'triangle'],
    [7, 0.12, 0.14, 'triangle'],
    [10, 0.24, 0.14, 'triangle'],
    [15, 0.36, 0.5, 'triangle'],
    [10, 0.36, 0.5, 'sine'],
  ],
  // Dos notas tranquilas, sin tono de derrota.
  casi: [
    [3, 0, 0.25, 'sine'],
    [7, 0.18, 0.4, 'sine'],
  ],
};

export function sonar(efecto: Efecto, permitido: boolean): void {
  if (!permitido) return;
  const ctx = contextoDeAudio();
  if (!ctx) return;
  const ahora = ctx.currentTime + 0.01;
  for (const [semitonos, retraso, duracion, forma] of EFECTOS[efecto]) {
    tocarNota(ctx, ctx.destination, nota(semitonos), ahora + retraso, duracion, efecto === 'tic' ? VOLUMEN * 0.5 : VOLUMEN, forma);
  }
}
