// Interruptor de encendido/apagado (Sonidos, Música del menú).

export interface PropsInterruptor {
  encendido: boolean;
  onCambiar: (encendido: boolean) => void;
  /** Id del texto que nombra al interruptor (para lectores de pantalla). */
  etiquetadoPor: string;
  deshabilitado?: boolean;
}

export function Interruptor({ encendido, onCambiar, etiquetadoPor, deshabilitado }: PropsInterruptor) {
  return (
    <button
      type="button"
      role="switch"
      class={`interruptor${encendido ? ' interruptor--encendido' : ''}`}
      aria-checked={encendido}
      aria-labelledby={etiquetadoPor}
      disabled={deshabilitado}
      onClick={() => onCambiar(!encendido)}
    >
      <span class="interruptor__perilla" aria-hidden="true" />
    </button>
  );
}
