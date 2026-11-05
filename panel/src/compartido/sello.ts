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

/** Publicar pide el código de 6 números puesto hace 5 minutos o menos. */
export const CODIGO_RECIENTE_SEGUNDOS = 300;
/** Lo que responde el servidor cuando hay que escribir el código otra vez (el panel lo pide solo). */
export const PIDE_CODIGO = 'pide-codigo';

/** Segundos desde que se puso el código de 6 números, según el permiso de la sesión (JWT); null si nunca. */
export function segundosDesdeElCodigo(jwt: string, ahora = Date.now()): number | null {
  try {
    const parte = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const datos = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(parte.padEnd(Math.ceil(parte.length / 4) * 4, '=')), (c) => c.charCodeAt(0))));
    const veces = (datos.amr ?? []).filter((m: { method?: string }) => m.method === 'totp').map((m: { timestamp?: number }) => Number(m.timestamp));
    return veces.length ? Math.floor(ahora / 1000) - Math.max(...veces) : null;
  } catch {
    return null;
  }
}
