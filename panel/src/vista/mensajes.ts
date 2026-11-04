// Mensajes entre el panel y la vista previa (vista.html, dentro de un iframe del tamaño del celular).

import type { TamanoLetra } from '../../../app/src/datos/tipos';
import type { FilaPregunta } from '../compartido/banco';

export const TAMANOS: TamanoLetra[] = ['normal', 'grande', 'muyGrande'];

export type AlaVista =
  | { tipo: 'mostrar'; pregunta: FilaPregunta; posicion: number; rondas: number[]; letra: TamanoLetra }
  | { tipo: 'medir'; id: number; preguntas: FilaPregunta[] };

export type DesdeLaVista =
  | { tipo: 'lista' }
  | { tipo: 'medida'; sobra: number }
  | { tipo: 'medicion'; id: number; resultados: Record<number, [number, number, number]> };
