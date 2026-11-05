// Aviso de un borrado programado (se hace 24 horas después de pedirlo) con el botón para cancelarlo.

import { useState } from 'preact/hooks';
import { cancelarBorrado, type Vigilancia } from '../datos';
import { IconoAlerta } from '../iconos';
import { mensajeDeError } from '../sesion';
import { t } from '../textos';

export function AvisoBorrado({ borrado, alCambiar }: { borrado: NonNullable<Vigilancia['borrado']>; alCambiar: () => void }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const fecha = new Date(borrado.ejecutar_en).toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

  async function cancelar() {
    setTrabajando(true);
    try {
      await cancelarBorrado();
      alert(t('inicio.borradoCancelado'));
      alCambiar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div class="note err aviso-borrado" role="alert">
      <IconoAlerta />
      <span>{t('inicio.borradoPendiente', { que: t(`borrado.${borrado.accion}`), fecha })}</span>
      <button class="btn pri sm" disabled={trabajando} onClick={cancelar}>{t('inicio.cancelarBorrado')}</button>
      {error && <span>{error}</span>}
    </div>
  );
}
