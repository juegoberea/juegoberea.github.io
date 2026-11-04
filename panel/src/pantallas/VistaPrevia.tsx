// Pantalla 06 · Vista previa de un capítulo, solo para la autora: las 20 preguntas por ronda, un
// celular de 360 px con la pantalla del juego (mismos componentes) y los controles a la derecha.

import { useEffect, useRef, useState } from 'preact/hooks';
import type { Contenido } from '../../../app/src/contenido/tipos';
import type { TamanoLetra } from '../../../app/src/datos/tipos';
import { ordenadas, type FilaPregunta } from '../compartido/banco';
import { contenidoPublicado, LIBRO, type CapituloGuardado, type Libro } from '../datos';
import { IconoAlerta, IconoCheck } from '../iconos';
import { t } from '../textos';
import { useBanco } from '../useBanco';
import { TAMANOS, type AlaVista, type DesdeLaVista } from '../vista/mensajes';
import { EstadoChip } from './Capitulos';

/** Preguntas corregidas que todavía no llegaron a los jugadores (por N.º). */
export function corregidasSinPublicar(capitulo: CapituloGuardado, publicado: Contenido | null): Set<number> {
  const enJuego = publicado?.libros[LIBRO]?.idiomas.es?.capitulos.find((c) => c.numero === capitulo.numero);
  if (!enJuego) return new Set();
  const cambiadas = new Set<number>();
  for (const p of capitulo.preguntas) {
    const antes = enJuego.preguntas.find((q) => q.id === p.numero);
    const igual = antes && antes.texto === p.texto && antes.ronda === p.ronda && antes.opciones.join('|') === [p.opcion_a, p.opcion_b, p.opcion_c].join('|') && antes.correcta === p.correcta && antes.explicacion === p.explicacion && antes.cita === p.cita;
    if (!igual) cambiadas.add(p.orden);
  }
  return cambiadas;
}

function Celular({ pregunta, posicion, rondas, letra, pantalla }: { pregunta: FilaPregunta; posicion: number; rondas: number[]; letra: TamanoLetra; pantalla: 'celular' | 'pc' }) {
  const marco = useRef<HTMLIFrameElement>(null);
  const [lista, setLista] = useState(false);
  const [sobra, setSobra] = useState<number | null>(null);

  useEffect(() => {
    const alMensaje = (e: MessageEvent<DesdeLaVista>) => {
      if (e.source !== marco.current?.contentWindow) return;
      if (e.data.tipo === 'lista') setLista(true);
      if (e.data.tipo === 'medida') setSobra(e.data.sobra);
    };
    window.addEventListener('message', alMensaje);
    return () => window.removeEventListener('message', alMensaje);
  }, []);

  useEffect(() => {
    if (!lista) return;
    const m: AlaVista = { tipo: 'mostrar', pregunta, posicion, rondas, letra };
    marco.current?.contentWindow?.postMessage(m, location.origin);
  }, [lista, pregunta, posicion, rondas, letra, pantalla]);

  return (
    <div class="celular-columna">
      <div class={`celular celular--${pantalla}`}>
        <iframe ref={marco} src="vista.html" title={t('vista.titulo')} class="celular__pantalla" />
      </div>
      {pantalla === 'celular' && sobra !== null && (
        <span class={`st ${sobra >= 0 ? 'pub' : 'err'}`}>{sobra >= 0 ? t('vista.sobran', { n: sobra }) : t('vista.faltan', { n: -sobra })}</span>
      )}
      <span class="hint">{t(pantalla === 'celular' ? 'vista.pieCelular' : 'vista.piePc', { letra: t(`vista.letra.${letra}`).toLowerCase() })}</span>
    </div>
  );
}

export function VistaPrevia({ libro, numero, posicion }: { libro: Libro; numero: number; posicion: number }) {
  const { banco, error } = useBanco(libro);
  const [publicado, setPublicado] = useState<Contenido | null>(null);
  const [letra, setLetra] = useState<TamanoLetra>('normal');
  const [pantalla, setPantalla] = useState<'celular' | 'pc'>('celular');

  useEffect(() => {
    contenidoPublicado().then(setPublicado, () => setPublicado(null));
  }, []);

  if (error) return <p class="note err" role="alert">{error}</p>;
  if (!banco) return <p class="aviso-carga">{t('inicio.cargando')}</p>;
  const capitulo = banco.find((c) => c.numero === numero);
  if (!capitulo || !capitulo.preguntas.length) return <p class="note err">{t('vista.noExiste', { n: numero })}</p>;

  const preguntas = ordenadas(capitulo.preguntas);
  const indice = Math.min(Math.max(posicion, 1), preguntas.length) - 1;
  const actual = preguntas[indice];
  const rondas = preguntas.map((p) => p.ronda ?? 1);
  const corregidas = corregidasSinPublicar(capitulo, publicado);
  const ir = (i: number) => `#/capitulo/${numero}/pregunta/${i + 1}`;
  const noEntran = capitulo.medicion ? preguntas.filter((p) => (capitulo.medicion!.preguntas[p.orden] ?? [0, 0, 0]).some((s) => s < 0)) : [];

  return (
    <>
      <div class="top">
        <div>
          <a class="volver" href="#/capitulos">{t('vista.volver')}</a>
          <h1>{t('vista.encabezado', { n: numero, titulo: capitulo.titulo })}</h1>
        </div>
        <div class="row">
          <EstadoChip capitulo={capitulo} />
          <span class="preview-tag">{t('vista.etiqueta')}</span>
        </div>
      </div>

      <div class="vista">
        <section class="card vista__lista" aria-label={t('vista.lista')}>
          <h3>{t('vista.lasVeinte', { n: preguntas.length })}</h3>
          {[1, 2, 3, 4].map((r) => (
            <div key={r} class={`ronda-${r} vista__ronda`}>
              <span class="vista__nombre-ronda">{t(`vista.ronda.${r}`)}</span>
              <div class="vista__casillas">
                {preguntas.map((p, i) => (p.ronda ?? 1) !== r ? null : (
                  <a key={p.orden} href={ir(i)} class={`casilla${i === indice ? ' casilla--actual' : ''}${corregidas.has(p.orden) ? ' casilla--corregida' : ''}`} aria-current={i === indice ? 'true' : undefined} aria-label={t('vista.pregunta', { n: i + 1 })}>
                    {i + 1}
                  </a>
                ))}
              </div>
            </div>
          ))}
          {corregidas.size > 0 && <span class="hint">{t('vista.notaCorregidas')}</span>}
        </section>

        <Celular pregunta={actual} posicion={indice} rondas={rondas} letra={letra} pantalla={pantalla} />

        <section class="card vista__controles" aria-label={t('vista.controles')}>
          <div class="field">
            <span class="field__titulo">{t('vista.pantalla')}</span>
            <div class="segmentado" role="radiogroup" aria-label={t('vista.pantalla')}>
              {(['celular', 'pc'] as const).map((p) => <button key={p} role="radio" aria-checked={pantalla === p} onClick={() => setPantalla(p)}>{t(`vista.${p}`)}</button>)}
            </div>
          </div>
          <div class="field">
            <span class="field__titulo">{t('vista.tamano')}</span>
            <div class="segmentado segmentado--3" role="radiogroup" aria-label={t('vista.tamano')}>
              {TAMANOS.map((l) => <button key={l} role="radio" aria-checked={letra === l} onClick={() => setLetra(l)}>{t(`vista.letra.${l}`)}</button>)}
            </div>
          </div>
          <div class="explicacion">
            <span class="explicacion__titulo">{t('vista.explicacion')}</span>
            <p>{actual.explicacion || t('vista.sinExplicacion')}</p>
            <b>{actual.cita || t('vista.sinCita')}</b>
          </div>
          {capitulo.medicion && (noEntran.length === 0
            ? <div class="note ok"><IconoCheck /><span>{t('vista.entranTodas', { n: preguntas.length })}</span></div>
            : <div class="note err"><IconoAlerta /><span>{t('vista.noEntran', { lista: noEntran.map((p) => preguntas.indexOf(p) + 1).join(', ') })}</span></div>)}
          {capitulo.avisos.length > 0 && (
            <ul class="avisos avisos--tarjeta">
              {capitulo.avisos.map((a, i) => <li key={i} class={a.tipo === 'error' ? 'aviso-error' : ''}>{a.texto}</li>)}
            </ul>
          )}
          <a class="btn sec" href={`#/capitulo/${numero}/editar/${actual.orden}`}>{t('vista.editar')}</a>
          <div class="row" style={{ justifyContent: 'space-between' }}>
            {indice > 0 ? <a class="btn line sm" href={ir(indice - 1)}>{t('vista.anterior', { n: indice })}</a> : <span />}
            {indice < preguntas.length - 1 && <a class="btn line sm" href={ir(indice + 1)}>{t('vista.siguiente', { n: indice + 2 })}</a>}
          </div>
        </section>
      </div>
    </>
  );
}
