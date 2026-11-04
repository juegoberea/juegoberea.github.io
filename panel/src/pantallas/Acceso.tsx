// Pantallas 01 (Entrar) y 02 (Código de 6 números), más tres que no estaban en los diseños pero
// hacen falta: activar el código la primera vez, usar un código de recuperación y ver los códigos nuevos.

import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Logo } from '../../../app/src/componentes/Logo';
import { Digitos } from '../componentes/Digitos';
import { IconoCandado, IconoCelular, IconoLlave } from '../iconos';
import { confirmarCodigo, entrar, salir, usarCodigoRecuperacion, type Fase } from '../sesion';
import { t } from '../textos';

type Seguir = (paso: () => Promise<Fase>) => Promise<void>;

function Fondo({ ancha, children }: { ancha?: boolean; children: ComponentChildren }) {
  return (
    <main class="acceso">
      {[1, 2, 3, 4].map((n) => <div key={n} class={`acceso__circulo acceso__circulo--${n}`} aria-hidden="true" />)}
      <div class={`acceso__tarjeta${ancha ? ' acceso__tarjeta--ancha' : ''}`}>{children}</div>
    </main>
  );
}

function Error({ texto }: { texto?: string }) {
  return texto ? <p class="note err" role="alert">{texto}</p> : null;
}

export function Entrar({ fase, seguir }: { fase: Extract<Fase, { fase: 'fuera' }>; seguir: Seguir }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: Event) {
    e.preventDefault();
    setOcupado(true);
    await seguir(() => entrar(usuario, contrasena));
    setOcupado(false);
  }

  return (
    <Fondo>
      <div class="acceso__cabeza">
        <Logo tamano={72} />
        <h1>{t('marca.titulo')}</h1>
        <p>{t('entrar.aviso')}</p>
      </div>
      <form class="acceso__form" onSubmit={enviar}>
        <div class="field">
          <label for="usuario">{t('entrar.usuario')}</label>
          <input id="usuario" class="input" autoComplete="username" autoCapitalize="none" spellcheck={false} value={usuario} onInput={(e) => setUsuario((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label for="clave">{t('entrar.contrasena')}</label>
          <input id="clave" class="input" type="password" autoComplete="current-password" value={contrasena} onInput={(e) => setContrasena((e.target as HTMLInputElement).value)} />
        </div>
        <Error texto={fase.error} />
        <button class="btn pri grande" type="submit" disabled={ocupado || !usuario.trim() || !contrasena}>
          {ocupado ? t('entrar.entrando') : t('entrar.entrar')}
        </button>
      </form>
      <div class="note lock" style={{ fontSize: '13px', lineHeight: '18px' }}>
        <IconoCandado />
        <span>{t('entrar.olvido')}</span>
      </div>
    </Fondo>
  );
}

export function Codigo({ fase, seguir, alRecuperar }: { fase: Extract<Fase, { fase: 'codigo' }>; seguir: Seguir; alRecuperar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function confirmar() {
    if (ocupado || codigo.length !== 6) return;
    setOcupado(true);
    await seguir(() => confirmarCodigo(fase, codigo));
    setCodigo('');
    setOcupado(false);
  }

  return (
    <Fondo>
      <div class="acceso__cabeza">
        <span class="acceso__icono"><IconoCelular /></span>
        <h1>{t('codigo.titulo')}</h1>
        <p>{t('codigo.texto')}</p>
      </div>
      <Digitos valor={codigo} alCambiar={setCodigo} alCompletar={confirmar} />
      <Error texto={fase.error} />
      <button class="btn pri grande" disabled={ocupado || codigo.length !== 6} onClick={confirmar}>{t('codigo.confirmar')}</button>
      <div class="acceso__enlaces">
        <button onClick={() => seguir(salir)}>{t('codigo.volver')}</button>
        <button onClick={alRecuperar}>{t('codigo.recuperacion')}</button>
      </div>
    </Fondo>
  );
}

export function Activar({ fase, seguir }: { fase: Extract<Fase, { fase: 'activar' }>; seguir: Seguir }) {
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function activar() {
    if (ocupado || codigo.length !== 6) return;
    setOcupado(true);
    await seguir(() => confirmarCodigo(fase, codigo));
    setCodigo('');
    setOcupado(false);
  }

  return (
    <Fondo ancha>
      <div class="acceso__cabeza">
        <span class="acceso__icono"><IconoCelular /></span>
        <h1>{t('activar.titulo')}</h1>
        <p>{t('activar.texto')}</p>
      </div>
      <ol class="pasos">
        <li><div class="pasos__contenido">{t('activar.paso1')}</div></li>
        <li>
          <div class="pasos__contenido">
            {t('activar.paso2')}
            <img class="qr" src={fase.qr} alt={t('activar.qr')} />
            <span class="hint">{t('activar.clave')}</span>
            <span class="clave-secreta">{fase.clave.replace(/(.{4})/g, '$1 ').trim()}</span>
          </div>
        </li>
        <li>
          <div class="pasos__contenido" style={{ flex: 1 }}>
            {t('activar.paso3')}
            <Digitos valor={codigo} alCambiar={setCodigo} alCompletar={activar} />
          </div>
        </li>
      </ol>
      <Error texto={fase.error} />
      <button class="btn pri grande" disabled={ocupado || codigo.length !== 6} onClick={activar}>{t('activar.activar')}</button>
      <div class="acceso__enlaces">
        <button onClick={() => seguir(salir)}>{t('codigo.volver')}</button>
      </div>
    </Fondo>
  );
}

export function Recuperar({ fase, seguir, alVolver }: { fase: Extract<Fase, { fase: 'recuperar' }>; seguir: Seguir; alVolver: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function usar(e: Event) {
    e.preventDefault();
    setOcupado(true);
    await seguir(() => usarCodigoRecuperacion(codigo));
    setOcupado(false);
  }

  return (
    <Fondo>
      <div class="acceso__cabeza">
        <span class="acceso__icono"><IconoLlave /></span>
        <h1>{t('recuperar.titulo')}</h1>
        <p>{t('recuperar.texto')}</p>
      </div>
      <form class="acceso__form" onSubmit={usar}>
        <div class="field">
          <label for="recuperacion">{t('recuperar.campo')}</label>
          <input id="recuperacion" class="input" autoComplete="off" autoCapitalize="characters" spellcheck={false} placeholder="XXXXX-XXXXX" value={codigo} onInput={(e) => setCodigo((e.target as HTMLInputElement).value)} />
        </div>
        <Error texto={fase.error} />
        <button class="btn pri grande" type="submit" disabled={ocupado || codigo.replace(/[^A-Za-z0-9]/g, '').length !== 10}>{t('recuperar.usar')}</button>
      </form>
      <div class="acceso__enlaces">
        <button onClick={alVolver}>{t('recuperar.volver')}</button>
      </div>
    </Fondo>
  );
}

export function CodigosNuevos({ codigos, alTerminar }: { codigos: string[]; alTerminar: () => void }) {
  return (
    <Fondo ancha>
      <div class="acceso__cabeza">
        <span class="acceso__icono"><IconoLlave /></span>
        <h1>{t('codigos.titulo')}</h1>
        <p>{t('codigos.texto')}</p>
      </div>
      <ul class="codigos-lista">
        {codigos.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div class="row no-imprimir" style={{ justifyContent: 'flex-end' }}>
        <button class="btn line" onClick={() => window.print()}>{t('codigos.imprimir')}</button>
        <button class="btn pri" onClick={alTerminar}>{t('codigos.listo')}</button>
      </div>
    </Fondo>
  );
}
