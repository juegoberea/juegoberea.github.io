import type { ComponentChildren, JSX } from 'preact';

export interface PropsBoton extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'icon'> {
  /** primario: azul con borde inferior que se hunde 4 px · secundario: lila suave · blanco: sobre fondos de color. */
  variante?: 'primario' | 'secundario' | 'blanco';
  /** Late suavemente para invitar a tocarlo (por ejemplo «Entrar»). */
  late?: boolean;
  /** Ocupa todo el ancho disponible. */
  ancho?: boolean;
  icono?: ComponentChildren;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function Boton({ variante = 'primario', late, ancho, icono, children, class: clase, type = 'button', ...resto }: PropsBoton) {
  const clases = ['boton', `boton--${variante}`, late && 'boton--late', ancho && 'boton--ancho', clase].filter(Boolean).join(' ');
  return (
    <button type={type} class={clases} {...resto}>
      {icono && <span class="boton__icono">{icono}</span>}
      <span>{children}</span>
    </button>
  );
}
