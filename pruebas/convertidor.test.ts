import * as ed from '@noble/ed25519';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../app/src/contenido/claves';
import { aHex, deBase64, deHex } from '../app/src/contenido/codificacion';
import { abrirContenido, empaquetarContenido, ErrorContenido } from '../app/src/contenido/formato';
import { RONDAS } from '../app/src/contenido/tipos';
import { armarContenido, idDeLibro, leerRonda } from '../convertidor/src/armar-contenido';
import { describirAviso } from '../convertidor/src/avisos';
import { crearArchivoClave, leerArchivoClave } from '../convertidor/src/clave-firma';
import { leerExcel } from '../convertidor/src/leer-excel';

const RAIZ = resolve(__dirname, '..');
const EXCEL_REAL = resolve(RAIZ, 'contenido/excel/Banco_Preguntas_Patriarcas_y_Profetas.xlsx');
// El Excel (con las respuestas) no se sube al repositorio: donde no está, sus pruebas se saltan.
const HAY_EXCEL = existsSync(EXCEL_REAL);

// ---------- Ayudas para armar Excels de prueba ----------

const ENCABEZADOS_BANCO = [
  'Libro', 'Capítulo', 'Título del capítulo', 'N.º', 'Ronda', 'Pregunta', 'Opción A', 'Opción B', 'Opción C',
  'Correcta', 'Explicación (se muestra al aprobar)', 'Cita', 'Revisado por', 'Fecha de revisión', 'Observaciones',
];
const RONDAS_TEXTO = ['1 Fácil', '2 Intermedia', '3 Avanzada', '4 Aplicación'];

type Fila = (string | number)[];

/** 20 filas válidas para un capítulo (6/6/6/2). */
function filasCapitulo(capitulo: number, libro = 'Patriarcas y Profetas'): Fila[] {
  const filas: Fila[] = [];
  let n = 1;
  RONDAS.forEach((r, i) => {
    for (let k = 0; k < r.cantidad; k++, n++) {
      filas.push([libro, capitulo, `Capítulo de prueba ${capitulo}`, n, RONDAS_TEXTO[i], `¿Pregunta ${n}?`,
        `Opción uno ${n}`, `Opción dos ${n}`, `Opción tres ${n}`, 'ABC'[n % 3], `Explicación ${n}`, 'Juan 3:16', '', '', '']);
    }
  });
  return filas;
}

function crearExcel(banco: Fila[], reflexiones: Fila[] | null, encabezados = ENCABEZADOS_BANCO): Uint8Array {
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet([encabezados, ...banco]), 'Banco');
  if (reflexiones) {
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.aoa_to_sheet([['Libro', 'Capítulo', 'Título del capítulo', 'Pregunta de reflexión (no se califica)'], ...reflexiones]),
      'Reflexiones',
    );
  }
  return new Uint8Array(XLSX.write(libro, { type: 'array', bookType: 'xlsx' }));
}

function reflexion(capitulo: number): Fila {
  return ['Patriarcas y Profetas', capitulo, `Capítulo de prueba ${capitulo}`, '¿Qué aprendí?'];
}

function convertir(banco: Fila[], reflexiones: Fila[] | null = [reflexion(1)], encabezados?: string[]) {
  return armarContenido([leerExcel(crearExcel(banco, reflexiones, encabezados), 'prueba.xlsx')]);
}

function mensajes(resultado: ReturnType<typeof convertir>, tipo: 'error' | 'advertencia') {
  return resultado.avisos.filter((a) => a.tipo === tipo).map(describirAviso);
}

// ---------- El Excel real de la autora ----------

describe('Excel real de Patriarcas y Profetas', () => {
  const resultado = armarContenido(HAY_EXCEL ? [leerExcel(readFileSync(EXCEL_REAL), 'Banco_Preguntas_Patriarcas_y_Profetas.xlsx')] : []);
  const libro = resultado.contenido.libros['patriarcas-y-profetas'];
  const capitulos = libro?.idiomas.es.capitulos ?? [];

  it.skipIf(!HAY_EXCEL)('sale sin errores ni advertencias', () => {
    expect(resultado.avisos.map(describirAviso)).toEqual([]);
    expect(resultado.hayErrores).toBe(false);
  });

  it.skipIf(!HAY_EXCEL)('tiene 10 capítulos seguidos, cada uno con 20 preguntas en rondas 6/6/6/2 y su reflexión', () => {
    expect(libro.idiomas.es.titulo).toBe('Patriarcas y Profetas');
    expect(capitulos.map((c) => c.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const c of capitulos) {
      expect(c.preguntas).toHaveLength(20);
      expect(RONDAS.map((r) => c.preguntas.filter((p) => p.ronda === r.numero).length)).toEqual([6, 6, 6, 2]);
      expect(c.reflexion.length).toBeGreaterThan(10);
      expect(c.titulo).not.toBe('');
    }
  });

  it.skipIf(!HAY_EXCEL)('las preguntas van ordenadas por ronda y la correcta apunta al texto correcto', () => {
    const cap4 = capitulos[3];
    expect(cap4.titulo).toBe('El plan de redención');
    expect(cap4.preguntas.map((p) => p.ronda)).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4]);
    const p9 = cap4.preguntas.find((p) => p.id === 9)!;
    expect(p9.texto).toBe('Al saber el precio, ¿qué pidieron Adán y Eva?');
    expect(p9.opciones[p9.correcta]).toBe('Que la pena cayera sobre ellos, no sobre Cristo');
    expect(p9.explicacion).toContain('remordimiento');
    expect(p9.cita).toBe('Isaías 53:5');
  });

  it.skipIf(!HAY_EXCEL)('incluye la pregunta más larga (capítulo 9, aplicación)', () => {
    const p19 = capitulos[8].preguntas.find((p) => p.id === 19)!;
    expect(p19.texto).toMatch(/^Si alguien te dice que la creación duró millones de años/);
    expect(p19.ronda).toBe(4);
  });

  it.skipIf(!HAY_EXCEL)('se empaqueta y el juego lo puede abrir con sus claves', async () => {
    const privada = ed.utils.randomPrivateKey();
    const publica = await ed.getPublicKeyAsync(privada);
    const cifrado = crypto.getRandomValues(new Uint8Array(32));
    const bin = await empaquetarContenido(resultado.contenido, { cifrado, firmaPrivada: privada });
    const abierto = await abrirContenido(bin, { cifrado, firmaPublica: publica });
    expect(abierto).toEqual(resultado.contenido);
    // Las respuestas no se leen a simple vista en el archivo.
    expect(new TextDecoder().decode(bin)).not.toContain('Que la pena cayera');
  });

  it('el contenido.bin publicado se abre con las claves del juego', async () => {
    const bin = new Uint8Array(readFileSync(resolve(RAIZ, 'contenido/publicado/contenido.bin')));
    const abierto = await abrirContenido(bin, { cifrado: deBase64(CLAVE_CIFRADO), firmaPublica: deHex(CLAVE_PUBLICA) });
    expect(abierto.libros['patriarcas-y-profetas'].idiomas.es.capitulos).toHaveLength(10);
  });
});

// ---------- Avisos ----------

describe('avisos del convertidor', () => {
  it('un capítulo correcto no da avisos', () => {
    const r = convertir(filasCapitulo(1));
    expect(r.avisos).toEqual([]);
    expect(r.contenido.libros['patriarcas-y-profetas'].idiomas.es.capitulos[0].preguntas).toHaveLength(20);
  });

  it('pregunta sin correcta', () => {
    const filas = filasCapitulo(1);
    filas[4][9] = '';
    expect(mensajes(convertir(filas), 'error')).toEqual(['Capítulo 1 · hoja Banco, fila 6: no tiene respuesta correcta.']);
  });

  it('letra de correcta inválida', () => {
    const filas = filasCapitulo(1);
    filas[0][9] = 'D';
    expect(mensajes(convertir(filas), 'error')).toEqual([
      'Capítulo 1 · hoja Banco, fila 2: la respuesta correcta «D» no es válida; debe ser A, B o C.',
    ]);
  });

  it('acepta la correcta en minúscula o con paréntesis', () => {
    const filas = filasCapitulo(1);
    filas[0][9] = 'b';
    filas[1][9] = ' C) ';
    const r = convertir(filas);
    expect(r.avisos).toEqual([]);
    const preguntas = r.contenido.libros['patriarcas-y-profetas'].idiomas.es.capitulos[0].preguntas;
    expect(preguntas.find((p) => p.id === 1)!.correcta).toBe(1);
    expect(preguntas.find((p) => p.id === 2)!.correcta).toBe(2);
  });

  it('capítulo con un número distinto de 20 preguntas', () => {
    const filas = filasCapitulo(1).slice(0, 19);
    expect(mensajes(convertir(filas), 'error')).toEqual([
      'Capítulo 1: tiene 19 preguntas; deben ser 20.',
      'Capítulo 1: las rondas tienen 6 fáciles, 6 intermedias, 6 avanzadas y 1 de aplicación; deben ser 6, 6, 6 y 2.',
    ]);
  });

  it('rondas que no son 6/6/6/2', () => {
    const filas = filasCapitulo(1);
    filas[6][4] = '1 Fácil'; // una intermedia pasa a fácil
    expect(mensajes(convertir(filas), 'error')).toEqual([
      'Capítulo 1: las rondas tienen 7 fáciles, 5 intermedias, 6 avanzadas y 2 de aplicación; deben ser 6, 6, 6 y 2.',
    ]);
  });

  it('ronda con texto desconocido', () => {
    const filas = filasCapitulo(1);
    filas[0][4] = '5 Experta';
    expect(mensajes(convertir(filas), 'error')[0]).toBe(
      'Capítulo 1 · hoja Banco, fila 2: la ronda «5 Experta» no es válida; usa «1 Fácil», «2 Intermedia», «3 Avanzada» o «4 Aplicación».',
    );
  });

  it('opción vacía', () => {
    const filas = filasCapitulo(1);
    filas[2][7] = '';
    expect(mensajes(convertir(filas), 'error')).toEqual(['Capítulo 1 · hoja Banco, fila 4: la opción B está vacía.']);
  });

  it('opciones repetidas (sin importar mayúsculas ni espacios)', () => {
    const filas = filasCapitulo(1);
    filas[3][8] = '  OPCIÓN uno 4 ';
    expect(mensajes(convertir(filas), 'error')).toEqual(['Capítulo 1 · hoja Banco, fila 5: las opciones A y C son iguales.']);
  });

  it('capítulo sin reflexión (advertencia, no impide generar)', () => {
    const r = convertir(filasCapitulo(1), []);
    expect(r.hayErrores).toBe(false);
    expect(mensajes(r, 'advertencia')).toEqual(['Capítulo 1: no tiene pregunta de reflexión en la hoja «Reflexiones».']);
  });

  it('Excel sin hoja de reflexiones', () => {
    const r = convertir(filasCapitulo(1), null);
    expect(r.hayErrores).toBe(false);
    expect(mensajes(r, 'advertencia')).toContain(
      'El Excel no tiene la hoja «Reflexiones». Los capítulos quedarán sin pregunta de reflexión.',
    );
  });

  it('N.º repetido', () => {
    const filas = filasCapitulo(1);
    filas[1][3] = 1;
    expect(mensajes(convertir(filas), 'error')).toEqual(['Capítulo 1 · hoja Banco, fila 3: el N.º 1 está repetido (también en la fila 2).']);
  });

  it('falta un capítulo intermedio', () => {
    const r = convertir([...filasCapitulo(1), ...filasCapitulo(3)], [reflexion(1), reflexion(3)]);
    expect(mensajes(r, 'error')).toEqual([
      'En «Patriarcas y Profetas» falta el capítulo 2: los capítulos deben ir seguidos desde el 1.',
    ]);
  });

  it('explicación o cita vacías son advertencias', () => {
    const filas = filasCapitulo(1);
    filas[0][10] = '';
    filas[1][11] = '';
    const r = convertir(filas);
    expect(r.hayErrores).toBe(false);
    expect(mensajes(r, 'advertencia')).toEqual([
      'Capítulo 1 · hoja Banco, fila 2: no tiene explicación (se muestra al acertar).',
      'Capítulo 1 · hoja Banco, fila 3: no tiene cita bíblica.',
    ]);
  });

  it('las filas en blanco se ignoran', () => {
    const filas = filasCapitulo(1);
    filas.splice(5, 0, ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    expect(convertir(filas).avisos).toEqual([]);
  });

  it('avisa si faltan columnas', () => {
    const sinCita = ENCABEZADOS_BANCO.map((e) => (e === 'Cita' ? 'Otra cosa' : e));
    expect(mensajes(convertir(filasCapitulo(1), [reflexion(1)], sinCita), 'error')[0]).toBe(
      'A la hoja «Banco» le faltan estas columnas: Cita. Revisa que la primera fila tenga los encabezados.',
    );
  });

  it('acepta variantes en los nombres de columnas', () => {
    const variantes = [
      'LIBRO', 'Capitulo', 'Titulo del capitulo', 'Nº', 'ronda', 'Pregunta', 'Opcion A', 'Opción B', 'Opción  C',
      'Respuesta correcta', 'Explicación breve', 'Cita bíblica', 'Revisado por', 'Fecha', 'Notas',
    ];
    expect(convertir(filasCapitulo(1), [reflexion(1)], variantes).avisos).toEqual([]);
  });

  it('admite varios libros y varios idiomas', () => {
    const conIdioma = (filas: Fila[], idioma: string) => filas.map((f) => [idioma, ...f]);
    const encabezados = ['Idioma', ...ENCABEZADOS_BANCO];
    const banco = [
      ...conIdioma(filasCapitulo(1), 'es'),
      ...conIdioma(filasCapitulo(1), 'en'),
      ...conIdioma(filasCapitulo(1, 'Profetas y Reyes'), 'es'),
    ];
    const r = armarContenido([leerExcel(crearExcel(banco, [], encabezados), 'varios.xlsx')]);
    expect(r.hayErrores).toBe(false);
    expect(Object.keys(r.contenido.libros).sort()).toEqual(['patriarcas-y-profetas', 'profetas-y-reyes']);
    expect(Object.keys(r.contenido.libros['patriarcas-y-profetas'].idiomas).sort()).toEqual(['en', 'es']);
  });

  it('lee las rondas en sus distintas formas', () => {
    expect(['1 Fácil', '1', 'Fácil', 'facil', '2 Intermedia', '3 avanzada', '4 Aplicación', 'Aplicacion'].map(leerRonda)).toEqual([
      1, 1, 1, 1, 2, 3, 4, 4,
    ]);
    expect(leerRonda('Difícil')).toBeNull();
    expect(idDeLibro('El Deseado de todas las gentes')).toBe('el-deseado-de-todas-las-gentes');
  });
});

// ---------- Protección del contenido ----------

describe('protección de contenido.bin', () => {
  async function prueba() {
    const privada = ed.utils.randomPrivateKey();
    const publica = await ed.getPublicKeyAsync(privada);
    const cifrado = crypto.getRandomValues(new Uint8Array(32));
    const contenido = convertir(filasCapitulo(1)).contenido;
    const bin = await empaquetarContenido(contenido, { cifrado, firmaPrivada: privada });
    return { privada, publica, cifrado, contenido, bin };
  }

  it('rechaza un archivo con un byte cambiado', async () => {
    const { publica, cifrado, bin } = await prueba();
    for (const pos of [5, 30, bin.length - 70, bin.length - 1]) {
      const alterado = bin.slice();
      alterado[pos] ^= 0x01;
      await expect(abrirContenido(alterado, { cifrado, firmaPublica: publica })).rejects.toMatchObject({ motivo: 'alterado' });
    }
  });

  it('rechaza un archivo firmado por otra clave', async () => {
    const { cifrado, contenido } = await prueba();
    const otra = ed.utils.randomPrivateKey();
    const bin = await empaquetarContenido(contenido, { cifrado, firmaPrivada: otra });
    const publicaDelJuego = await ed.getPublicKeyAsync(ed.utils.randomPrivateKey());
    await expect(abrirContenido(bin, { cifrado, firmaPublica: publicaDelJuego })).rejects.toBeInstanceOf(ErrorContenido);
  });

  it('rechaza archivos que no son de Berea', async () => {
    const { publica, cifrado } = await prueba();
    const basura = new TextEncoder().encode('esto no es contenido de berea'.repeat(10));
    await expect(abrirContenido(basura, { cifrado, firmaPublica: publica })).rejects.toMatchObject({ motivo: 'formato' });
  });

  it('cada conversión cifra distinto aunque el contenido sea el mismo', async () => {
    const { privada, cifrado, contenido, bin } = await prueba();
    const otraVez = await empaquetarContenido(contenido, { cifrado, firmaPrivada: privada });
    expect(aHex(otraVez)).not.toBe(aHex(bin));
  });

  it('la clave de firma se valida contra la clave pública del juego', async () => {
    const privada = ed.utils.randomPrivateKey();
    const publica = aHex(await ed.getPublicKeyAsync(privada));
    const archivo = JSON.stringify(crearArchivoClave(privada, deHex(publica)));
    expect(aHex(await leerArchivoClave(archivo, publica))).toBe(aHex(privada));
    await expect(leerArchivoClave(archivo, CLAVE_PUBLICA)).rejects.toThrow('no corresponde');
    await expect(leerArchivoClave('{"hola":1}', publica)).rejects.toThrow('no es una clave de firma');
  });
});
