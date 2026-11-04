// Textos de la interfaz. Todos viven en archivos por idioma (es.json…), nunca en el código,
// para poder traducir el juego sin reprogramarlo.

import es from './es.json';

type Arbol = { [clave: string]: string | Arbol };

const idiomas: Record<string, Arbol> = { es };
let actual: Arbol = es;

export function elegirIdioma(codigo: string): void {
  actual = idiomas[codigo] ?? es;
}

/**
 * Busca un texto por su ruta («componentes.ronda») y reemplaza {marcas} por sus valores:
 * t('componentes.ronda', { n: 2, nombre: 'Intermedia' }) → «Ronda 2 · Intermedia».
 * Si el texto no existe devuelve la ruta, para que se note.
 */
export function t(ruta: string, valores?: Record<string, string | number>): string {
  let nodo: string | Arbol | undefined = actual;
  for (const parte of ruta.split('.')) nodo = typeof nodo === 'object' ? nodo[parte] : undefined;
  if (typeof nodo !== 'string') return ruta;
  return valores ? nodo.replace(/\{(\w+)\}/g, (marca, clave: string) => (clave in valores ? String(valores[clave]) : marca)) : nodo;
}

/** Número de intento como en los diseños: 1 → «1.er», 2 → «2.º», 3 → «3.er», 4 → «4.º». */
export function ordinalIntento(n: number): string {
  return n === 1 || n === 3 ? t(`intento.${n}`) : t('intento.otro', { n });
}

/** Número con punto de miles, como en los diseños: 4500 → «4.500», 146000 → «146.000». */
export function numero(n: number): string {
  const signo = n < 0 ? '-' : '';
  return signo + String(Math.trunc(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
