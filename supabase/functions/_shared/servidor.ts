// Piezas comunes de las funciones del servidor: permisos para el panel, respuestas y quién llama.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const LIBRO = 'patriarcas-y-profetas';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

/** Un error que se le explica a la autora tal cual. */
export class Rechazo extends Error {
  constructor(mensaje: string, readonly estado = 400) {
    super(mensaje);
  }
}

export interface Llamada {
  /** Cliente con todos los permisos (solo en el servidor). */
  admin: SupabaseClient;
  /** Id de la autora. */
  autora: string;
  navegador: string;
}

/**
 * Comprueba que llama la autora con la sesión confirmada con el código de 6 números (aal2).
 * Usa la misma regla que la base de datos: public.es_autora().
 */
export async function comprobarAutora(pedido: Request): Promise<Llamada> {
  const url = Deno.env.get('SUPABASE_URL')!;
  const usuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: pedido.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: esAutora, error }, { data: quien }] = await Promise.all([usuario.rpc('es_autora'), usuario.auth.getUser()]);
  if (error || esAutora !== true || !quien.user) throw new Rechazo('Solo la autora, con su código de 6 números, puede hacer esto.', 403);
  const agente = pedido.headers.get('User-Agent') ?? '';
  const sistema = /Android/i.test(agente) ? 'Android' : /iPhone|iPad/i.test(agente) ? 'iPhone' : /Windows/i.test(agente) ? 'Windows' : /Mac OS/i.test(agente) ? 'Mac' : 'Otro';
  const navegador = /Edg\//.test(agente) ? 'Edge' : /Firefox\//.test(agente) ? 'Firefox' : /Chrome\//.test(agente) ? 'Chrome' : /Safari\//.test(agente) ? 'Safari' : 'otro navegador';
  return {
    admin: createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } }),
    autora: quien.user.id,
    navegador: `${sistema} · ${navegador}`,
  };
}

export async function anotar(l: Llamada, accion: string, detalle: string, resultado: 'hecho' | 'rechazado' = 'hecho'): Promise<void> {
  await l.admin.from('registro').insert({ accion, detalle: detalle.slice(0, 500), navegador: l.navegador, resultado });
}

/** Envuelve una función: responde a los permisos del navegador y convierte los errores en respuestas claras. */
export function servir(manejar: (pedido: Request) => Promise<Response>): void {
  Deno.serve(async (pedido) => {
    if (pedido.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    try {
      return await manejar(pedido);
    } catch (e) {
      if (e instanceof Rechazo) return json({ error: e.message }, e.estado);
      console.error(e);
      return json({ error: 'Algo salió mal en el servidor. Vuelve a probar en un momento.' }, 500);
    }
  });
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
  return [...h].map((b) => b.toString(16).padStart(2, '0')).join('');
}
