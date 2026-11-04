import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { variablesDelTema } from '../app/src/temas/aplicar';
import { temaVibrante } from '../app/src/temas/vibrante';
import {
  correoDeUsuario, describirCapitulos, describirNavegador, estadoCapitulo, fechaCorta, fechaDia,
  necesitanAtencion, resumenLibro, type FilaCapitulo,
} from '../panel/src/estados';
import { t } from '../panel/src/textos';

const PANEL = resolve(__dirname, '../panel/src');
// Variables locales: colores de ronda (base.css del juego, .ronda-N) y la etiqueta «CORRECTA» de la vista previa.
const RONDA = new Set(['--ronda', '--ronda-soft', '--ronda-ink', '--ronda-on', '--etiqueta']);
const MIGRACIONES = resolve(__dirname, '../supabase/migrations');

function archivos(carpeta: string, extensiones: RegExp): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta, extensiones);
    return extensiones.test(nombre) ? [ruta] : [];
  });
}

const cap = (numero: number, validacion: FilaCapitulo['validacion'], huella: string, huella_publicada: string | null, avisos: FilaCapitulo['avisos'] = []): FilaCapitulo =>
  ({ numero, titulo: `Capítulo ${numero}`, validacion, avisos, huella, huella_publicada });

describe('estado de cada capítulo', () => {
  it('se calcula con la validación y las huellas', () => {
    expect(estadoCapitulo(cap(1, 'bien', 'a', 'a'))).toBe('publicado');
    expect(estadoCapitulo(cap(1, 'advertencias', 'a', 'a'))).toBe('publicado');
    expect(estadoCapitulo(cap(1, 'bien', 'b', 'a'))).toBe('correccion');
    expect(estadoCapitulo(cap(1, 'bien', 'a', null))).toBe('listo');
    expect(estadoCapitulo(cap(1, 'advertencias', 'a', null))).toBe('advertencias');
    expect(estadoCapitulo(cap(1, 'advertencias', 'b', 'a'))).toBe('advertencias');
    expect(estadoCapitulo(cap(1, 'errores', 'a', 'a'))).toBe('errores');
  });

  it('el resumen del libro cuadra como en el diseño 03', () => {
    // 10 publicados (uno con corrección), 2 listos, 1 con advertencias, 1 con errores, de 73.
    const capitulos = [
      ...Array.from({ length: 10 }, (_, i) => cap(i + 1, 'bien', i === 3 ? 'nueva' : 'x', 'x')),
      cap(11, 'bien', 'n', null), cap(12, 'bien', 'n', null),
      cap(13, 'advertencias', 'n', null, [{ tipo: 'advertencia', texto: '2 preguntas sin cita' }]),
      cap(14, 'errores', 'n', null, [{ tipo: 'error', texto: '19 de 20 preguntas' }]),
    ];
    expect(resumenLibro(capitulos, 73)).toEqual({ escritos: 14, publicados: 10, listos: 2, advertencias: 1, errores: 1, sinEscribir: 59, nuevos: 2, correcciones: 1, cambios: 3 });
    expect(necesitanAtencion(capitulos)).toEqual([
      { numero: 14, tipo: 'error', texto: '19 de 20 preguntas' },
      { numero: 13, tipo: 'advertencia', texto: '2 preguntas sin cita' },
    ]);
  });

  it('sin capítulos: todo sin escribir', () => {
    expect(resumenLibro([], 73)).toMatchObject({ escritos: 0, sinEscribir: 73, cambios: 0 });
  });
});

describe('entrar', () => {
  it('basta con escribir «sharon»', () => {
    expect(correoDeUsuario('sharon')).toBe('sharon@berea.invalid');
    expect(correoDeUsuario('  Sharon ')).toBe('sharon@berea.invalid');
    expect(correoDeUsuario('sharon@berea.invalid')).toBe('sharon@berea.invalid');
  });

  it('describe el navegador para el registro', () => {
    expect(describirNavegador('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0')).toBe('Windows · Edge');
    expect(describirNavegador('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36')).toBe('Windows · Chrome');
    expect(describirNavegador('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36')).toBe('Android · Chrome');
  });
});

describe('fechas y textos del panel', () => {
  const ahora = new Date(2026, 10, 4, 15, 0);
  it('hoy, ayer o la fecha', () => {
    expect(fechaCorta(new Date(2026, 10, 4, 13, 52).toISOString(), ahora)).toBe('Hoy, 13:52');
    expect(fechaCorta(new Date(2026, 10, 3, 9, 5).toISOString(), ahora)).toBe('Ayer, 09:05');
    expect(fechaCorta(new Date(2026, 9, 22, 10, 0).toISOString(), ahora)).toBe('22 oct 2026');
    expect(fechaDia(new Date(2026, 0, 1).toISOString())).toBe('1 ene 2026');
  });

  it('describe los capítulos de una versión', () => {
    expect(describirCapitulos([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe('capítulos 1 a 10');
    expect(describirCapitulos([4])).toBe('capítulo 4');
    expect(describirCapitulos([12, 1, 2, 3, 11])).toBe('capítulos 1 a 3, 11 a 12');
  });

  it('todos los textos que usa el panel existen', () => {
    const faltan: string[] = [];
    for (const ruta of archivos(PANEL, /\.tsx?$/)) {
      for (const [, clave] of readFileSync(ruta, 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)) if (t(clave) === clave) faltan.push(clave);
    }
    expect(faltan).toEqual([]);
  });

  it('ningún color ni fuente escrito a mano, y solo variables del tema', () => {
    const definidas = new Set(Object.keys(variablesDelTema(temaVibrante)));
    const problemas: string[] = [];
    for (const ruta of archivos(PANEL, /\.(tsx|css)$/)) {
      const texto = readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of texto.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|font-family:/g)) problemas.push(`${ruta}: ${m[0]}`);
      for (const [, nombre] of texto.matchAll(/var\((--[\w-]+)/g)) if (!definidas.has(nombre) && !RONDA.has(nombre)) problemas.push(`${ruta}: ${nombre}`);
    }
    expect(problemas).toEqual([]);
  });
});

describe('base de datos', () => {
  const sql = archivos(MIGRACIONES, /\.sql$/).map((r) => readFileSync(r, 'utf8')).join('\n');

  it('toda tabla pública tiene las reglas de acceso (RLS) activadas', () => {
    const tablas = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
    expect(tablas.length).toBeGreaterThan(0);
    for (const tabla of tablas) expect(sql, tabla).toContain(`alter table public.${tabla} enable row level security`);
  });

  it('las reglas solo dejan pasar a la autora con el código puesto', () => {
    const reglas = [...sql.matchAll(/create policy \w+ on public\.\w+[^;]+;/g)].map((m) => m[0]);
    expect(reglas.length).toBeGreaterThan(0);
    for (const regla of reglas) {
      expect(regla).toMatch(/to authenticated/);
      expect(regla).toMatch(/public\.es_autora\(\)/);
      expect(regla).not.toMatch(/es_autora_sin_codigo/);
    }
  });

  it('el registro de actividad no se puede cambiar ni borrar', () => {
    expect(sql).toContain('revoke update, delete, truncate on public.registro from authenticated');
    expect(sql).not.toMatch(/create policy \w+ on public\.registro for (update|delete|all)/);
  });

  it('la autora se reconoce por su id, no por el correo', () => {
    expect(sql).toContain("insert into privado.config (autora_id) values ('c8846839-8fed-4204-bf18-44338f330d87')");
    expect(sql).not.toMatch(/auth\.(jwt\(\)\s*->>\s*'email'|email\(\))/);
  });
});
