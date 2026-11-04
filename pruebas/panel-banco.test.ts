import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../app/src/contenido/claves';
import { deBase64, deHex } from '../app/src/contenido/codificacion';
import { abrirContenido } from '../app/src/contenido/formato';
import { armarVersion, capituloDelJuego, erroresDeEstructura, huellaCapitulo, type CapituloBanco } from '../panel/src/compartido/banco';
import { citaRara, filasParaExcel, leerExcelBanco, revisarCapitulos } from '../panel/src/revision';

const RAIZ = resolve(__dirname, '..');
const EXCEL_REAL = resolve(RAIZ, 'contenido/excel/Banco_Preguntas_Patriarcas_y_Profetas.xlsx');
const HAY_EXCEL = existsSync(EXCEL_REAL);
const LIBRO = 'patriarcas-y-profetas';
const publicado = () => abrirContenido(new Uint8Array(readFileSync(resolve(RAIZ, 'contenido/publicado/contenido.bin'))), { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) });

/** Un capítulo válido de prueba (6·6·6·2). */
function capitulo(numero: number): CapituloBanco {
  const rondas = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4];
  return {
    numero,
    titulo: `Capítulo ${numero}`,
    reflexion: '¿Qué aprendí?',
    preguntas: rondas.map((ronda, i) => ({ orden: i, numero: i + 1, ronda, texto: `¿Pregunta ${numero}.${i + 1}?`, opcion_a: `Uno ${i}`, opcion_b: `Dos ${i}`, opcion_c: `Tres ${i}`, correcta: i % 3, explicacion: 'Porque sí.', cita: 'Juan 3:16' })),
  };
}

describe('banco → juego', () => {
  it('la huella es la misma desde el banco y desde lo publicado', async () => {
    const contenido = await publicado();
    const cap = contenido.libros[LIBRO].idiomas.es.capitulos[3];
    const ida = capituloDelJuego(cap);
    // Mismo capítulo con las filas en otro orden (como pueden venir del Excel): misma huella.
    const desordenado = { ...ida, preguntas: [...ida.preguntas].reverse().map((p, i) => ({ ...p, orden: i })) };
    expect(await huellaCapitulo(desordenado)).toBe(await huellaCapitulo(ida));
    // Cambiar una explicación cambia la huella.
    const corregido = { ...ida, preguntas: ida.preguntas.map((p) => (p.numero === 10 ? { ...p, explicacion: p.explicacion + ' Más.' } : p)) };
    expect(await huellaCapitulo(corregido)).not.toBe(await huellaCapitulo(ida));
  });

  it('una versión nueva conserva lo publicado y agrega o reemplaza capítulos', async () => {
    const anterior = await publicado();
    const nueva = armarVersion({ anterior, libro: { id: LIBRO, titulo: 'Patriarcas y Profetas', idioma: 'es' }, capitulos: [capitulo(11)], version: anterior.version + 1, generado: '2026-11-04T00:00:00Z', mensaje: '¡Llegó el capítulo 11!' });
    const caps = nueva.libros[LIBRO].idiomas.es.capitulos;
    expect(caps.map((c) => c.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(caps[3]).toEqual(anterior.libros[LIBRO].idiomas.es.capitulos[3]);
    expect(nueva.mensaje).toBe('¡Llegó el capítulo 11!');
    expect(nueva.version).toBe(anterior.version + 1);
  });

  it('no deja publicar capítulos salteados, versiones viejas ni capítulos con errores', async () => {
    const anterior = await publicado();
    const datos = { anterior, libro: { id: LIBRO, titulo: 'Patriarcas y Profetas', idioma: 'es' }, generado: '', mensaje: '' };
    expect(() => armarVersion({ ...datos, capitulos: [capitulo(12)], version: anterior.version + 1 })).toThrow(/falta el capítulo 11/);
    expect(() => armarVersion({ ...datos, capitulos: [capitulo(11)], version: anterior.version })).toThrow(/mayor/);
    const roto = capitulo(11);
    roto.preguntas.pop();
    roto.preguntas[3].correcta = null;
    expect(erroresDeEstructura(roto).join(' | ')).toMatch(/19 preguntas.*rondas.*no tiene respuesta correcta/);
    expect(() => armarVersion({ ...datos, capitulos: [roto], version: anterior.version + 1 })).toThrow(/no se puede publicar/);
  });
});

describe('subir el banco', () => {
  it.skipIf(!HAY_EXCEL)('el Excel real: 10 capítulos, 200 preguntas, todos sin errores y con la misma huella que lo publicado', async () => {
    const leido = leerExcelBanco(readFileSync(EXCEL_REAL), 'banco.xlsx', LIBRO);
    expect(leido.errorArchivo).toBeNull();
    expect([leido.capitulos.length, leido.preguntas, leido.reflexiones]).toEqual([10, 200, 10]);
    const revisados = await revisarCapitulos(leido.capitulos, leido.capitulos, 'Patriarcas y Profetas');
    const conAvisos = revisados.filter((r) => r.avisos.length).map((r) => `${r.capitulo.numero}: ${r.avisos.map((a) => a.texto).join(' / ')}`);
    expect(revisados.every((r) => r.validacion !== 'errores')).toBe(true);
    expect(conAvisos).toEqual([]);
    const contenido = await publicado();
    for (const [i, cap] of contenido.libros[LIBRO].idiomas.es.capitulos.entries()) {
      expect(revisados[i].huella, `capítulo ${cap.numero}`).toBe(await huellaCapitulo(capituloDelJuego(cap)));
    }
  });

  it('un capítulo con 19 preguntas y una sin correcta queda como borrador con errores, sin frenar a los demás', async () => {
    const bueno = capitulo(1);
    const malo = capitulo(2);
    malo.preguntas.splice(14, 1);
    malo.preguntas[6].correcta = null;
    const [r1, r2] = await revisarCapitulos([bueno, malo], [bueno, malo], 'Patriarcas y Profetas');
    expect(r1.validacion).toBe('bien');
    expect(r2.validacion).toBe('errores');
    const textos = r2.avisos.map((a) => a.texto).join('\n');
    expect(textos).toMatch(/Tiene 19 preguntas; deben ser 20/);
    expect(textos).toMatch(/Pregunta 7: no tiene respuesta correcta/);
  });

  it('control de calidad: repetidas, la misma letra más de 9 veces y citas raras (solo advertencias)', async () => {
    const a = capitulo(1);
    const b = capitulo(2);
    b.preguntas[0].texto = a.preguntas[4].texto;
    b.preguntas.forEach((p) => (p.correcta = 1));
    b.preguntas[2].cita = 'juan tres dieciséis';
    const [, r] = await revisarCapitulos([a, b], [a, b], 'Patriarcas y Profetas');
    expect(r.validacion).toBe('advertencias');
    const textos = r.avisos.map((a) => a.texto).join('\n');
    expect(textos).toMatch(/Pregunta 1: ya está en el capítulo 1 \(pregunta 5\)/);
    expect(textos).toMatch(/correcta es la B en 20 de 20/);
    expect(textos).toMatch(/Pregunta 3: la cita «juan tres dieciséis» tiene un formato raro/);
    expect(['Isaías 53:5', '1 Juan 4:8', 'Génesis 1:1-3', 'Salmo 23', 'Juan 3:16, 18', 'Hechos 17:11'].filter(citaRara)).toEqual([]);
  });

  it('descargar el banco como Excel: las mismas columnas, y se vuelve a leer igual', () => {
    const caps = [capitulo(1), capitulo(2)];
    const { banco, reflexiones } = filasParaExcel(caps, 'Patriarcas y Profetas');
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(banco), 'Banco');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(reflexiones), 'Reflexiones');
    const otraVez = leerExcelBanco(new Uint8Array(XLSX.write(libro, { type: 'array', bookType: 'xlsx' })), 'copia.xlsx', LIBRO);
    expect(otraVez.errorArchivo).toBeNull();
    expect(otraVez.capitulos).toEqual(caps);
  });
});
