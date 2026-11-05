// Pantalla 09 · Seguridad y ventana 10 · Poner el sello. Las acciones muy delicadas piden el sello
// de la autora (el archivo de su pendrive): el panel lo lee aquí, firma un desafío nuevo del servidor
// y envía solo la firma. El archivo nunca sale de la computadora. No hay huella ni otra opción.

import * as ed from '@noble/ed25519';
import { useEffect, useRef, useState } from 'preact/hooks';
import { deHex, aHex } from '../../../app/src/contenido/codificacion';
import { TIPO_SELLO, textoDelDesafio, type AccionDelicada, type ArchivoSello } from '../compartido/sello';
import { AvisoBorrado } from '../componentes/AvisoBorrado';
import { leerVersiones, llamarFuncion, ultimaCopia, type FilaVersion, type Vigilancia } from '../datos';
import { fechaCorta, fechaDia } from '../estados';
import { IconoAlerta, IconoSello } from '../iconos';
import type { Autora } from '../sesion';
import { mensajeDeError } from '../sesion';
import { db } from '../supabase';
import { t } from '../textos';

interface Resultado {
  mensaje: string;
  archivo?: { nombre: string; texto: string };
  codigos?: string[];
}

function descargar(nombre: string, texto: string) {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

/** Lee el archivo del sello y devuelve su parte privada. */
export async function leerSello(texto: string): Promise<Uint8Array> {
  let datos: Partial<ArchivoSello>;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error(t('sello.noEsSello'));
  }
  if (datos.tipo !== TIPO_SELLO || typeof datos.privada !== 'string') throw new Error(t('sello.noEsSello'));
  const privada = deHex(datos.privada);
  if (datos.publica && aHex(await ed.getPublicKeyAsync(privada)) !== datos.publica) throw new Error(t('sello.danado'));
  return privada;
}

/** Pide un desafío nuevo, lo firma con el sello y ejecuta la acción en el servidor. */
export async function accionConSello(accion: AccionDelicada, privada: Uint8Array, datos: Record<string, unknown> = {}): Promise<Resultado> {
  const { data, error } = await db().rpc('crear_desafio', { accion });
  if (error) throw error;
  const desafio = (data as { id: string }).id;
  const firma = aHex(await ed.signAsync(textoDelDesafio(desafio, accion), privada));
  return llamarFuncion<Resultado>('accion-delicada', { accion, desafio, firma, datos });
}

function VentanaSello({ accion, alCerrar }: { accion: AccionDelicada; alCerrar: () => void }) {
  const [elegida, setElegida] = useState<AccionDelicada>(accion);
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const ventana = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ventana.current?.showModal();
  }, []);

  const faltanDatos = (elegida === 'cambiar_usuario' && usuario.trim().length < 3) || (elegida === 'cambiar_contrasena' && contrasena.length < 10);

  async function ponerSello(e: Event) {
    const elegido = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!elegido) return;
    setTrabajando(true);
    setError('');
    try {
      const privada = await leerSello(await elegido.text());
      const r = await accionConSello(elegida, privada, { usuario, contrasena });
      if (r.archivo) descargar(r.archivo.nombre, r.archivo.texto);
      setResultado(r);
    } catch (err) {
      setError(err instanceof Error && !('code' in err) ? err.message : mensajeDeError(err));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <dialog ref={ventana} class="ventana" onClose={alCerrar} aria-labelledby="sello-titulo">
      <div class="acceso__cabeza">
        <span class="acceso__icono acceso__icono--sello"><IconoSello /></span>
        <h1 id="sello-titulo">{t('sello.titulo')}</h1>
      </div>
      {resultado ? (
        <>
          <p class="note ok">{resultado.mensaje}</p>
          {resultado.codigos && <ul class="codigos-lista">{resultado.codigos.map((c) => <li key={c}>{c}</li>)}</ul>}
          <button class="btn pri" onClick={() => ventana.current?.close()}>{t('sello.cerrar')}</button>
        </>
      ) : (
        <>
          {(accion === 'borrar_libro' || accion === 'borrar_banco') && (
            <div class="segmentado" role="radiogroup" aria-label={t('sello.queBorrar')}>
              {(['borrar_libro', 'borrar_banco'] as const).map((a) => <button key={a} role="radio" aria-checked={elegida === a} onClick={() => setElegida(a)}>{t(`sello.opcion.${a}`)}</button>)}
            </div>
          )}
          <p class="sub centrado">{t('sello.vasA', { accion: t(`seguridad.accion.${elegida}`).toLowerCase() })} {t(`sello.efecto.${elegida}`)}</p>
          {elegida === 'cambiar_usuario' && (
            <div class="field"><label for="nuevo-usuario">{t('sello.nuevoUsuario')}</label><input id="nuevo-usuario" class="input" autoCapitalize="none" value={usuario} onInput={(e) => setUsuario((e.target as HTMLInputElement).value)} /></div>
          )}
          {elegida === 'cambiar_contrasena' && (
            <div class="field"><label for="nueva-contrasena">{t('sello.nuevaContrasena')}</label><input id="nueva-contrasena" class="input" type="password" autoComplete="new-password" value={contrasena} onInput={(e) => setContrasena((e.target as HTMLInputElement).value)} /></div>
          )}
          <div class="note lock"><IconoAlerta /><span>{t('sello.pendrive')}</span></div>
          {error && <p class="note err" role="alert">{error}</p>}
          <input ref={archivo} class="solo-lectores" type="file" accept=".berea,application/json" onChange={ponerSello} />
          <button class={`btn grande ${elegida === 'retirar' || elegida.startsWith('borrar') ? 'warn' : 'pri'}`} disabled={trabajando || faltanDatos} onClick={() => archivo.current?.click()}>
            {trabajando ? t('sello.comprobando') : t('sello.poner')}
          </button>
          <button class="btn line" onClick={() => ventana.current?.close()} disabled={trabajando}>{t('sello.cancelar')}</button>
          <span class="hint centrado">{t('sello.anotada')}</span>
        </>
      )}
    </dialog>
  );
}

export function Seguridad({ autora, borrado, recargar }: { autora: Autora; borrado: Vigilancia['borrado']; recargar: () => void }) {
  const [accion, setAccion] = useState<AccionDelicada | null>(null);
  const [haySello, setHaySello] = useState<boolean | null>(null);
  const [ultima, setUltima] = useState<FilaVersion | null>(null);
  const [copia, setCopia] = useState<Awaited<ReturnType<typeof ultimaCopia>>>(null);

  useEffect(() => {
    db().rpc('hay_sello').then(({ data }) => setHaySello(data === true));
    leerVersiones().then((v) => setUltima(v[0] ?? null), () => undefined);
    ultimaCopia().then(setCopia, () => undefined);
  }, []);

  const Fila = ({ titulo, valor, boton, onClick, estado }: { titulo: string; valor: string; boton?: string; onClick?: () => void; estado?: string }) => (
    <div class="fila-dato">
      <div><span class="fila-dato__titulo">{titulo}</span><b>{valor}</b></div>
      {boton && <button class="btn line sm" onClick={onClick} disabled={!haySello}>{boton}</button>}
      {estado && <span class="st pub">{estado}</span>}
    </div>
  );

  return (
    <>
      <div class="top">
        <div>
          <h1>{t('seguridad.titulo')}</h1>
          <p class="sub">{t('seguridad.sub')}</p>
        </div>
      </div>
      {haySello === false && <p class="note err">{t('seguridad.sinSello')}</p>}
      {borrado && <AvisoBorrado borrado={borrado} alCambiar={recargar} />}

      <div class="cols2">
        <section class="card">
          <h2>{t('seguridad.acceso')}</h2>
          <Fila titulo={t('seguridad.usuario')} valor={autora.correo.replace('@berea.invalid', '')} boton={t('seguridad.cambiarConSello')} onClick={() => setAccion('cambiar_usuario')} />
          <Fila titulo={t('seguridad.contrasena')} valor="••••••••••••" boton={t('seguridad.cambiarConSello')} onClick={() => setAccion('cambiar_contrasena')} />
          <Fila titulo={t('seguridad.codigo')} valor={t('seguridad.codigoActivo')} estado={t('seguridad.activo')} />
          <Fila titulo={t('seguridad.codigos')} valor={t('seguridad.codigosSobre')} boton={t('seguridad.verConSello')} onClick={() => setAccion('ver_codigos')} />
        </section>
        <section class="card">
          <h2>{t('seguridad.llave')}</h2>
          <p class="sub">{t('seguridad.llaveTexto')}</p>
          <Fila titulo={t('seguridad.donde')} valor={t('seguridad.cajaFuerte')} />
          <Fila titulo={t('seguridad.respaldo')} valor={t('seguridad.pendrive')} />
          <Fila titulo={t('seguridad.ultimaFirma')} valor={ultima ? t('seguridad.ultimaFirmaValor', { n: ultima.numero, fecha: fechaDia(ultima.publicada_en) }) : t('seguridad.nuncaFirmo')} />
        </section>
      </div>

      <section class="card">
        <h2>{t('seguridad.proteccion')}</h2>
        <Fila titulo={t('seguridad.cierre')} valor={t('seguridad.cierreValor')} />
        <Fila titulo={t('seguridad.otrosAparatos')} valor={t('seguridad.otrosAparatosValor')} />
        <Fila titulo={t('seguridad.intentos')} valor={t('seguridad.intentosValor')} />
        <Fila titulo={t('seguridad.alPublicar')} valor={t('seguridad.alPublicarValor')} />
        <Fila titulo={t('seguridad.borrados')} valor={t('seguridad.borradosValor')} />
        <Fila titulo={t('seguridad.copia')} valor={copia ? t('seguridad.copiaValor', { fecha: fechaCorta(copia.creada_en), n: copia.capitulos }) : t('seguridad.sinCopia')} />
      </section>

      <section class="card">
        <h2>{t('seguridad.delicadas')}</h2>
        <p class="sub">{t('seguridad.delicadasTexto')}</p>
        <div class="delicadas">
          {(['crear_llave', 'descargar_llave', 'descargar_copia', 'pasar_proyecto'] as const).map((a) => (
            <button key={a} class="btn line" disabled={!haySello} onClick={() => setAccion(a)}>{t(`seguridad.accion.${a}`)}</button>
          ))}
          <button class="btn warn" disabled={!haySello} onClick={() => setAccion('retirar')}>{t('seguridad.accion.retirar')}</button>
          <button class="btn warn" disabled={!haySello} onClick={() => setAccion('borrar_libro')}>{t('seguridad.accion.borrar')}</button>
        </div>
      </section>

      {accion && <VentanaSello accion={accion} alCerrar={() => { setAccion(null); recargar(); }} />}
    </>
  );
}
