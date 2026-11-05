// Pasos para entrar: contraseña → código de 6 números (o activarlo la primera vez) → adentro.
// Sin el código (sesión aal2) las reglas de la base de datos no dejan leer ni escribir nada.

import type { AuthError } from '@supabase/supabase-js';
import { correoDeUsuario, describirNavegador } from './estados';
import { enMuestra } from './muestra';
import { db } from './supabase';
import { t } from './textos';

export interface Autora {
  nombre: string;
  correo: string;
}

export type Fase =
  | { fase: 'cargando' }
  | { fase: 'fuera'; error?: string }
  | { fase: 'codigo'; factorId: string; error?: string }
  | { fase: 'activar'; factorId: string; qr: string; clave: string; error?: string }
  | { fase: 'recuperar'; error?: string }
  | { fase: 'codigos'; codigos: string[]; autora: Autora }
  | { fase: 'dentro'; autora: Autora };

/** Traduce los errores de Supabase a los textos del panel. */
export function mensajeDeError(e: unknown): string {
  const error = e as Partial<AuthError> & { message?: string };
  const codigo = error?.code ?? '';
  const texto = error?.message ?? '';
  if (codigo === 'invalid_credentials' || /invalid login/i.test(texto)) return t('errores.credenciales');
  if (codigo === 'over_request_rate_limit' || error?.status === 429) return t('errores.demasiados');
  if (codigo === 'mfa_verification_failed' || /invalid totp|mfa/i.test(texto)) return t('errores.codigo');
  if (/fetch|network/i.test(texto)) return t('errores.red');
  return t('errores.general');
}

async function autoraActual(): Promise<Autora> {
  const { data } = await db().auth.getUser();
  const correo = data.user?.email ?? '';
  const nombre = (data.user?.user_metadata?.nombre as string | undefined) ?? correo.split('@')[0];
  return { nombre, correo };
}

/** Anota en el registro de actividad (solo funciona con la sesión completa). */
export async function anotar(accion: string, detalle = ''): Promise<void> {
  if (enMuestra) return;
  await db().from('registro').insert({ accion, detalle, navegador: describirNavegador(navigator.userAgent) });
}

/** Decide en qué paso está la sesión guardada en este navegador. */
export async function faseActual(): Promise<Fase> {
  const cliente = db();
  const { data: sesion } = await cliente.auth.getSession();
  if (!sesion.session) return { fase: 'fuera' };

  // Una cuenta que no es la de la autora no sigue (y aunque siguiera, la base no le muestra nada).
  const { data: esAutora, error } = await cliente.rpc('es_autora_sin_codigo');
  if (error) throw error;
  if (!esAutora) {
    await cliente.auth.signOut();
    return { fase: 'fuera', error: t('errores.noAutora') };
  }

  const { data: nivel } = await cliente.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel?.currentLevel === 'aal2') return faseConCodigo();

  const { data: factores } = await cliente.auth.mfa.listFactors();
  const verificado = factores?.totp.find((f) => f.status === 'verified');
  if (verificado) return { fase: 'codigo', factorId: verificado.id };
  return activar();
}

/** Ya pasó el código: si todavía no tiene códigos de recuperación, se crean y se muestran una vez. */
async function faseConCodigo(): Promise<Fase> {
  const cliente = db();
  const autora = await autoraActual();
  const { data: quedan, error } = await cliente.rpc('codigos_recuperacion_sin_usar');
  if (error) throw error;
  if (quedan === 0) {
    const { data: codigos, error: errorCrear } = await cliente.rpc('crear_codigos_recuperacion');
    if (errorCrear) throw errorCrear;
    return { fase: 'codigos', codigos: codigos as string[], autora };
  }
  return { fase: 'dentro', autora };
}

/** Primera vez (o después de un código de recuperación): prepara el código QR para el celular. */
async function activar(): Promise<Fase> {
  const mfa = db().auth.mfa;
  // Un intento de activación anterior que no se terminó se descarta.
  const { data: factores } = await mfa.listFactors();
  for (const f of factores?.all ?? []) if (f.status === 'unverified') await mfa.unenroll({ factorId: f.id });
  const { data, error } = await mfa.enroll({ factorType: 'totp', friendlyName: 'Celular de la autora', issuer: 'Berea' });
  if (error) throw error;
  return { fase: 'activar', factorId: data.id, qr: data.totp.qr_code, clave: data.totp.secret };
}

export async function entrar(usuario: string, contrasena: string): Promise<Fase> {
  const { error } = await db().auth.signInWithPassword({ email: correoDeUsuario(usuario), password: contrasena });
  if (error) return { fase: 'fuera', error: mensajeDeError(error) };
  return faseActual();
}

/** Comprueba el código de 6 números (para entrar o para activarlo). */
export async function confirmarCodigo(fase: Extract<Fase, { fase: 'codigo' | 'activar' }>, codigo: string): Promise<Fase> {
  const { error } = await db().auth.mfa.challengeAndVerify({ factorId: fase.factorId, code: codigo });
  if (error) return { ...fase, error: mensajeDeError(error) };
  if (fase.fase === 'activar') await anotar('codigo_activado');
  await anotar('entrada');
  return faseConCodigo();
}

export async function usarCodigoRecuperacion(codigo: string): Promise<Fase> {
  const { data, error } = await db().rpc('usar_codigo_recuperacion', { codigo });
  if (error) return { fase: 'recuperar', error: mensajeDeError(error) };
  if (data === 'incorrecto') return { fase: 'recuperar', error: t('errores.recuperacionIncorrecta') };
  if (data === 'bloqueado') return { fase: 'recuperar', error: t('errores.recuperacionBloqueada') };
  await db().auth.refreshSession();
  return activar();
}

export async function salir(): Promise<Fase> {
  await db().auth.signOut();
  return { fase: 'fuera' };
}
