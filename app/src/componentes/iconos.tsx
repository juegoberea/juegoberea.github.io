// Iconos simples dibujados a mano en SVG. Usan el color del texto (currentColor),
// así heredan el color del tema.

import type { JSX } from 'preact';

type Props = { tamano?: number } & Omit<JSX.SVGAttributes<SVGSVGElement>, 'size'>;

function Svg({ tamano = 24, children, ...resto }: Props & { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={2.4}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconoAltavoz = (p: Props) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18 7a7 7 0 0 1 0 10" />
  </Svg>
);

export const IconoSilencio = (p: Props) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Svg>
);

export const IconoAtras = (p: Props) => (
  <Svg {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </Svg>
);

export const IconoAdelante = (p: Props) => (
  <Svg {...p}>
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </Svg>
);

export const IconoAjustes = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </Svg>
);

export const IconoCandado = (p: Props) => (
  <Svg {...p}>
    <path d="M8 11V8.5a4 4 0 0 1 8 0V11" />
    <rect x="5.5" y="11" width="13" height="9.5" rx="2" fill="currentColor" />
  </Svg>
);

export const IconoCheck = (p: Props) => (
  <Svg {...p}>
    <path d="M5.5 12.5l4.2 4.2L18.5 7.8" />
  </Svg>
);

export const IconoCruz = (p: Props) => (
  <Svg {...p}>
    <path d="M7 7l10 10M17 7L7 17" />
  </Svg>
);

export const IconoCronometro = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4.2M9.5 2.8h5" />
  </Svg>
);

export const IconoLibro = (p: Props) => (
  <Svg {...p}>
    <path d="M12 6.5C10.3 5.2 7.6 4.8 3.5 5v13c4.1-.2 6.8.2 8.5 1.5 1.7-1.3 4.4-1.7 8.5-1.5V5c-4.1-.2-6.8.2-8.5 1.5z" />
    <path d="M12 6.5v13" />
  </Svg>
);

export const IconoMas = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconoReintentar = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4v4.5H9" />
  </Svg>
);

export const IconoLapiz = (p: Props) => (
  <Svg {...p}>
    <path d="M15.5 4.5l4 4L8 20H4v-4z" />
    <path d="M13 7l4 4" />
  </Svg>
);
