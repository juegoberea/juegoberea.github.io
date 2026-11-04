// Avance del perfil elegido en un libro, leído de la base de datos.

import { useEffect, useState } from 'preact/hooks';
import type { ProgresoLibro } from '../datos/tipos';
import { useApp } from './estado';

export function useProgreso(libroId: string): ProgresoLibro | null {
  const { datos, perfil } = useApp();
  const [progreso, setProgreso] = useState<ProgresoLibro | null>(null);
  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    datos.obtenerProgreso(perfil.id, libroId).then((p) => vigente && setProgreso(p));
    return () => {
      vigente = false;
    };
  }, [datos, perfil, libroId]);
  return progreso;
}
