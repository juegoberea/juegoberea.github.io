import { useTema } from '../temas/contexto';
import { t } from '../textos';

export interface PropsEstrellas {
  ganadas: number;
  total?: number;
  /** chica: como en el mapa de capítulos · grande: como en el resultado. */
  tamano?: 'chica' | 'grande';
  /** Aparecen una por una (pantalla de resultado). */
  animar?: boolean;
}

const PUNTAS = '12,2.2 14.9,8.6 21.8,9.3 16.6,14 18.1,20.8 12,17.3 5.9,20.8 7.4,14 2.2,9.3 9.1,8.6';

export function Estrellas({ ganadas, total = 3, tamano = 'chica', animar = false }: PropsEstrellas) {
  const tema = useTema();
  const paso = parseInt(tema.movimiento.estrella, 10) + tema.movimiento.estrellaPausaMs;
  return (
    <span class={`estrellas estrellas--${tamano}${animar ? ' estrellas--animar' : ''}`} role="img" aria-label={t('componentes.estrellas', { n: ganadas, total })}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          class={`estrella${i < ganadas ? ' estrella--ganada' : ''}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={animar && i < ganadas ? { animationDelay: `${i * paso}ms` } : undefined}
        >
          <polygon points={PUNTAS} />
        </svg>
      ))}
    </span>
  );
}
