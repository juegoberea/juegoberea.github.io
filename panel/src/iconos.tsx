// Iconos del panel, dibujados como en los diseños (trazo, toman el color del texto).

import type { ComponentChildren } from 'preact';

function Icono({ tamano = 20, children }: { tamano?: number; children: ComponentChildren }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const IconoInicio = () => <Icono><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" /></Icono>;
export const IconoSubir = () => <Icono><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Icono>;
export const IconoLibro = () => <Icono><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13" /></Icono>;
export const IconoPublicar = () => <Icono><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" /></Icono>;
export const IconoEscudo = () => <Icono><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /></Icono>;
export const IconoSalir = () => <Icono><path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3" /></Icono>;
export const IconoCandado = () => <Icono tamano={18}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></Icono>;
export const IconoCelular = () => <Icono tamano={36}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></Icono>;
export const IconoLlave = () => <Icono tamano={36}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></Icono>;
export const IconoBajar = () => <Icono tamano={18}><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></Icono>;
export const IconoExcel = () => <Icono tamano={32}><path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" /><path d="M14 3v5h5M9 13l2 2 4-4" /></Icono>;
export const IconoCheck = () => <Icono tamano={18}><path d="M5 12.5l4.5 4.5L19 7" /></Icono>;
export const IconoAlerta = () => <Icono tamano={18}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></Icono>;
export const IconoSello = () => <Icono tamano={36}><circle cx="12" cy="9" r="5" /><path d="M9 13.5L7 21l5-2.5 5 2.5-2-7.5" /></Icono>;
export const IconoInfo = () => <Icono><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icono>;
