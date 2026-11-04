// Textos del panel, aparte de los del juego. Todos viven en es.json, nunca en el código.

import es from './es.json';

type Arbol = { [clave: string]: string | Arbol };

const actual: Arbol = es;

/** Busca un texto por su ruta («inicio.hola») y reemplaza {marcas}. Si no existe devuelve la ruta. */
export function t(ruta: string, valores?: Record<string, string | number>): string {
  let nodo: string | Arbol | undefined = actual;
  for (const parte of ruta.split('.')) nodo = typeof nodo === 'object' ? nodo[parte] : undefined;
  if (typeof nodo !== 'string') return ruta;
  return valores ? nodo.replace(/\{(\w+)\}/g, (marca, clave: string) => (clave in valores ? String(valores[clave]) : marca)) : nodo;
}
