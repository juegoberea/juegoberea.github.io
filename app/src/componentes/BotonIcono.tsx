import type { ComponentChildren } from 'preact';
import { t } from '../textos';
import { IconoAltavoz, IconoSilencio } from './iconos';

export interface PropsBotonIcono {
  /** Texto para lectores de pantalla (el botón solo muestra un icono). */
  etiqueta: string;
  children: ComponentChildren;
  onClick?: () => void;
  presionado?: boolean;
}

/** Botón redondo blanco con un icono: volver, ajustes, silencio. */
export function BotonIcono({ etiqueta, children, onClick, presionado }: PropsBotonIcono) {
  return (
    <button type="button" class="boton-icono" aria-label={etiqueta} title={etiqueta} aria-pressed={presionado} onClick={onClick}>
      {children}
    </button>
  );
}

export interface PropsBotonSilencio {
  silenciado: boolean;
  onCambiar: (silenciado: boolean) => void;
}

/** Silencia todos los sonidos y la música. Siempre visible. */
export function BotonSilencio({ silenciado, onCambiar }: PropsBotonSilencio) {
  return (
    <BotonIcono
      etiqueta={silenciado ? t('componentes.activarSonido') : t('componentes.silenciar')}
      presionado={silenciado}
      onClick={() => onCambiar(!silenciado)}
    >
      {silenciado ? <IconoSilencio /> : <IconoAltavoz />}
    </BotonIcono>
  );
}
