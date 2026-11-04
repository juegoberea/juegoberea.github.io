// Avisos que el convertidor muestra a la autora.
// «error»: impide generar el archivo. «advertencia»: conviene revisarlo, pero no lo impide.

export interface Aviso {
  tipo: 'error' | 'advertencia';
  mensaje: string;
  archivo?: string;
  hoja?: string;
  libro?: string;
  capitulo?: number | string;
  /** Fila del Excel donde está el problema. */
  fila?: number;
}

/** Arma un texto como «Capítulo 3 · hoja Banco, fila 47: no tiene respuesta correcta.» */
export function describirAviso(aviso: Aviso): string {
  const lugar: string[] = [];
  if (aviso.capitulo !== undefined && aviso.capitulo !== '') lugar.push(`Capítulo ${aviso.capitulo}`);
  if (aviso.fila !== undefined) lugar.push(`hoja ${aviso.hoja ?? 'Banco'}, fila ${aviso.fila}`);
  return lugar.length > 0 ? `${lugar.join(' · ')}: ${aviso.mensaje}` : aviso.mensaje;
}
