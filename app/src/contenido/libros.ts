// Los 5 libros de la serie del Gran Conflicto, en orden. Los títulos están en los textos
// (libros.<id>); el contenido de cada libro llega en contenido.bin cuando está listo.

export interface LibroDeLaSerie {
  id: string;
  /** Capítulos que tiene el libro completo (aunque el contenido todavía traiga menos). */
  capitulos: number;
}

export const SERIE: readonly LibroDeLaSerie[] = [
  { id: 'patriarcas-y-profetas', capitulos: 73 },
  { id: 'profetas-y-reyes', capitulos: 60 },
  { id: 'el-deseado-de-todas-las-gentes', capitulos: 87 },
  { id: 'los-hechos-de-los-apostoles', capitulos: 58 },
  { id: 'el-conflicto-de-los-siglos', capitulos: 42 },
];

export function libroDeLaSerie(id: string): LibroDeLaSerie | undefined {
  return SERIE.find((l) => l.id === id);
}
