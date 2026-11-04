// Cálculos del panel sin pantalla ni Supabase, para poder probarlos.

import { t } from './textos';

export type Validacion = 'errores' | 'advertencias' | 'bien';

export interface FilaCapitulo {
  numero: number;
  titulo: string;
  validacion: Validacion;
  avisos: { tipo: 'error' | 'advertencia'; texto: string }[];
  huella: string;
  huella_publicada: string | null;
}

export type EstadoCapitulo = 'publicado' | 'correccion' | 'listo' | 'advertencias' | 'errores';

/**
 * El estado se calcula, no se guarda: validación + si cambió desde la última publicación.
 * Un capítulo publicado que no cambió sigue «publicado» aunque tenga advertencias.
 */
export function estadoCapitulo(c: FilaCapitulo): EstadoCapitulo {
  if (c.validacion === 'errores') return 'errores';
  if (c.huella_publicada !== null && c.huella === c.huella_publicada) return 'publicado';
  if (c.validacion === 'advertencias') return 'advertencias';
  return c.huella_publicada !== null ? 'correccion' : 'listo';
}

export interface ResumenLibro {
  escritos: number;
  publicados: number;
  listos: number;
  advertencias: number;
  errores: number;
  sinEscribir: number;
  /** Lo que se publicaría con las casillas marcadas por defecto: nuevos listos y correcciones. */
  nuevos: number;
  correcciones: number;
  cambios: number;
}

export function resumenLibro(capitulos: FilaCapitulo[], totalCapitulos: number): ResumenLibro {
  const cuenta = { publicado: 0, correccion: 0, listo: 0, advertencias: 0, errores: 0 };
  for (const c of capitulos) cuenta[estadoCapitulo(c)]++;
  return {
    escritos: capitulos.length,
    // Un capítulo con una corrección pendiente lo siguen teniendo los jugadores: cuenta como publicado.
    publicados: cuenta.publicado + cuenta.correccion,
    listos: cuenta.listo,
    advertencias: cuenta.advertencias,
    errores: cuenta.errores,
    sinEscribir: Math.max(0, totalCapitulos - capitulos.length),
    nuevos: cuenta.listo,
    correcciones: cuenta.correccion,
    cambios: cuenta.listo + cuenta.correccion,
  };
}

/** Capítulos con errores primero y luego con advertencias, con su primer aviso. */
export function necesitanAtencion(capitulos: FilaCapitulo[]): { numero: number; tipo: 'error' | 'advertencia'; texto: string }[] {
  return capitulos
    .flatMap((c) => {
      const estado = estadoCapitulo(c);
      if (estado !== 'errores' && estado !== 'advertencias') return [];
      const tipo = estado === 'errores' ? 'error' : 'advertencia';
      const aviso = c.avisos.find((a) => a.tipo === tipo) ?? c.avisos[0];
      return [{ numero: c.numero, tipo: tipo as 'error' | 'advertencia', texto: aviso?.texto ?? '' }];
    })
    .sort((a, b) => (a.tipo === b.tipo ? a.numero - b.numero : a.tipo === 'error' ? -1 : 1));
}

/** «sharon» → «sharon@berea.invalid». Si ya trae @, se deja igual. */
export function correoDeUsuario(usuario: string): string {
  const limpio = usuario.trim().toLowerCase();
  return limpio.includes('@') ? limpio : `${limpio}@berea.invalid`;
}

/** «Windows · Edge», «Android · Chrome»… a partir del agente del navegador. */
export function describirNavegador(agente: string): string {
  const sistema = /Android/i.test(agente) ? 'Android'
    : /iPhone|iPad/i.test(agente) ? 'iPhone'
    : /Windows/i.test(agente) ? 'Windows'
    : /Mac OS/i.test(agente) ? 'Mac'
    : /Linux/i.test(agente) ? 'Linux'
    : 'Otro';
  const navegador = /Edg\//.test(agente) ? 'Edge'
    : /OPR\//.test(agente) ? 'Opera'
    : /Firefox\//.test(agente) ? 'Firefox'
    : /Chrome\//.test(agente) ? 'Chrome'
    : /Safari\//.test(agente) ? 'Safari'
    : 'otro navegador';
  return `${sistema} · ${navegador}`;
}

const dosCifras = (n: number) => String(n).padStart(2, '0');

/** «Hoy, 13:52», «Ayer, 09:05» o «22 oct 2026», en la hora del aparato. */
export function fechaCorta(iso: string, ahora = new Date()): string {
  const fecha = new Date(iso);
  const hora = `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(ahora) - dia(fecha)) / 86_400_000);
  if (dias === 0) return t('fechas.hoy', { hora });
  if (dias === 1) return t('fechas.ayer', { hora });
  return fechaDia(iso);
}

/** «22 oct 2026». */
export function fechaDia(iso: string): string {
  const fecha = new Date(iso);
  return `${fecha.getDate()} ${t('fechas.meses').split(' ')[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/** [1,2,3,4,5,6,7,8,9,10] → «capítulos 1 a 10»; [4] → «capítulo 4»; [1,2,5] → «capítulos 1 a 2, 5». */
export function describirCapitulos(numeros: number[]): string {
  const ordenados = [...new Set(numeros)].sort((a, b) => a - b);
  if (ordenados.length === 1) return t('capitulosTexto.uno', { n: ordenados[0] });
  const tramos: string[] = [];
  for (let i = 0; i < ordenados.length; ) {
    let j = i;
    while (j + 1 < ordenados.length && ordenados[j + 1] === ordenados[j] + 1) j++;
    tramos.push(i === j ? String(ordenados[i]) : t('capitulosTexto.tramo', { desde: ordenados[i], hasta: ordenados[j] }));
    i = j + 1;
  }
  return t('capitulosTexto.varios', { lista: tramos.join(', ') });
}
