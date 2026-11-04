// Convierte un tema en variables CSS (--color-primary, --letra-pregunta-tamano…) y las
// pone en la página. Cambiar de tema o de tamaño de letra es volver a llamar a aplicarTema.

import type { TamanoLetra } from '../datos/tipos';
import type { EstiloLetra, Tema } from './tipos';

/** «surfaceSunk» → «surface-sunk» */
function guiones(nombre: string): string {
  return nombre.replace(/[A-Z]/g, (l) => '-' + l.toLowerCase());
}

function letra(variables: Record<string, string>, nombre: string, [tamano, alto, peso]: EstiloLetra) {
  variables[`--letra-${nombre}-tamano`] = `${tamano}px`;
  variables[`--letra-${nombre}-alto`] = `${alto}px`;
  variables[`--letra-${nombre}-peso`] = String(peso);
}

export function variablesDelTema(tema: Tema, tamanoLetra: TamanoLetra = 'normal'): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [nombre, valor] of Object.entries(tema.color)) v[`--color-${guiones(nombre)}`] = valor;
  v['--fuente'] = tema.fuente;

  letra(v, 'display', tema.letra.display);
  letra(v, 'titulo', tema.letra.titulo);
  letra(v, 'boton', tema.letra.boton);
  letra(v, 'etiqueta', tema.letra.etiqueta);
  const elegida = tema.letra[tamanoLetra];
  letra(v, 'pregunta', elegida.pregunta);
  letra(v, 'opcion', elegida.opcion);
  letra(v, 'texto', elegida.texto);

  tema.espacio.forEach((e, i) => (v[`--espacio-${i + 1}`] = `${e}px`));
  for (const [nombre, valor] of Object.entries(tema.radio)) v[`--radio-${nombre}`] = `${valor}px`;
  for (const [nombre, valor] of Object.entries(tema.sombra)) v[`--sombra-${guiones(nombre)}`] = valor;
  for (const [nombre, valor] of Object.entries(tema.tamano)) v[`--tamano-${guiones(nombre)}`] = `${valor}px`;
  for (const [nombre, valor] of Object.entries(tema.movimiento)) {
    v[`--mov-${guiones(nombre)}`] = typeof valor === 'number' ? `${valor}ms` : valor;
  }
  for (const [nombre, { fondo, texto }] of Object.entries(tema.avatar)) {
    v[`--avatar-${nombre}`] = tema.color[fondo];
    v[`--avatar-${nombre}-texto`] = tema.color[texto];
  }
  return v;
}

/** Aplica el tema a la página (o al elemento indicado). */
export function aplicarTema(tema: Tema, tamanoLetra: TamanoLetra = 'normal', raiz: HTMLElement = document.documentElement): void {
  for (const [nombre, valor] of Object.entries(variablesDelTema(tema, tamanoLetra))) raiz.style.setProperty(nombre, valor);
  raiz.dataset.tema = tema.nombre.toLowerCase();
  raiz.dataset.letra = tamanoLetra;
}
