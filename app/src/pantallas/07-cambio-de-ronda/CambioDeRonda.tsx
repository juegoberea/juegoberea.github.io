// Pantalla 7 · Cambio de ronda: pantalla completa del color de la nueva ronda durante
// 2,5 s, sin botones. Mientras se ve, el reloj de las preguntas no corre.

import { useEffect } from 'preact/hooks';
import type { NumeroRonda } from '../../contenido/tipos';
import { useTema } from '../../temas/contexto';
import { numero, t } from '../../textos';
import './cambio-de-ronda.css';

export interface PropsCambioDeRonda {
  ronda: NumeroRonda;
  puntos: number;
  alTerminar: () => void;
}

export function CambioDeRonda({ ronda, puntos, alTerminar }: PropsCambioDeRonda) {
  const tema = useTema();

  useEffect(() => {
    const espera = setTimeout(alTerminar, tema.movimiento.pantallaRondaMs);
    return () => clearTimeout(espera);
  }, [ronda]);

  return (
    <div class={`cambio-ronda ronda-${ronda}`} role="status" aria-live="assertive">
      <span class="cambio-ronda__aro cambio-ronda__aro--1" aria-hidden="true" />
      <span class="cambio-ronda__aro cambio-ronda__aro--2" aria-hidden="true" />

      <div class="cambio-ronda__contenido">
        <span class="cambio-ronda__numero" aria-hidden="true">
          {ronda}
        </span>
        <span class="cambio-ronda__etiqueta t-etiqueta">{t('cambioRonda.ronda', { n: ronda })}</span>
        <h1 class="cambio-ronda__titulo">{t(`cambioRonda.titulo${ronda}`)}</h1>
        <p class="cambio-ronda__animo">{t(`cambioRonda.animo${ronda}`)}</p>

        {ronda > 1 && (
          <p class="cambio-ronda__puntos">
            {t('cambioRonda.llevas')} <strong>{t('cambioRonda.puntos', { n: numero(puntos) })}</strong>
          </p>
        )}

        <ol class="cambio-ronda__avance" aria-label={t('cambioRonda.avance', { n: ronda })}>
          {[1, 2, 3, 4].map((n) => (
            <li key={n} class={n < ronda ? 'hecha' : n === ronda ? 'actual' : ''} />
          ))}
        </ol>
      </div>
    </div>
  );
}
