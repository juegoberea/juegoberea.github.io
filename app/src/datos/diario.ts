// Entradas de «Mi diario» con su capítulo y su pregunta de reflexión, y el diario completo
// como texto para guardarlo como archivo.

import type { LibroEnIdioma } from '../contenido/tipos';
import { diarioOrdenado } from './progreso';
import type { ProgresoLibro } from './tipos';

export interface EntradaDiario {
  capitulo: number;
  titulo: string;
  pregunta: string;
  texto: string;
  fecha: string;
}

/** Las reflexiones del perfil, ordenadas por capítulo, con el título y la pregunta del capítulo. */
export function entradasDiario(progreso: ProgresoLibro, libro: LibroEnIdioma | undefined): EntradaDiario[] {
  return diarioOrdenado(progreso).map(({ capitulo, texto, fecha }) => {
    const c = libro?.capitulos.find((x) => x.numero === capitulo);
    return { capitulo, titulo: c?.titulo ?? '', pregunta: c?.reflexion ?? '', texto, fecha };
  });
}

export interface TextosDiario {
  encabezado: string;
  subtitulo: string;
  guardadoEl: string;
  capitulo: (n: number, titulo: string) => string;
  pregunta: string;
  reflexion: string;
}

/** El diario completo como texto plano, ordenado por capítulo. */
export function diarioComoTexto(entradas: EntradaDiario[], textos: TextosDiario): string {
  const lineas = [textos.encabezado, textos.subtitulo, textos.guardadoEl, ''];
  for (const e of entradas) {
    lineas.push('—'.repeat(24), textos.capitulo(e.capitulo, e.titulo), '');
    if (e.pregunta) lineas.push(`${textos.pregunta} ${e.pregunta}`, '');
    lineas.push(textos.reflexion, e.texto, '');
  }
  // Fin de línea de Windows, para que el Bloc de notas lo muestre bien.
  return lineas.join('\r\n');
}
