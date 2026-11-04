import type { ComponentChildren } from 'preact';
import { t } from '../textos';

export interface PropsInsignia {
  /** Número del capítulo (o un icono en `children`, como el libro al terminar). */
  numero?: number;
  children?: ComponentChildren;
  ganada?: boolean;
  /** Brillo dorado al ganarla (dos veces). */
  brillar?: boolean;
  /** Ancho en px. */
  tamano?: number;
}

/** Contorno dentado de 12 puntas, calculado una sola vez. */
const DIENTES = 12;
const CONTORNO = Array.from({ length: DIENTES * 2 }, (_, i) => {
  const angulo = (Math.PI * i) / DIENTES - Math.PI / 2;
  const r = i % 2 === 0 ? 48 : 39;
  return `${(50 + r * Math.cos(angulo)).toFixed(2)},${(50 + r * Math.sin(angulo)).toFixed(2)}`;
}).join(' ');

export function Insignia({ numero, children, ganada = true, brillar = false, tamano = 72 }: PropsInsignia) {
  const etiqueta =
    numero !== undefined ? t(ganada ? 'componentes.insigniaGanada' : 'componentes.insigniaPorGanar', { n: numero }) : undefined;
  return (
    <span
      class={`insignia${ganada ? ' insignia--ganada' : ' insignia--por-ganar'}${brillar ? ' insignia--brillar' : ''}`}
      style={{ width: `${tamano}px`, height: `${tamano}px`, fontSize: `${tamano * 0.3}px` }}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="insignia__borde" points={CONTORNO} />
        <circle class="insignia__centro" cx="50" cy="50" r="27" />
      </svg>
      <span class="insignia__contenido" aria-hidden={etiqueta ? 'true' : undefined}>
        {children ?? numero}
      </span>
    </span>
  );
}
