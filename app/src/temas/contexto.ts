// El tema activo, al alcance de cualquier componente (por ejemplo, el reloj elige su forma).

import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Tema } from './tipos';
import { temaVibrante } from './vibrante';

export const ContextoTema = createContext<Tema>(temaVibrante);

export function useTema(): Tema {
  return useContext(ContextoTema);
}
