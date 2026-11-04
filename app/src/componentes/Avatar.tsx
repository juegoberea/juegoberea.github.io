import type { ColorAvatar } from '../datos/tipos';
import { t } from '../textos';

export interface PropsAvatar {
  nombre: string;
  color: ColorAvatar;
  /** normal: 56 px (listas) · grande: 112 px (crear perfil). */
  tamano?: 'chico' | 'normal' | 'grande';
}

/** Primera letra del nombre, en mayúscula («sofi» → «S»). */
export function inicial(nombre: string): string {
  const primera = [...nombre.trim()][0];
  return primera ? primera.toLocaleUpperCase('es') : '?';
}

/** Círculo de color con la inicial. Sin fotos. */
export function Avatar({ nombre, color, tamano = 'normal' }: PropsAvatar) {
  return (
    <span class={`avatar avatar--${tamano}`} style={{ '--avatar': `var(--avatar-${color})`, '--avatar-texto': `var(--avatar-${color}-texto)` }} role="img" aria-label={t('componentes.avatar', { nombre })}>
      <span aria-hidden="true">{inicial(nombre)}</span>
    </span>
  );
}
