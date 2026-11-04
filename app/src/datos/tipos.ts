// Lo que se guarda en el aparato. Nada sale de él.

/** Los 6 colores de avatar; el color real de cada uno lo pone el tema. */
export const COLORES_AVATAR = ['turquesa', 'azul', 'morado', 'naranja', 'rojo', 'indigo'] as const;
export type ColorAvatar = (typeof COLORES_AVATAR)[number];

export const TAMANOS_LETRA = ['normal', 'grande', 'muyGrande'] as const;
export type TamanoLetra = (typeof TAMANOS_LETRA)[number];

export const LARGO_MAXIMO_NOMBRE = 24;

export interface Ajustes {
  letra: TamanoLetra;
  sonidos: boolean;
  /** Música de los menús (nunca suena durante las preguntas). */
  musica: boolean;
}

export const AJUSTES_INICIALES: Ajustes = { letra: 'normal', sonidos: true, musica: false };

export interface Perfil {
  id: string;
  /** Nombre o apodo. No se piden otros datos. */
  nombre: string;
  color: ColorAvatar;
  creado: string;
  ajustes: Ajustes;
}

/** El intento con el que se aprobó. Una vez guardado no cambia (practicar no lo toca). */
export interface CapituloAprobado {
  puntos: number;
  estrellas: number;
  /** En qué intento aprobó (1, 2, 3…). */
  intento: number;
  correctas: number;
  fecha: string;
}

export interface EstadoCapitulo {
  /** Intentos empezados antes de aprobar (los cerrados a mitad también cuentan). */
  intentos: number;
  aprobado?: CapituloAprobado;
}

export interface Reflexion {
  texto: string;
  fecha: string;
}

/** Intento empezado y no terminado. Si al volver sigue aquí, se cerró a mitad: se perdió. */
export interface IntentoEnCurso {
  capitulo: number;
  numeroIntento: number;
  inicio: string;
}

/** Avance de un perfil en un libro. Se guarda por número de capítulo, así sobrevive a cambios en las preguntas. */
export interface ProgresoLibro {
  perfilId: string;
  libroId: string;
  capitulos: Record<number, EstadoCapitulo>;
  diario: Record<number, Reflexion>;
  intentoEnCurso?: IntentoEnCurso;
}
