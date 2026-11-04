// Las 6 casillas del código. Pasa sola a la siguiente, borra hacia atrás y acepta pegar el código entero.

import { useEffect, useRef } from 'preact/hooks';
import { t } from '../textos';

export function Digitos({ valor, alCambiar, alCompletar }: { valor: string; alCambiar: (v: string) => void; alCompletar?: () => void }) {
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => casillas.current[0]?.focus(), []);

  function poner(desde: number, texto: string) {
    const numeros = texto.replace(/\D/g, '');
    if (!numeros) return;
    const nuevo = (valor.slice(0, desde) + numeros).slice(0, 6);
    alCambiar(nuevo);
    casillas.current[Math.min(nuevo.length, 5)]?.focus();
    if (nuevo.length === 6) alCompletar?.();
  }

  return (
    <div class="digitos" role="group" aria-label={t('codigo.grupo')}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(e) => {
            casillas.current[i] = e;
          }}
          class={valor[i] ? 'lleno' : ''}
          aria-label={t('codigo.numero', { n: i + 1 })}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
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
            } else if (e.key === 'Enter' && valor.length === 6) alCompletar?.();
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
