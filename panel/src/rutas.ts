// Direcciones del panel (#/inicio, #/capitulo/4/pregunta/9…), para que «Atrás» del navegador funcione.

import type { Seccion } from './Marco';

export type RutaPanel =
  | { pantalla: 'inicio' | 'subir' | 'capitulos' | 'publicar' | 'seguridad' }
  | { pantalla: 'vista'; capitulo: number; posicion: number }
  | { pantalla: 'editar'; capitulo: number; orden: number };

export function leerRutaPanel(hash: string): RutaPanel {
  const partes = hash.replace(/^#\/?/, '').split('/');
  const n = (i: number) => Number.parseInt(partes[i] ?? '', 10);
  if (partes[0] === 'capitulo' && n(1) > 0) {
    if (partes[2] === 'editar' && n(3) >= 0) return { pantalla: 'editar', capitulo: n(1), orden: n(3) };
    return { pantalla: 'vista', capitulo: n(1), posicion: partes[2] === 'pregunta' && n(3) > 0 ? n(3) : 1 };
  }
  const simples = ['inicio', 'subir', 'capitulos', 'publicar', 'seguridad'] as const;
  return { pantalla: simples.find((s) => s === partes[0]) ?? 'inicio' };
}

/** Qué opción del menú se marca. */
export function seccionDe(ruta: RutaPanel): Seccion {
  return ruta.pantalla === 'vista' || ruta.pantalla === 'editar' ? 'capitulos' : ruta.pantalla;
}
