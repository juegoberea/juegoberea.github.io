import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inicial } from '../app/src/componentes/Avatar';
import { COLORES_AVATAR, TAMANOS_LETRA } from '../app/src/datos/tipos';
import { variablesDelTema } from '../app/src/temas/aplicar';
import { temaVibrante } from '../app/src/temas/vibrante';
import es from '../app/src/textos/es.json';
import { numero, t } from '../app/src/textos';

const SRC = resolve(__dirname, '../app/src');

function archivos(carpeta: string, extensiones: RegExp): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta, extensiones);
    return extensiones.test(nombre) ? [ruta] : [];
  });
}

describe('tema Vibrante', () => {
  const normal = variablesDelTema(temaVibrante, 'normal');

  it('expone los valores aprobados como variables CSS', () => {
    expect(normal['--color-primary']).toBe('#2B2575');
    expect(normal['--color-surface-sunk']).toBe('#F6EEDF');
    expect(normal['--color-on-aplicacion']).toBe('#1F1B3D');
    expect(normal['--fuente']).toBe("'Nunito', 'Segoe UI', system-ui, sans-serif");
    expect(normal['--letra-display-tamano']).toBe('44px');
    expect(normal['--letra-display-peso']).toBe('900');
    expect(normal['--espacio-1']).toBe('4px');
    expect(normal['--espacio-7']).toBe('48px');
    expect(normal['--radio-lg']).toBe('24px');
    expect(normal['--sombra-pop']).toBe('0 4px 0 #1D1856');
    expect(normal['--tamano-tocable-min']).toBe('56px');
    expect(normal['--tamano-contenido-max']).toBe('560px');
    expect(normal['--mov-pantalla-ronda-ms']).toBe('2500ms');
  });

  it('tiene una variable por cada color del tema', () => {
    for (const nombre of Object.keys(temaVibrante.color)) {
      const variable = `--color-${nombre.replace(/[A-Z]/g, (l) => '-' + l.toLowerCase())}`;
      expect(normal[variable], variable).toBe(temaVibrante.color[nombre as keyof typeof temaVibrante.color]);
    }
  });

  it('los 3 tamaños de letra cambian pregunta, opción y texto', () => {
    const tamanos = TAMANOS_LETRA.map((n) => {
      const v = variablesDelTema(temaVibrante, n);
      return [v['--letra-pregunta-tamano'], v['--letra-opcion-tamano'], v['--letra-texto-tamano']];
    });
    expect(tamanos).toEqual([
      ['22px', '18px', '17px'],
      ['25px', '21px', '19px'],
      ['28px', '23px', '22px'],
    ]);
    // El resto no cambia con el tamaño elegido.
    expect(variablesDelTema(temaVibrante, 'muyGrande')['--letra-titulo-tamano']).toBe('28px');
  });

  it('los avatares usan colores del tema; solo el naranja lleva la inicial oscura', () => {
    expect(COLORES_AVATAR.map((c) => normal[`--avatar-${c}`])).toEqual(['#0A7470', '#1F5FD6', '#7A3FD1', '#F08A24', '#C8283F', '#2B2575']);
    expect(normal['--avatar-naranja-texto']).toBe('#1F1B3D');
    expect(normal['--avatar-azul-texto']).toBe('#FFFFFF');
  });
});

describe('reglas del tema en el código', () => {
  const codigo = [
    ...archivos(join(SRC, 'componentes'), /\.(tsx|css)$/),
    ...archivos(join(SRC, 'pantallas'), /\.(tsx|css)$/),
    join(SRC, 'temas/base.css'),
  ];
  const definidas = new Set(Object.keys(variablesDelTema(temaVibrante)));
  // Variables locales que arman los propios componentes a partir del tema.
  const locales = new Set(['--ronda', '--ronda-soft', '--ronda-ink', '--ronda-on', '--avatar', '--avatar-texto', '--giro', '--deriva', '--separacion', '--renglon']);

  it('ningún componente ni pantalla escribe colores ni fuentes a mano', () => {
    const problemas: string[] = [];
    for (const ruta of codigo) {
      const texto = readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of texto.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|font-family:\s*(?!var\(|inherit)['"\w]/g)) {
        if (ruta.endsWith('base.css') && m[0].startsWith('font-family')) continue; // @font-face define la fuente
        problemas.push(`${ruta.replace(SRC, 'app/src')}: ${m[0]}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('todas las variables CSS que se usan existen en el tema', () => {
    const desconocidas = new Set<string>();
    for (const ruta of codigo) {
      for (const [, nombre] of readFileSync(ruta, 'utf8').matchAll(/var\((--[\w-]+)/g)) {
        if (nombre.endsWith('-')) continue; // nombre armado en el código, p. ej. `var(--avatar-${color})`
        if (!definidas.has(nombre) && !locales.has(nombre)) desconocidas.add(nombre);
      }
    }
    expect([...desconocidas]).toEqual([]);
  });

  it('todos los textos que usan los componentes existen en es.json', () => {
    const faltan: string[] = [];
    for (const ruta of archivos(SRC, /\.tsx$/)) {
      for (const [, clave] of readFileSync(ruta, 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)) {
        if (t(clave) === clave) faltan.push(clave);
      }
    }
    expect(faltan).toEqual([]);
  });
});

describe('textos', () => {
  it('reemplaza las marcas', () => {
    expect(t('componentes.ronda', { n: 2, nombre: t('rondas.2') })).toBe('Ronda 2 · Intermedia');
    expect(t('rondas.4')).toBe('Aplicación');
    expect(t('no.existe')).toBe('no.existe');
    expect(es.app.nombre).toBe('Berea');
  });

  it('formatea números con punto de miles, como en los diseños', () => {
    expect([0, 60, 950, 1080, 4500, 21800, 146000, 1234567].map(numero)).toEqual([
      '0', '60', '950', '1.080', '4.500', '21.800', '146.000', '1.234.567',
    ]);
  });

  it('la inicial del avatar', () => {
    expect([inicial('sofi'), inicial('  Ángel'), inicial('Ñandú'), inicial('')]).toEqual(['S', 'Á', 'Ñ', '?']);
  });
});
