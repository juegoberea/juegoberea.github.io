// El sello de la autora: qué se firma para cada acción muy delicada. Lo usan el panel (que firma
// con el archivo del pendrive) y el servidor (que comprueba la firma). Sin dependencias.

export const TIPO_SELLO = 'berea-sello-de-la-autora';

export interface ArchivoSello {
  tipo: typeof TIPO_SELLO;
  version: 1;
  creado: string;
  aviso: string;
  publica: string;
  privada: string;
}

export const ACCIONES_DELICADAS = [
  'crear_llave', 'descargar_llave', 'descargar_copia', 'pasar_proyecto', 'retirar',
  'borrar_libro', 'borrar_banco', 'cambiar_usuario', 'cambiar_contrasena', 'ver_codigos',
] as const;

export type AccionDelicada = (typeof ACCIONES_DELICADAS)[number];

/** Texto que se firma: incluye el desafío (único, vence a los 5 minutos) y la acción. */
export function textoDelDesafio(desafio: string, accion: AccionDelicada): Uint8Array {
  return new TextEncoder().encode(`berea-sello|v1|${desafio}|${accion}`);
}
