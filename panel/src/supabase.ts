// Conexión con el proyecto de Supabase de Berea. La dirección y la clave pública vienen de
// panel/.env (no se suben al repositorio). La clave pública puede estar en el navegador:
// lo que protege los datos son las reglas RLS de la base de datos.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clavePublica = import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA as string | undefined;

export const configurado = Boolean(url && clavePublica);

export const supabase: SupabaseClient | null = configurado
  ? createClient(url!, clavePublica!, { auth: { persistSession: true, storageKey: 'berea-panel', autoRefreshToken: true } })
  : null;

/** Para usar dentro del panel, donde ya se sabe que está configurado. */
export function db(): SupabaseClient {
  if (!supabase) throw new Error('El panel no está configurado (panel/.env).');
  return supabase;
}
