import { t } from '../textos';
import { IconoCheck, IconoCruz } from './iconos';

/**
 * esperando: se puede tocar · correcta: verde con check y «+100» · incorrecta: roja con
 * «Incorrecto» · atenuada: las otras opciones una vez respondida (nunca revela la correcta).
 */
export type EstadoOpcion = 'esperando' | 'correcta' | 'incorrecta' | 'atenuada';

export interface PropsOpcion {
  letra: string;
  texto: string;
  estado: EstadoOpcion;
  /** Puntos ganados, para la etiqueta «+100» (+80 o +60 según el intento). */
  puntos?: number;
  onElegir?: () => void;
}

/** Tarjeta grande de una opción. Toma el color de la ronda del contenedor (.ronda-N). */
export function Opcion({ letra, texto, estado, puntos, onElegir }: PropsOpcion) {
  const marca = estado === 'correcta' ? <IconoCheck tamano={22} /> : estado === 'incorrecta' ? <IconoCruz tamano={22} /> : letra;
  return (
    <button
      type="button"
      class={`opcion opcion--${estado}`}
      disabled={estado !== 'esperando'}
      onClick={estado === 'esperando' ? onElegir : undefined}
    >
      <span class="opcion__marca" aria-hidden="true">
        {marca}
      </span>
      <span class="opcion__texto t-opcion">
        <span class="solo-lectores">{letra}. </span>
        {texto}
      </span>
      {estado === 'correcta' && puntos !== undefined && <span class="opcion__puntos">{t('componentes.puntosGanados', { n: puntos })}</span>}
      {estado === 'incorrecta' && <span class="opcion__aviso">{t('componentes.incorrecto')}</span>}
    </button>
  );
}
