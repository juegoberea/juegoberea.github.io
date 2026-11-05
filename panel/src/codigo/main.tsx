// «Código de Berea»: la página del celular que da el código de 6 números para entrar al panel.
// Se abre escaneando el cuadro del panel con el botón «Escanear código QR» del celular, sin instalar
// nada. La clave llega después de «#» (nunca se envía a ningún servidor) y se guarda en este celular
// cifrada con un PIN de 4 números: sin el PIN, quien tome el celular no ve el código. La página se
// vuelve a cerrar al salir de ella o a los 3 minutos.

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Logo } from '../../../app/src/componentes/Logo';
import { aplicarTema } from '../../../app/src/temas/aplicar';
import '../../../app/src/temas/base.css';
import { temaVibrante } from '../../../app/src/temas/vibrante';
import { Digitos } from '../componentes/Digitos';
import { abrirConPin, cerrarConPin, esperaTrasFallos, LARGO_PIN, pinFacil, type CajaCifrada } from '../compartido/pin';
import { codigoDelMomento, deBase32, segundosRestantes } from '../compartido/totp';
import '../panel.css';
import { t } from '../textos';

const CAJA = 'berea-codigo-caja';
const FALLOS = 'berea-codigo-fallos';
/** Donde la primera versión guardaba la clave sin cifrar: se pasa a la caja con PIN y se borra. */
const SIN_PIN = 'berea-codigo-clave';
const ABIERTA_HASTA = 3 * 60_000;

type Estado =
  | { paso: 'sinClave'; olvidado?: boolean }
  | { paso: 'crearPin'; clave: string; primero?: string; error?: string }
  | { paso: 'cerrada'; caja: CajaCifrada }
  | { paso: 'abierta'; clave: string; nueva: boolean };

type Fallos = { fallos: number; hasta: number };

function leer<T>(nombre: string): T | null {
  try {
    const texto = localStorage.getItem(nombre);
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

function escribir(nombre: string, valor: unknown | null) {
  try {
    if (valor === null) localStorage.removeItem(nombre);
    else localStorage.setItem(nombre, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento: el PIN se pedirá crear de nuevo la próxima vez.
  }
}

function claveValida(k: string | null): k is string {
  if (!k) return false;
  try {
    return deBase32(k).length >= 10;
  } catch {
    return false;
  }
}

function estadoInicial(): Estado {
  const k = new URLSearchParams(location.hash.slice(1)).get('k');
  if (k) history.replaceState(null, '', location.pathname);
  if (claveValida(k)) return { paso: 'crearPin', clave: k };
  const caja = leer<CajaCifrada>(CAJA);
  if (caja) return { paso: 'cerrada', caja };
  let vieja: string | null = null;
  try {
    vieja = localStorage.getItem(SIN_PIN);
  } catch {
    // Nada guardado.
  }
  if (claveValida(vieja)) return { paso: 'crearPin', clave: vieja };
  return { paso: 'sinClave' };
}

function Tarjeta({ subtitulo, children }: { subtitulo?: string; children: preact.ComponentChildren }) {
  return (
    <main class="acceso">
      {[1, 2, 3, 4].map((n) => <div key={n} class={`acceso__circulo acceso__circulo--${n}`} aria-hidden="true" />)}
      <div class="acceso__tarjeta">
        <div class="acceso__cabeza">
          <Logo tamano={64} />
          <h1>{t('codigoCelular.titulo')}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}

function CrearPin({ estado, alCambiar }: { estado: Extract<Estado, { paso: 'crearPin' }>; alCambiar: (e: Estado) => void }) {
  const [pin, setPin] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function completar(escrito: string) {
    setPin('');
    if (!estado.primero) {
      if (pinFacil(escrito)) return alCambiar({ ...estado, error: t('codigoCelular.facil') });
      return alCambiar({ paso: 'crearPin', clave: estado.clave, primero: escrito });
    }
    if (escrito !== estado.primero) return alCambiar({ paso: 'crearPin', clave: estado.clave, error: t('codigoCelular.noCoinciden') });
    setOcupado(true);
    escribir(CAJA, await cerrarConPin(estado.clave, escrito));
    escribir(FALLOS, null);
    escribir(SIN_PIN, null);
    alCambiar({ paso: 'abierta', clave: estado.clave, nueva: true });
  }

  return (
    <Tarjeta subtitulo={estado.primero ? t('codigoCelular.repetir') : t('codigoCelular.crearTitulo')}>
      {!estado.primero && <p class="note lock">{t('codigoCelular.crearTexto')}</p>}
      <Digitos key={estado.primero ? 2 : 1} valor={pin} alCambiar={setPin} alCompletar={completar} largo={LARGO_PIN} oculto etiqueta={t('codigoCelular.pinGrupo')} />
      {ocupado && <p class="hint centrado">{t('codigoCelular.abriendo')}</p>}
      {estado.error && <p class="note err" role="alert">{estado.error}</p>}
    </Tarjeta>
  );
}

function PedirPin({ caja, alAbrir, alOlvidar }: { caja: CajaCifrada; alAbrir: (clave: string) => void; alOlvidar: () => void }) {
  const [pin, setPin] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  function esperaRestante(): number {
    const f = leer<Fallos>(FALLOS);
    return f ? Math.max(0, f.hasta - Date.now()) : 0;
  }

  async function completar(escrito: string) {
    setPin('');
    const espera = esperaRestante();
    if (espera > 0) return setError(t('codigoCelular.esperar', { n: Math.ceil(espera / 60_000) }));
    setOcupado(true);
    const clave = await abrirConPin(caja, escrito);
    setOcupado(false);
    if (clave) {
      escribir(FALLOS, null);
      return alAbrir(clave);
    }
    const fallos = (leer<Fallos>(FALLOS)?.fallos ?? 0) + 1;
    const nuevaEspera = esperaTrasFallos(fallos);
    escribir(FALLOS, { fallos, hasta: Date.now() + nuevaEspera });
    setError(nuevaEspera ? t('codigoCelular.esperar', { n: nuevaEspera / 60_000 }) : t('codigoCelular.equivocado', { n: 5 - (fallos % 5) }));
  }

  function olvidar() {
    if (confirm(t('codigoCelular.confirmarOlvido'))) alOlvidar();
  }

  return (
    <Tarjeta subtitulo={t('codigoCelular.pedir')}>
      <Digitos valor={pin} alCambiar={setPin} alCompletar={completar} largo={LARGO_PIN} oculto etiqueta={t('codigoCelular.pinGrupo')} />
      {ocupado && <p class="hint centrado">{t('codigoCelular.abriendo')}</p>}
      {error && <p class="note err" role="alert">{error}</p>}
      <div class="acceso__enlaces">
        <button onClick={olvidar}>{t('codigoCelular.olvide')}</button>
      </div>
    </Tarjeta>
  );
}

function Abierta({ clave, nueva, alCerrar }: { clave: string; nueva: boolean; alCerrar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [segundos, setSegundos] = useState(segundosRestantes());
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const bytes = deBase32(clave);
    const actualizar = async () => {
      setCodigo(await codigoDelMomento(bytes));
      setSegundos(segundosRestantes());
    };
    void actualizar();
    const id = setInterval(actualizar, 1000);
    const cerrar = setTimeout(alCerrar, ABIERTA_HASTA);
    return () => {
      clearInterval(id);
      clearTimeout(cerrar);
    };
  }, [clave]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sin permiso para copiar: se escribe a mano.
    }
  }

  return (
    <Tarjeta subtitulo={t('codigoCelular.para')}>
      {nueva && <p class="note ok">{t('codigoCelular.guardada')}</p>}
      <button class="codigo-grande" onClick={copiar} aria-label={t('codigoCelular.copiar')}>
        {codigo.replace(/(\d{3})(\d{3})/, '$1 $2')}
      </button>
      <div class="codigo-tiempo" role="progressbar" aria-valuemin={0} aria-valuemax={30} aria-valuenow={segundos} aria-label={t('codigoCelular.cambia', { n: segundos })}>
        <i style={{ width: `${(segundos / 30) * 100}%` }} />
      </div>
      <p class="hint centrado">{copiado ? t('codigoCelular.copiado') : t('codigoCelular.cambia', { n: segundos })}</p>
      <p class="note lock">{t('codigoCelular.inicio')}</p>
      <div class="acceso__enlaces">
        <button onClick={alCerrar}>{t('codigoCelular.cerrar')}</button>
      </div>
    </Tarjeta>
  );
}

function Codigo() {
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  const cerrar = () => {
    const caja = leer<CajaCifrada>(CAJA);
    setEstado(caja ? { paso: 'cerrada', caja } : { paso: 'sinClave' });
  };

  // Al salir de la página (otra app, pantalla apagada) el código se vuelve a cerrar con el PIN.
  useEffect(() => {
    if (estado.paso !== 'abierta') return;
    const alOcultar = () => document.visibilityState === 'hidden' && cerrar();
    document.addEventListener('visibilitychange', alOcultar);
    return () => document.removeEventListener('visibilitychange', alOcultar);
  }, [estado.paso]);

  switch (estado.paso) {
    case 'crearPin':
      return <CrearPin estado={estado} alCambiar={setEstado} />;
    case 'cerrada':
      return (
        <PedirPin
          caja={estado.caja}
          alAbrir={(clave) => setEstado({ paso: 'abierta', clave, nueva: false })}
          alOlvidar={() => {
            escribir(CAJA, null);
            escribir(FALLOS, null);
            setEstado({ paso: 'sinClave', olvidado: true });
          }}
        />
      );
    case 'abierta':
      return <Abierta clave={estado.clave} nueva={estado.nueva} alCerrar={cerrar} />;
    default:
      return (
        <Tarjeta>
          <p class="note info">{estado.olvidado ? t('codigoCelular.olvidado') : t('codigoCelular.sinClave')}</p>
        </Tarjeta>
      );
  }
}

aplicarTema(temaVibrante, 'normal');
// Ninguna otra página puede mostrar el código dentro de la suya.
if (window.top === window.self) render(<Codigo />, document.getElementById('codigo')!);
else document.body.textContent = 'Código de Berea solo se abre en su propia pestaña.';
