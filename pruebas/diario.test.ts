import { describe, expect, it } from 'vitest';
import { nombreSeguro } from '../app/src/app/archivos';
import type { LibroEnIdioma } from '../app/src/contenido/tipos';
import { diarioComoTexto, entradasDiario } from '../app/src/datos/diario';
import type { ProgresoLibro } from '../app/src/datos/tipos';

const libro: LibroEnIdioma = {
  titulo: 'Patriarcas y Profetas',
  capitulos: [
    { numero: 1, titulo: 'El origen del mal', reflexion: '¿Por qué obedezco yo a Dios?', preguntas: [] },
    { numero: 4, titulo: 'El plan de redención', reflexion: 'Cristo dejó el cielo para salvarme…', preguntas: [] },
  ],
};

const progreso: ProgresoLibro = {
  perfilId: 'p',
  libroId: 'patriarcas-y-profetas',
  capitulos: {},
  diario: {
    4: { texto: 'Que valgo muchísimo.', fecha: '2026-11-03T10:00:00Z' },
    1: { texto: 'Por amor.', fecha: '2026-11-01T10:00:00Z' },
  },
};

describe('Mi diario', () => {
  it('ordena las reflexiones por capítulo y agrega el título y la pregunta', () => {
    expect(entradasDiario(progreso, libro)).toEqual([
      { capitulo: 1, titulo: 'El origen del mal', pregunta: '¿Por qué obedezco yo a Dios?', texto: 'Por amor.', fecha: '2026-11-01T10:00:00Z' },
      { capitulo: 4, titulo: 'El plan de redención', pregunta: 'Cristo dejó el cielo para salvarme…', texto: 'Que valgo muchísimo.', fecha: '2026-11-03T10:00:00Z' },
    ]);
  });

  it('el archivo de texto trae el diario completo, en orden', () => {
    const texto = diarioComoTexto(entradasDiario(progreso, libro), {
      encabezado: 'MI DIARIO · BEREA',
      subtitulo: 'Joshua · Patriarcas y Profetas',
      guardadoEl: 'Guardado el 3 de noviembre de 2026',
      capitulo: (n, titulo) => `Capítulo ${n} · ${titulo}`,
      pregunta: 'Pregunta:',
      reflexion: 'Mi reflexión:',
    });
    expect(texto.startsWith('MI DIARIO · BEREA\r\nJoshua · Patriarcas y Profetas')).toBe(true);
    expect(texto.indexOf('Capítulo 1 · El origen del mal')).toBeLessThan(texto.indexOf('Capítulo 4 · El plan de redención'));
    expect(texto).toContain('Pregunta: ¿Por qué obedezco yo a Dios?\r\n\r\nMi reflexión:\r\nPor amor.');
  });

  it('nombres de archivo sin caracteres raros', () => {
    expect(nombreSeguro('María José')).toBe('Maria Jose');
    expect(nombreSeguro('***')).toBe('Berea');
  });
});
