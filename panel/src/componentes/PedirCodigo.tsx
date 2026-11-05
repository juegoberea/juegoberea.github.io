// Ventana que pide otra vez el código de 6 números antes de algo que llega a los jugadores (publicar).

import { useEffect, useRef, useState } from 'preact/hooks';
import { IconoCelular } from '../iconos';
import { confirmarOtraVez } from '../sesion';
import { t } from '../textos';
import { Digitos } from './Digitos';

export function PedirCodigo({ alConfirmar, alCancelar }: { alConfirmar: () => void; alCancelar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const ventana = useRef<HTMLDialogElement>(null);
  const confirmado = useRef(false);

  useEffect(() => {
    ventana.current?.showModal();
  }, []);

  async function confirmar(escrito = codigo) {
    if (ocupado || escrito.length !== 6) return;
    setOcupado(true);
    const problema = await confirmarOtraVez(escrito);
    setOcupado(false);
    setCodigo('');
    if (problema) return setError(problema);
    confirmado.current = true;
    ventana.current?.close();
  }

  return (
    <dialog ref={ventana} class="ventana" onClose={() => (confirmado.current ? alConfirmar() : alCancelar())} aria-labelledby="otra-vez-titulo">
      <div class="acceso__cabeza">
        <span class="acceso__icono"><IconoCelular /></span>
        <h1 id="otra-vez-titulo">{t('codigo.otraVez')}</h1>
        <p>{t('codigo.otraVezTexto')}</p>
      </div>
      <Digitos valor={codigo} alCambiar={setCodigo} alCompletar={confirmar} />
      {error && <p class="note err" role="alert">{error}</p>}
      <button class="btn pri grande" disabled={ocupado || codigo.length !== 6} onClick={() => confirmar()}>{t('codigo.seguir')}</button>
      <button class="btn line" disabled={ocupado} onClick={() => ventana.current?.close()}>{t('sello.cancelar')}</button>
    </dialog>
  );
}
