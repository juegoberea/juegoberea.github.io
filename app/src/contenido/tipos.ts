// Estructura del contenido del juego: libro → idioma → capítulos → preguntas.

export type NumeroRonda = 1 | 2 | 3 | 4;

/** Las 4 rondas, en el orden en que se juegan, con cuántas preguntas lleva cada una. */
export const RONDAS: ReadonlyArray<{ numero: NumeroRonda; clave: string; nombre: string; cantidad: number }> = [
  { numero: 1, clave: 'facil', nombre: 'Fácil', cantidad: 6 },
  { numero: 2, clave: 'intermedia', nombre: 'Intermedia', cantidad: 6 },
  { numero: 3, clave: 'avanzada', nombre: 'Avanzada', cantidad: 6 },
  { numero: 4, clave: 'aplicacion', nombre: 'Aplicación', cantidad: 2 },
];

export const PREGUNTAS_POR_CAPITULO = 20;

export interface Pregunta {
  /** El N.º de la pregunta en el Excel; identifica la pregunta dentro del capítulo. */
  id: number;
  ronda: NumeroRonda;
  texto: string;
  /** Opciones A, B y C tal como están en el Excel. El juego las mezcla en cada intento. */
  opciones: [string, string, string];
  /** Posición de la correcta dentro de `opciones` (0 = A, 1 = B, 2 = C). */
  correcta: 0 | 1 | 2;
  explicacion: string;
  cita: string;
}

export interface Capitulo {
  numero: number;
  titulo: string;
  /** Pregunta de reflexión; vacía si el Excel no la trae. */
  reflexion: string;
  /** Ordenadas por ronda y luego por N.º. */
  preguntas: Pregunta[];
}

export interface LibroEnIdioma {
  titulo: string;
  /** Ordenados por número, empezando en 1 y sin saltos. */
  capitulos: Capitulo[];
}

export interface Libro {
  /** Identificador estable, por ejemplo «patriarcas-y-profetas». */
  id: string;
  /** Clave: código de idioma («es», «en»…). */
  idiomas: Record<string, LibroEnIdioma>;
}

export interface Contenido {
  formato: 1;
  /** Crece con cada conversión; el juego lo usa para saber si hay contenido nuevo. */
  version: number;
  /** Fecha de la conversión (ISO 8601). */
  generado: string;
  /** Mensaje opcional de la autora para los jugadores (se publica desde el panel). */
  mensaje?: string;
  /** Clave: id del libro. */
  libros: Record<string, Libro>;
}
