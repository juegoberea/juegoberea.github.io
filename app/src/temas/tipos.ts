// Forma de un tema visual. El Vibrante y el futuro Solemne usan exactamente los mismos
// nombres: las pantallas y los componentes solo usan estos nombres (como variables CSS),
// nunca colores, fuentes ni tamaños escritos a mano.

import type { ColorAvatar, TamanoLetra } from '../datos/tipos';

/** [tamaño en px, alto de línea en px, peso] */
export type EstiloLetra = [number, number, number];

export interface Colores {
  bg: string; surface: string; surfaceSunk: string;
  line: string; lineStrong: string;
  ink: string; inkMuted: string; onColor: string;
  primary: string; onPrimary: string; primaryPress: string; primarySoft: string;
  accent: string; paper: string; paperInk: string;
  facil: string; facilSoft: string; facilInk: string;
  intermedia: string; intermediaSoft: string; intermediaInk: string;
  avanzada: string; avanzadaSoft: string; avanzadaInk: string;
  aplicacion: string; onAplicacion: string; aplicacionSoft: string; aplicacionInk: string;
  correcto: string; correctoSoft: string; correctoInk: string;
  incorrecto: string; incorrectoSoft: string; incorrectoInk: string;
  tiempo: string; tiempoSoft: string; tiempoInk: string;
  star: string; starEdge: string; starEmpty: string;
}

export interface Tema {
  nombre: string;
  color: Colores;
  fuente: string;
  letra: {
    display: EstiloLetra;
    titulo: EstiloLetra;
    boton: EstiloLetra;
    etiqueta: EstiloLetra;
    /** Lo que cambia con el tamaño de letra elegido en Ajustes. */
  } & Record<TamanoLetra, { pregunta: EstiloLetra; opcion: EstiloLetra; texto: EstiloLetra }>;
  espacio: number[];
  radio: { sm: number; md: number; lg: number; full: number };
  sombra: { tarjeta: string; pop: string; popSuave: string };
  tamano: { tocableMin: number; reloj: number; avatar: number; paradaMapa: number; contenidoMax: number };
  /** Descripción de las animaciones aprobadas (documentación). */
  animacion: Record<string, string>;
  /** Duraciones de las animaciones, sacadas de `animacion`. */
  movimiento: {
    late: string;
    opcionTocada: string;
    relojLate: string;
    cambioRondaFondo: string;
    /** Milisegundos que dura la pantalla de cambio de ronda. */
    pantallaRondaMs: number;
    /** Milisegundos que dura el confeti. */
    confetiMs: number;
    estrella: string;
    /** Milisegundos entre una estrella y la siguiente. */
    estrellaPausaMs: number;
    insignia: string;
    parada: string;
  };
  /** Qué color del tema usa cada avatar y qué color va encima (la inicial). */
  avatar: Record<ColorAvatar, { fondo: keyof Colores; texto: keyof Colores }>;
  /** El Vibrante usa un reloj circular; el Solemne usará una línea dorada. */
  reloj: 'circular' | 'linea';
}
