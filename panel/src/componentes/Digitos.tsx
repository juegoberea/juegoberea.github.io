// Las casillas del código (6) o del PIN (4, ocultas). Pasa sola a la siguiente, borra hacia atrás y acepta pegar el código entero.

import { useEffect, useRef } from 'preact/hooks';
import { t } from '../textos';

type Props = { valor: string; alCambiar: (v: string) => void; alCompletar?: (v: string) => void; largo?: number; oculto?: boolean; etiqueta?: string };

export function Digitos({ valor, alCambiar, alCompletar, largo = 6, oculto = false, etiqueta = t('codigo.grupo') }: Props) {
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => casillas.current[0]?.focus(), []);

  function poner(desde: number, texto: string) {
    const numeros = texto.replace(/\D/g, '');
    if (!numeros) return;
    const nuevo = (valor.slice(0, desde) + numeros).slice(0, largo);
    alCambiar(nuevo);
    casillas.current[Math.min(nuevo.length, largo - 1)]?.focus();
    if (nuevo.length === largo) alCompletar?.(nuevo);
  }

  return (
    <div class="digitos" role="group" aria-label={etiqueta}>
      {Array.from({ length: largo }, (_, i) => (
        <input
          key={i}
          ref={(e) => {
            casillas.current[i] = e;
          }}
          class={valor[i] ? 'lleno' : ''}
          aria-label={t('codigo.numero', { n: i + 1 })}
          type={oculto ? 'password' : 'text'}
          inputMode="numeric"
          autoComplete={oculto ? 'off' : i === 0 ? 'one-time-code' : 'off'}
          maxLength={largo}
          value={valor[i] ?? ''}
          onInput={(e) => {
            const texto = (e.target as HTMLInputElement).value;
            (e.target as HTMLInputElement).value = valor[i] ?? '';
            poner(Math.min(i, valor.length), texto);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault();
              const hasta = valor[i] ? i : Math.max(0, i - 1);
              alCambiar(valor.slice(0, hasta));
              casillas.current[hasta]?.focus();
            } else if (e.key === 'Enter' && valor.length === largo) alCompletar?.(valor);
          }}
          onPaste={(e) => {
            e.preventDefault();
            poner(0, e.clipboardData?.getData('text') ?? '');
          }}
        />
      ))}
    </div>
  );
}
