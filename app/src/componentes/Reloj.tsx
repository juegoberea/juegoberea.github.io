import { useTema } from '../temas/contexto';
import { t } from '../textos';

export interface PropsReloj {
  /** Segundos que quedan (30 → 0). */
  segundos: number;
  total?: number;
  /** true cuando ya se respondió: el reloj queda quieto y apagado. */
  detenido?: boolean;
}

const SEGUNDOS_URGENTES = 5;

function estadoDelReloj({ segundos, detenido }: PropsReloj): string {
  if (segundos <= 0) return 'agotado';
  if (detenido) return 'detenido';
  if (segundos <= SEGUNDOS_URGENTES) return 'urgente';
  return 'corriendo';
}

/** Reloj de 30 s. Su forma la elige el tema: círculo (Vibrante) o línea (Solemne). */
export function Reloj(props: PropsReloj) {
  const tema = useTema();
  return tema.reloj === 'linea' ? <RelojLinea {...props} /> : <RelojCircular {...props} />;
}

function RelojCircular(props: PropsReloj) {
  const { segundos, total = 30 } = props;
  const radio = 27;
  const largo = 2 * Math.PI * radio;
  const fraccion = Math.max(0, Math.min(1, segundos / total));
  return (
    <div class={`reloj reloj--circular reloj--${estadoDelReloj(props)}`} role="timer" aria-label={t('componentes.relojSegundos', { n: segundos })}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle class="reloj__fondo" cx="32" cy="32" r="30" />
        <circle
          class="reloj__arco"
          cx="32"
          cy="32"
          r={radio}
          stroke-dasharray={largo}
          stroke-dashoffset={largo * (1 - fraccion)}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span class="reloj__numero" aria-hidden="true">
        {segundos}
      </span>
    </div>
  );
}

function RelojLinea(props: PropsReloj) {
  const { segundos, total = 30 } = props;
  const fraccion = Math.max(0, Math.min(1, segundos / total));
  return (
    <div class={`reloj reloj--linea reloj--${estadoDelReloj(props)}`} role="timer" aria-label={t('componentes.relojSegundos', { n: segundos })}>
      <span class="reloj__numero" aria-hidden="true">
        {segundos}
      </span>
      <span class="reloj__pista" aria-hidden="true">
        <span class="reloj__avance" style={{ width: `${fraccion * 100}%` }} />
      </span>
    </div>
  );
}
