// Lee las hojas «Banco» y «Reflexiones» del Excel de la autora.
// Las columnas se buscan por nombre, aceptando variantes: mayúsculas, tildes, textos entre
// paréntesis como «Explicación (se muestra al aprobar)» y abreviaturas como «N.º».

import * as XLSX from 'xlsx';
import type { Aviso } from './avisos';

export interface FilaBanco {
  /** Número de fila en el Excel (la fila 1 es la de encabezados). */
  fila: number;
  idioma: string;
  libro: string;
  capitulo: string;
  titulo: string;
  numero: string;
  ronda: string;
  pregunta: string;
  opciones: [string, string, string];
  correcta: string;
  explicacion: string;
  cita: string;
}

export interface FilaReflexion {
  fila: number;
  idioma: string;
  libro: string;
  capitulo: string;
  titulo: string;
  reflexion: string;
}

export interface LecturaExcel {
  archivo: string;
  banco: FilaBanco[];
  reflexiones: FilaReflexion[];
  avisos: Aviso[];
}

/** Minúsculas, sin tildes, sin lo que va entre paréntesis y sin signos. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Columna {
  campo: string;
  /** Nombre que se muestra en los avisos. */
  nombre: string;
  alias: string[];
  obligatoria: boolean;
}

const COLUMNAS_BANCO: Columna[] = [
  { campo: 'idioma', nombre: 'Idioma', alias: ['idioma', 'lengua'], obligatoria: false },
  { campo: 'libro', nombre: 'Libro', alias: ['libro'], obligatoria: true },
  { campo: 'capitulo', nombre: 'Capítulo', alias: ['capitulo', 'cap', 'n capitulo', 'numero de capitulo'], obligatoria: true },
  { campo: 'titulo', nombre: 'Título del capítulo', alias: ['titulo del capitulo', 'titulo'], obligatoria: true },
  { campo: 'numero', nombre: 'N.º', alias: ['n', 'no', 'nro', 'num', 'numero', 'n de pregunta', 'numero de pregunta'], obligatoria: true },
  { campo: 'ronda', nombre: 'Ronda', alias: ['ronda'], obligatoria: true },
  { campo: 'pregunta', nombre: 'Pregunta', alias: ['pregunta'], obligatoria: true },
  { campo: 'a', nombre: 'Opción A', alias: ['opcion a', 'alternativa a', 'a'], obligatoria: true },
  { campo: 'b', nombre: 'Opción B', alias: ['opcion b', 'alternativa b', 'b'], obligatoria: true },
  { campo: 'c', nombre: 'Opción C', alias: ['opcion c', 'alternativa c', 'c'], obligatoria: true },
  { campo: 'correcta', nombre: 'Correcta', alias: ['correcta', 'respuesta correcta', 'respuesta'], obligatoria: true },
  { campo: 'explicacion', nombre: 'Explicación', alias: ['explicacion'], obligatoria: true },
  { campo: 'cita', nombre: 'Cita', alias: ['cita', 'cita biblica', 'referencia', 'referencia biblica'], obligatoria: true },
];

const COLUMNAS_REFLEXIONES: Columna[] = [
  { campo: 'idioma', nombre: 'Idioma', alias: ['idioma', 'lengua'], obligatoria: false },
  { campo: 'libro', nombre: 'Libro', alias: ['libro'], obligatoria: true },
  { campo: 'capitulo', nombre: 'Capítulo', alias: ['capitulo', 'cap', 'n capitulo', 'numero de capitulo'], obligatoria: true },
  { campo: 'titulo', nombre: 'Título del capítulo', alias: ['titulo del capitulo', 'titulo'], obligatoria: false },
  { campo: 'reflexion', nombre: 'Pregunta de reflexión', alias: ['pregunta de reflexion', 'reflexion'], obligatoria: true },
];

/** Devuelve la posición de cada campo; primero busca nombres exactos y después nombres que empiecen igual. */
function ubicarColumnas(encabezados: unknown[], columnas: Columna[]): { posiciones: Record<string, number>; faltan: string[] } {
  const normalizados = encabezados.map((e) => normalizar(String(e ?? '')));
  const usadas = new Set<number>();
  const posiciones: Record<string, number> = {};
  const faltan: string[] = [];
  for (const col of columnas) {
    let pos = normalizados.findIndex((n, i) => !usadas.has(i) && col.alias.includes(n));
    if (pos < 0) {
      pos = normalizados.findIndex((n, i) => !usadas.has(i) && n !== '' && col.alias.some((a) => a.length > 2 && n.startsWith(a + ' ')));
    }
    if (pos >= 0) {
      posiciones[col.campo] = pos;
      usadas.add(pos);
    } else if (col.obligatoria) {
      faltan.push(col.nombre);
    }
  }
  return { posiciones, faltan };
}

function buscarHoja(libro: XLSX.WorkBook, nombre: string): XLSX.WorkSheet | undefined {
  const exacta = libro.SheetNames.find((n) => normalizar(n) === nombre);
  const parecida = exacta ?? libro.SheetNames.find((n) => normalizar(n).includes(nombre));
  return parecida ? libro.Sheets[parecida] : undefined;
}

function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\s+/g, ' ').trim();
}

function leerHoja(
  hoja: XLSX.WorkSheet,
  nombreHoja: string,
  columnas: Columna[],
  archivo: string,
  avisos: Aviso[],
): { fila: number; valores: Record<string, string> }[] | null {
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '', raw: true, blankrows: true });
  if (filas.length === 0) {
    avisos.push({ tipo: 'error', archivo, hoja: nombreHoja, mensaje: `La hoja «${nombreHoja}» está vacía.` });
    return null;
  }
  const { posiciones, faltan } = ubicarColumnas(filas[0], columnas);
  if (faltan.length > 0) {
    avisos.push({
      tipo: 'error',
      archivo,
      hoja: nombreHoja,
      mensaje: `A la hoja «${nombreHoja}» le faltan estas columnas: ${faltan.join(', ')}. Revisa que la primera fila tenga los encabezados.`,
    });
    return null;
  }
  const resultado: { fila: number; valores: Record<string, string> }[] = [];
  filas.slice(1).forEach((celdas, i) => {
    const valores: Record<string, string> = {};
    for (const [campo, pos] of Object.entries(posiciones)) valores[campo] = texto(celdas[pos]);
    // Las filas en blanco se saltan sin avisar.
    if (Object.values(valores).every((v) => v === '')) return;
    resultado.push({ fila: i + 2, valores });
  });
  return resultado;
}

export function leerExcel(datos: ArrayBuffer | Uint8Array, archivo: string, idiomaPorDefecto = 'es'): LecturaExcel {
  const avisos: Aviso[] = [];
  const lectura: LecturaExcel = { archivo, banco: [], reflexiones: [], avisos };

  let libro: XLSX.WorkBook;
  try {
    libro = XLSX.read(datos, { type: 'array' });
  } catch {
    avisos.push({ tipo: 'error', archivo, mensaje: 'No se pudo abrir el archivo. ¿Es un Excel (.xlsx)?' });
    return lectura;
  }

  const hojaBanco = buscarHoja(libro, 'banco');
  if (!hojaBanco) {
    avisos.push({ tipo: 'error', archivo, mensaje: 'El Excel no tiene la hoja «Banco» con las preguntas.' });
  } else {
    const filas = leerHoja(hojaBanco, 'Banco', COLUMNAS_BANCO, archivo, avisos) ?? [];
    lectura.banco = filas.map(({ fila, valores: v }) => ({
      fila,
      idioma: (v.idioma || idiomaPorDefecto).toLowerCase(),
      libro: v.libro,
      capitulo: v.capitulo,
      titulo: v.titulo,
      numero: v.numero,
      ronda: v.ronda,
      pregunta: v.pregunta,
      opciones: [v.a, v.b, v.c],
      correcta: v.correcta,
      explicacion: v.explicacion,
      cita: v.cita,
    }));
  }

  const hojaReflexiones = buscarHoja(libro, 'reflexiones') ?? buscarHoja(libro, 'reflexion');
  if (!hojaReflexiones) {
    avisos.push({
      tipo: 'advertencia',
      archivo,
      mensaje: 'El Excel no tiene la hoja «Reflexiones». Los capítulos quedarán sin pregunta de reflexión.',
    });
  } else {
    const filas = leerHoja(hojaReflexiones, 'Reflexiones', COLUMNAS_REFLEXIONES, archivo, avisos) ?? [];
    lectura.reflexiones = filas.map(({ fila, valores: v }) => ({
      fila,
      idioma: (v.idioma || idiomaPorDefecto).toLowerCase(),
      libro: v.libro,
      capitulo: v.capitulo,
      titulo: v.titulo ?? '',
      reflexion: v.reflexion,
    }));
  }

  return lectura;
}
