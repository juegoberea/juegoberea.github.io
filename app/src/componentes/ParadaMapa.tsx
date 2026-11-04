import { t } from '../textos';
import { IconoCandado } from './iconos';

export type EstadoParada = 'aprobada' | 'disponible' | 'bloqueada';

export interface PropsParadaMapa {
  numero: number;
  estado: EstadoParada;
  onClick?: () => void;
}

/** Círculo del camino de capítulos: aprobada (color), disponible (brilla) o bloqueada (candado). */
export function ParadaMapa({ numero, estado, onClick }: PropsParadaMapa) {
  const etiqueta = t(
    estado === 'aprobada' ? 'componentes.capituloAprobado' : estado === 'disponible' ? 'componentes.capituloDisponible' : 'componentes.capituloBloqueado',
    { n: numero },
  );
  return (
    <button type="button" class={`parada parada--${estado}`} aria-label={etiqueta} disabled={estado === 'bloqueada'} onClick={onClick}>
      {estado === 'bloqueada' ? <IconoCandado tamano={26} /> : <span aria-hidden="true">{numero}</span>}
    </button>
  );
}
