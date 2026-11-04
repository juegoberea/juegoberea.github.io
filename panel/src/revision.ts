// Revisión del banco: lee el Excel con el MISMO lector del convertidor y valida cada capítulo con
// sus MISMAS reglas. Diferencia: un capítulo con errores no frena a los demás; queda como borrador.
// Además, el control de calidad del panel (P3), que solo da advertencias.

import { armarContenido, idDeLibro, leerCorrecta, leerEntero, leerRonda } from '../../convertidor/src/armar-contenido';
import type { Aviso } from '../../convertidor/src/avisos';
import { leerExcel, type FilaBanco, type LecturaExcel } from '../../convertidor/src/leer-excel';
import { RONDAS } from '../../app/src/contenido/tipos';
import { huellaCapitulo, type CapituloBanco, type FilaPregunta } from './compartido/banco';
import type { Validacion } from './estados';

export interface AvisoPanel {
  tipo: 'error' | 'advertencia';
  texto: string;
}

export interface CapituloRevisado {
  capitulo: CapituloBanco;
  validacion: Validacion;
  avisos: AvisoPanel[];
  huella: string;
}

/** Medición en 360 × 740: px que sobran (negativo = faltan) para cada pregunta y tamaño de letra. */
export interface Medicion {
  normal: number;
  grande: number;
  muyGrande: number;
  /** Por orden de la pregunta: [normal, grande, muy grande]. */
  preguntas: Record<number, [number, number, number]>;
}

const LETRAS = ['A', 'B', 'C'];
const RONDA_TEXTO = (r: number | null) => (r ? `${r} ${RONDAS[r - 1].nombre}` : '');

/** El banco en el mismo formato que lee el convertidor, para validar con sus reglas. */
function comoLectura(capitulos: CapituloBanco[], tituloLibro: string): LecturaExcel & { filaDe: Map<number, { capitulo: number; pregunta: FilaPregunta }> } {
  const filaDe = new Map<number, { capitulo: number; pregunta: FilaPregunta }>();
  let fila = 2;
  const banco: FilaBanco[] = [];
  for (const c of capitulos) {
    for (const p of c.preguntas) {
      filaDe.set(fila, { capitulo: c.numero, pregunta: p });
      banco.push({
        fila: fila++,
        idioma: 'es',
        libro: tituloLibro,
        capitulo: String(c.numero),
        titulo: c.titulo,
        numero: p.numero === null ? '' : String(p.numero),
        ronda: RONDA_TEXTO(p.ronda),
        pregunta: p.texto,
        opciones: [p.opcion_a, p.opcion_b, p.opcion_c],
        correcta: p.correcta === null ? '' : LETRAS[p.correcta],
        explicacion: p.explicacion,
        cita: p.cita,
      });
    }
  }
  const reflexiones = capitulos.filter((c) => c.reflexion).map((c, i) => ({ fila: i + 2, idioma: 'es', libro: tituloLibro, capitulo: String(c.numero), titulo: c.titulo, reflexion: c.reflexion }));
  return { archivo: 'banco', banco, reflexiones, avisos: [], filaDe };
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Valida cada capítulo con las reglas del convertidor (sin la regla de «capítulos seguidos», que se mira al publicar). */
export function validarCapitulos(capitulos: CapituloBanco[], tituloLibro: string): Map<number, AvisoPanel[]> {
  const lectura = comoLectura(capitulos, tituloLibro);
  const { avisos } = armarContenido([lectura]);
  const porCapitulo = new Map<number, AvisoPanel[]>(capitulos.map((c) => [c.numero, []]));
  for (const a of avisos) {
    const capitulo = Number(a.capitulo);
    if (!porCapitulo.has(capitulo)) continue;
    const lugar = a.fila !== undefined && a.hoja !== 'Reflexiones' ? lectura.filaDe.get(a.fila)?.pregunta : undefined;
    const quien = lugar ? `Pregunta ${lugar.numero ?? `de la fila ${lugar.orden + 1}`}: ` : '';
    porCapitulo.get(capitulo)!.push({ tipo: a.tipo, texto: quien ? quien + a.mensaje : mayuscula(a.mensaje) });
  }
  return porCapitulo;
}

// ---------- Control de calidad (P3): solo advertencias ----------

const comparable = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** «Isaías 53:5», «1 Juan 4:8», «Génesis 1:1-3», «Salmo 23», «Juan 3:16, 18»… */
const CITA = /^(?:[1-3]\s)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s(?:de\s(?:los\s)?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\.?\s\d{1,3}(?::\d{1,3}(?:\s?[-–]\s?\d{1,3})?(?:,\s?\d{1,3}(?:\s?[-–]\s?\d{1,3})?)*)?(?:\s?[;y]\s?.+)?$/;

export function citaRara(cita: string): boolean {
  return cita.trim() !== '' && !CITA.test(cita.trim());
}

export function revisarCalidad(capitulo: CapituloBanco, libro: CapituloBanco[], medicion: Medicion | null): AvisoPanel[] {
  const avisos: AvisoPanel[] = [];
  const nombre = (p: FilaPregunta) => `Pregunta ${p.numero ?? `de la fila ${p.orden + 1}`}`;

  // Preguntas repetidas en el libro.
  const vistas = new Map<string, string>();
  for (const c of libro) {
    for (const p of c.preguntas) {
      const clave = comparable(p.texto);
      if (!clave) continue;
      if (c.numero === capitulo.numero) continue;
      if (!vistas.has(clave)) vistas.set(clave, `el capítulo ${c.numero} (pregunta ${p.numero ?? '?'})`);
    }
  }
  const enEste = new Map<string, FilaPregunta>();
  for (const p of capitulo.preguntas) {
    const clave = comparable(p.texto);
    if (!clave) continue;
    const otra = enEste.get(clave);
    if (otra) avisos.push({ tipo: 'advertencia', texto: `${nombre(p)}: es igual a la pregunta ${otra.numero ?? '?'} de este capítulo.` });
    else if (vistas.has(clave)) avisos.push({ tipo: 'advertencia', texto: `${nombre(p)}: ya está en ${vistas.get(clave)}.` });
    enEste.set(clave, p);
  }

  // La correcta en la misma letra más de 9 veces de 20.
  for (const [i, letra] of LETRAS.entries()) {
    const veces = capitulo.preguntas.filter((p) => p.correcta === i).length;
    if (veces > 9) avisos.push({ tipo: 'advertencia', texto: `La respuesta correcta es la ${letra} en ${veces} de ${capitulo.preguntas.length} preguntas. En el juego se mezclan, pero conviene repartirlas.` });
  }

  // Citas con formato raro.
  for (const p of capitulo.preguntas) {
    if (citaRara(p.cita)) avisos.push({ tipo: 'advertencia', texto: `${nombre(p)}: la cita «${p.cita}» tiene un formato raro (se espera, por ejemplo, «Juan 3:16»).` });
  }

  // Opciones demasiado largas: la pregunta no entra en 360 × 740 con letra muy grande.
  if (medicion) {
    for (const p of capitulo.preguntas) {
      const sobra = medicion.preguntas[p.orden]?.[2];
      if (sobra !== undefined && sobra < 0) avisos.push({ tipo: 'advertencia', texto: `${nombre(p)}: no entra en celular con letra muy grande (faltan ${-sobra} px). Acorta la pregunta o las opciones.` });
    }
  }
  return avisos;
}

/** Validación + calidad + huella de cada capítulo. */
export async function revisarCapitulos(capitulos: CapituloBanco[], libro: CapituloBanco[], tituloLibro: string, mediciones: Map<number, Medicion | null> = new Map()): Promise<CapituloRevisado[]> {
  const reglas = validarCapitulos(capitulos, tituloLibro);
  return Promise.all(
    capitulos.map(async (capitulo) => {
      const avisos = [...(reglas.get(capitulo.numero) ?? []), ...revisarCalidad(capitulo, libro, mediciones.get(capitulo.numero) ?? null)];
      const validacion: Validacion = avisos.some((a) => a.tipo === 'error') ? 'errores' : avisos.length ? 'advertencias' : 'bien';
      return { capitulo, validacion, avisos, huella: await huellaCapitulo(capitulo) };
    }),
  );
}

// ---------- Excel ----------

export interface ExcelLeido {
  /** Error que impide leer el archivo entero (no es un Excel, faltan columnas…). */
  errorArchivo: string | null;
  capitulos: CapituloBanco[];
  preguntas: number;
  reflexiones: number;
  /** Filas de otros libros o idiomas que se ignoraron. */
  ignoradas: number;
}

/** Lee el Excel de la autora y lo separa en capítulos del libro, tal como vienen (aunque tengan errores). */
export function leerExcelBanco(datos: ArrayBuffer | Uint8Array, archivo: string, libroId: string): ExcelLeido {
  const lectura = leerExcel(datos, archivo);
  const errorArchivo = lectura.avisos.find((a: Aviso) => a.tipo === 'error')?.mensaje ?? null;
  const porCapitulo = new Map<number, CapituloBanco>();
  let ignoradas = 0;
  for (const fila of lectura.banco) {
    const numero = leerEntero(fila.capitulo);
    if (idDeLibro(fila.libro) !== libroId || fila.idioma !== 'es' || numero === null) {
      ignoradas++;
      continue;
    }
    let cap = porCapitulo.get(numero);
    if (!cap) porCapitulo.set(numero, (cap = { numero, titulo: fila.titulo, reflexion: '', preguntas: [] }));
    if (!cap.titulo && fila.titulo) cap.titulo = fila.titulo;
    cap.preguntas.push({
      orden: cap.preguntas.length,
      numero: leerEntero(fila.numero),
      ronda: leerRonda(fila.ronda),
      texto: fila.pregunta,
      opcion_a: fila.opciones[0],
      opcion_b: fila.opciones[1],
      opcion_c: fila.opciones[2],
      correcta: leerCorrecta(fila.correcta),
      explicacion: fila.explicacion,
      cita: fila.cita,
    });
  }
  let reflexiones = 0;
  for (const r of lectura.reflexiones) {
    const cap = porCapitulo.get(leerEntero(r.capitulo) ?? -1);
    if (cap && idDeLibro(r.libro) === libroId && r.reflexion && !cap.reflexion) {
      cap.reflexion = r.reflexion;
      reflexiones++;
    }
  }
  const capitulos = [...porCapitulo.values()].sort((a, b) => a.numero - b.numero);
  return { errorArchivo, capitulos, preguntas: capitulos.reduce((s, c) => s + c.preguntas.length, 0), reflexiones, ignoradas };
}

/** El banco con las mismas columnas del Excel de la autora: hojas «Banco» y «Reflexiones». */
export function filasParaExcel(capitulos: CapituloBanco[], tituloLibro: string): { banco: (string | number)[][]; reflexiones: (string | number)[][] } {
  const banco: (string | number)[][] = [[
    'Libro', 'Capítulo', 'Título del capítulo', 'N.º', 'Ronda', 'Pregunta', 'Opción A', 'Opción B', 'Opción C',
    'Correcta', 'Explicación (se muestra al aprobar)', 'Cita', 'Revisado por', 'Fecha de revisión', 'Observaciones',
  ]];
  const reflexiones: (string | number)[][] = [['Libro', 'Capítulo', 'Título del capítulo', 'Pregunta de reflexión (no se califica)']];
  for (const c of [...capitulos].sort((a, b) => a.numero - b.numero)) {
    for (const p of [...c.preguntas].sort((a, b) => a.orden - b.orden)) {
      banco.push([tituloLibro, c.numero, c.titulo, p.numero ?? '', RONDA_TEXTO(p.ronda), p.texto, p.opcion_a, p.opcion_b, p.opcion_c, p.correcta === null ? '' : LETRAS[p.correcta], p.explicacion, p.cita, '', '', '']);
    }
    reflexiones.push([tituloLibro, c.numero, c.titulo, c.reflexion]);
  }
  return { banco, reflexiones };
}
