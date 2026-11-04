// Pantalla 9 · Resumen: las 20 preguntas como tarjetas agrupadas por ronda (correcta,
// incorrecta o sin respuesta). Al tocar una se da vuelta y muestra su pregunta y su
// estado. NUNCA muestra la opción correcta.

import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { BotonIcono, IconoAtras } from '../../componentes';
import { RONDAS } from '../../contenido/tipos';
import type { EstadoRespuesta } from '../../motor/partida';
import { t } from '../../textos';
import './resumen.css';

const NOMBRE_ESTADO: Record<EstadoRespuesta, string> = {
  correcta: 'resumen.correcta',
  incorrecta: 'resumen.incorrecta',
  'sin-respuesta': 'resumen.sinRespuesta',
};

export function Resumen({ libroId, numero }: { libroId: string; numero: number }) {
  const { resultado, ir, volver } = useApp();
  const datos = resultado && resultado.libro === libroId && resultado.numero === numero ? resultado.datos : null;
  const preguntas = datos?.resumen.preguntas ?? [];
  // Empieza mostrando la primera que no salió bien (o la primera, si salieron todas bien).
  const [elegida, setElegida] = useState(() => (preguntas.find((p) => p.estado !== 'correcta') ?? preguntas[0])?.numero ?? 1);
  const [volteo, setVolteo] = useState(0);

  useEffect(() => {
    if (!datos) ir({ pantalla: 'capitulos', libro: libroId }, { reemplazar: true });
  }, [datos]);

  if (!datos) return null;
  const actual = preguntas.find((p) => p.numero === elegida) ?? preguntas[0];

  return (
    <main class="contenedor pantalla resumen">
      <div class="resumen__cabecera">
        <BotonIcono etiqueta={t('componentes.atras')} onClick={() => volver({ pantalla: 'resultado', libro: libroId, numero })}>
          <IconoAtras />
        </BotonIcono>
        <div>
          <h1 class="t-titulo resumen__titulo">{t('resumen.titulo')}</h1>
          <p class="resumen__subtitulo">{t('resumen.subtitulo', { n: numero, correctas: datos.correctas, total: preguntas.length })}</p>
        </div>
      </div>

      <ul class="resumen__leyenda t-etiqueta">
        {(['correcta', 'incorrecta', 'sin-respuesta'] as const).map((estado) => (
          <li key={estado}>
            <span class={`resumen__muestra tarjeta-pregunta--${estado}`} aria-hidden="true" />
            {t(NOMBRE_ESTADO[estado])}
          </li>
        ))}
      </ul>

      {RONDAS.map((ronda) => (
        <section key={ronda.numero} class={`resumen__ronda ronda-${ronda.numero}`}>
          <h2 class="resumen__ronda-titulo t-etiqueta">{t('resumen.ronda', { n: ronda.numero, nombre: t(`rondas.${ronda.numero}`) })}</h2>
          <div class="resumen__grilla">
            {preguntas
              .filter((p) => p.ronda === ronda.numero)
              .map((p) => (
                <button
                  key={`${p.numero}-${p.numero === elegida ? volteo : 0}`}
                  type="button"
                  class={`tarjeta-pregunta tarjeta-pregunta--${p.estado}${p.numero === elegida ? ' tarjeta-pregunta--elegida' : ''}`}
                  aria-label={t('resumen.tarjeta', { n: p.numero, estado: t(NOMBRE_ESTADO[p.estado]) })}
                  aria-pressed={p.numero === elegida}
                  onClick={() => {
                    setElegida(p.numero);
                    setVolteo((v) => v + 1);
                  }}
                >
                  {p.numero}
                </button>
              ))}
          </div>
        </section>
      ))}

      {actual && (
        <div class="resumen__detalle" aria-live="polite">
          <div class="resumen__detalle-fila t-etiqueta">
            <span>{t('resumen.pregunta', { n: actual.numero })}</span>
            <span class={`resumen__estado resumen__estado--${actual.estado}`}>{t(NOMBRE_ESTADO[actual.estado])}</span>
          </div>
          <p class="resumen__pregunta">{actual.texto}</p>
          <p class="resumen__ayuda t-etiqueta">{t('resumen.ayuda')}</p>
        </div>
      )}
    </main>
  );
}
