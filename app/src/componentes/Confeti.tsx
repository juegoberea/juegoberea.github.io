import { useMemo } from 'preact/hooks';
import { useTema } from '../temas/contexto';

/** Colores de las rondas más el dorado de las estrellas. */
const COLORES = ['--color-facil', '--color-intermedia', '--color-avanzada', '--color-aplicacion', '--color-star'];
const PIEZAS = 36;

/**
 * Confeti que cae una sola vez. Para lanzarlo de nuevo, cambia su `key`.
 * Con «reducir movimiento» activo en el aparato no se muestra.
 */
export function Confeti() {
  const tema = useTema();
  const piezas = useMemo(
    () =>
      Array.from({ length: PIEZAS }, (_, i) => ({
        izquierda: Math.random() * 100,
        retraso: Math.random() * 0.35 * tema.movimiento.confetiMs,
        giro: Math.round(Math.random() * 720 - 360),
        deriva: Math.round(Math.random() * 80 - 40),
        color: COLORES[i % COLORES.length],
        forma: i % 3 === 0 ? 'punto' : 'tira',
      })),
    [tema],
  );
  return (
    <div class="confeti" aria-hidden="true">
      {piezas.map((p, i) => (
        <span
          key={i}
          class={`confeti__pieza confeti__pieza--${p.forma}`}
          style={{
            left: `${p.izquierda}%`,
            background: `var(${p.color})`,
            animationDuration: `${tema.movimiento.confetiMs * 0.65}ms`,
            animationDelay: `${p.retraso}ms`,
            '--giro': `${p.giro}deg`,
            '--deriva': `${p.deriva}px`,
          }}
        />
      ))}
    </div>
  );
}
