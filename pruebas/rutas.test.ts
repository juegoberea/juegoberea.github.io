import { describe, expect, it } from 'vitest';
import { esMenu, escribirRuta, leerRuta, necesitaPerfil, type Ruta } from '../app/src/app/rutas';
import { ordinalIntento } from '../app/src/textos';

describe('rutas', () => {
  it('ida y vuelta entre la ruta y la dirección', () => {
    const rutas: Ruta[] = [
      { pantalla: 'bienvenida' },
      { pantalla: 'perfiles' },
      { pantalla: 'perfil-nuevo' },
      { pantalla: 'biblioteca' },
      { pantalla: 'capitulos', libro: 'patriarcas-y-profetas' },
      { pantalla: 'capitulo', libro: 'patriarcas-y-profetas', numero: 4 },
      { pantalla: 'jugar', libro: 'patriarcas-y-profetas', numero: 4 },
      { pantalla: 'resultado', libro: 'patriarcas-y-profetas', numero: 12 },
      { pantalla: 'resumen', libro: 'patriarcas-y-profetas', numero: 12 },
      { pantalla: 'reflexion', libro: 'patriarcas-y-profetas', numero: 3 },
      { pantalla: 'terminado', libro: 'patriarcas-y-profetas' },
      { pantalla: 'diario', libro: 'patriarcas-y-profetas' },
      { pantalla: 'progreso', libro: 'patriarcas-y-profetas' },
      { pantalla: 'ajustes' },
    ];
    for (const ruta of rutas) expect(leerRuta(escribirRuta(ruta))).toEqual(ruta);
  });

  it('direcciones desconocidas o vacías llevan a la bienvenida', () => {
    expect(leerRuta('')).toEqual({ pantalla: 'bienvenida' });
    expect(leerRuta('#/cualquier-cosa')).toEqual({ pantalla: 'bienvenida' });
    expect(leerRuta('#/libro/x/capitulo/cero')).toEqual({ pantalla: 'capitulos', libro: 'x' });
  });

  it('qué pantallas piden perfil y en cuáles puede sonar música', () => {
    expect(necesitaPerfil({ pantalla: 'biblioteca' })).toBe(true);
    expect(necesitaPerfil({ pantalla: 'perfiles' })).toBe(false);
    expect(esMenu({ pantalla: 'capitulos', libro: 'x' })).toBe(true);
    expect(esMenu({ pantalla: 'capitulo', libro: 'x', numero: 1 })).toBe(false);
    expect(esMenu({ pantalla: 'jugar', libro: 'x', numero: 1 })).toBe(false);
  });

  it('el intento se escribe como en los diseños', () => {
    expect([1, 2, 3, 4, 11].map(ordinalIntento)).toEqual(['1.er', '2.º', '3.er', '4.º', '11.º']);
  });
});
