// Cálculos sobre el avance de un perfil en un libro. El total, el capítulo actual y el
// registro de intentos se calculan a partir de los capítulos aprobados, así nunca se
// desincronizan.

import type { CapituloAprobado, ProgresoLibro } from './tipos';

export function progresoVacio(perfilId: string, libroId: string): ProgresoLibro {
  return { perfilId, libroId, capitulos: {}, diario: {} };
}

export function estaAprobado(progreso: ProgresoLibro, capitulo: number): boolean {
  return Boolean(progreso.capitulos[capitulo]?.aprobado);
}

/** Los capítulos se juegan en orden: el 1 siempre está abierto; los demás, al aprobar el anterior. */
export function capituloDisponible(progreso: ProgresoLibro, capitulo: number): boolean {
  return capitulo === 1 || estaAprobado(progreso, capitulo - 1);
}

/** El primer capítulo sin aprobar. Si se pasa `totalCapitulos`, no pasa del último. */
export function capituloActual(progreso: ProgresoLibro, totalCapitulos?: number): number {
  let n = 1;
  while (estaAprobado(progreso, n)) n++;
  return totalCapitulos ? Math.min(n, totalCapitulos) : n;
}

/** Capítulos aprobados, en orden, con sus datos (para el registro de intentos). */
export function capitulosAprobados(progreso: ProgresoLibro): ({ capitulo: number } & CapituloAprobado)[] {
  return Object.entries(progreso.capitulos)
    .filter(([, estado]) => estado.aprobado)
    .map(([capitulo, estado]) => ({ capitulo: Number(capitulo), ...estado.aprobado! }))
    .sort((a, b) => a.capitulo - b.capitulo);
}

export function totalPuntos(progreso: ProgresoLibro): number {
  return capitulosAprobados(progreso).reduce((suma, c) => suma + c.puntos, 0);
}

export function totalEstrellas(progreso: ProgresoLibro): number {
  return capitulosAprobados(progreso).reduce((suma, c) => suma + c.estrellas, 0);
}

/** Reflexiones del diario ordenadas por capítulo. */
export function diarioOrdenado(progreso: ProgresoLibro): { capitulo: number; texto: string; fecha: string }[] {
  return Object.entries(progreso.diario)
    .map(([capitulo, r]) => ({ capitulo: Number(capitulo), ...r }))
    .sort((a, b) => a.capitulo - b.capitulo);
}
