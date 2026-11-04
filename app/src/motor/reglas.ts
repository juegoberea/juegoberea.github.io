// Reglas de puntaje y aprobación (ver docs/plan.md). No se cambian sin preguntar a la autora.

export const SEGUNDOS_POR_PREGUNTA = 30;
export const CORRECTAS_PARA_APROBAR = 14;
export const PUNTOS_MAXIMOS_CAPITULO = 2000;

/** 1.er intento: 100 · 2.º: 80 · 3.º en adelante: 60. */
export function puntosPorCorrecta(intento: number): number {
  if (intento <= 1) return 100;
  if (intento === 2) return 80;
  return 60;
}

/** 1.er intento: 3 estrellas · 2.º: 2 · 3.º en adelante: 1. */
export function estrellasPorIntento(intento: number): number {
  if (intento <= 1) return 3;
  if (intento === 2) return 2;
  return 1;
}

/**
 * La diferencia se muestra como bono, nunca como descuento: sobre la base de 60 puntos,
 * el 1.er intento da «+40 por respuesta» y el 2.º «+20 por respuesta».
 */
export function bonoPorRespuesta(intento: number): number {
  return puntosPorCorrecta(intento) - puntosPorCorrecta(3);
}

/** Puntos máximos de un libro: 73 capítulos → 146.000. */
export function puntosMaximosLibro(capitulos: number): number {
  return capitulos * PUNTOS_MAXIMOS_CAPITULO;
}

/** Estrellas máximas de un libro: 73 capítulos → 219. */
export function estrellasMaximasLibro(capitulos: number): number {
  return capitulos * 3;
}
