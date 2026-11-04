import { describe, expect, it } from 'vitest';
import textos from '../app/src/textos/es.json';

describe('proyecto base', () => {
  it('tiene el nombre y el eslogan en el archivo de textos', () => {
    expect(textos.app.nombre).toBe('Berea');
    expect(textos.app.eslogan).toBe('Cada capítulo, un tesoro por descubrir.');
  });
});
