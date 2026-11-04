// El banco del libro para las pantallas. Los capítulos que todavía no se midieron (por ejemplo, los
// importados) se miden en segundo plano en 360 × 740 y se guarda su revisión con el resultado.

import { useCallback, useEffect, useState } from 'preact/hooks';
import { guardarRevision, leerBanco, type CapituloGuardado, type Libro } from './datos';
import { revisarCapitulos } from './revision';
import { mensajeDeError } from './sesion';
import { medirCapitulo } from './vista/medir';

export function useBanco(libro: Libro) {
  const [banco, setBanco] = useState<CapituloGuardado[] | null>(null);
  const [error, setError] = useState('');
  const [midiendo, setMidiendo] = useState<number | null>(null);

  const recargar = useCallback(async () => {
    try {
      setBanco(await leerBanco());
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (!banco || midiendo !== null) return;
    const pendiente = banco.find((c) => !c.medicion && c.preguntas.length > 0);
    if (!pendiente) return;
    setMidiendo(pendiente.numero);
    (async () => {
      const medicion = await medirCapitulo(pendiente.preguntas);
      const [revisado] = await revisarCapitulos([pendiente], banco, libro.titulo, new Map([[pendiente.numero, medicion]]));
      await guardarRevision(revisado, medicion);
      setBanco((actual) => actual?.map((c) => (c.numero === pendiente.numero ? { ...c, medicion, validacion: revisado.validacion, avisos: revisado.avisos, huella: revisado.huella } : c)) ?? null);
    })()
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setMidiendo(null));
  }, [banco, midiendo, libro.titulo]);

  return { banco, error, midiendo, recargar };
}
