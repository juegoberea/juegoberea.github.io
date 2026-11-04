// Un solo contexto de audio para la música y los sonidos. Se crea al primer uso (después
// de un toque del jugador, como exigen los navegadores). Sin audio, el juego sigue igual.

let contexto: AudioContext | null = null;

export function contextoDeAudio(): AudioContext | null {
  if (contexto) {
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  }
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return null;
    contexto = new Contexto();
    return contexto;
  } catch {
    return null;
  }
}

/** Una nota con subida rápida y caída suave. */
export function tocarNota(
  ctx: AudioContext,
  destino: AudioNode,
  frecuencia: number,
  inicio: number,
  duracion: number,
  volumen: number,
  forma: OscillatorType = 'sine',
): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = forma;
  osc.frequency.value = frecuencia;
  env.gain.setValueAtTime(0, inicio);
  env.gain.linearRampToValueAtTime(volumen, inicio + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(env).connect(destino);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}
