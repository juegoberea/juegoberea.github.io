// Pantalla 07 · Editar pregunta. Al guardar se vuelve a validar el capítulo con las mismas reglas
// (un borrador con errores pasa a «listo» cuando se corrigen) y la corrección queda pendiente
// hasta publicar. Los jugadores que ya aprobaron conservan sus puntos y estrellas.

import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Contenido } from '../../../app/src/contenido/tipos';
import { ordenadas, type FilaPregunta } from '../compartido/banco';
import { contenidoPublicado, guardarPregunta, LIBRO, leerVersiones, type Libro } from '../datos';
import { IconoCheck, IconoInfo } from '../iconos';
import { revisarCapitulos, type Medicion } from '../revision';
import { anotar, mensajeDeError } from '../sesion';
import { t } from '../textos';
import { useBanco } from '../useBanco';
import { medirCapitulo } from '../vista/medir';

const LARGO_PREGUNTA = 140;
type Campo = 'texto' | 'opcion_a' | 'opcion_b' | 'opcion_c' | 'correcta' | 'explicacion' | 'cita';
const CAMPOS: Campo[] = ['texto', 'opcion_a', 'opcion_b', 'opcion_c', 'correcta', 'explicacion', 'cita'];
const LETRAS = ['A', 'B', 'C'];

/** La pregunta tal como la tienen los jugadores (o null si nunca se publicó). */
function enJuego(publicado: Contenido | null, capitulo: number, numero: number | null): FilaPregunta | null {
  const p = publicado?.libros[LIBRO]?.idiomas.es?.capitulos.find((c) => c.numero === capitulo)?.preguntas.find((q) => q.id === numero);
  if (!p) return null;
  return { orden: -1, numero: p.id, ronda: p.ronda, texto: p.texto, opcion_a: p.opciones[0], opcion_b: p.opciones[1], opcion_c: p.opciones[2], correcta: p.correcta, explicacion: p.explicacion, cita: p.cita };
}

const mostrarCampo = (p: FilaPregunta, campo: Campo) => (campo === 'correcta' ? (p.correcta === null ? '—' : LETRAS[p.correcta]) : String(p[campo] ?? ''));

export function EditarPregunta({ libro, numero, orden, alGuardar }: { libro: Libro; numero: number; orden: number; alGuardar: (posicion: number) => void }) {
  const { banco, error: errorBanco } = useBanco(libro);
  const [publicado, setPublicado] = useState<Contenido | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [pregunta, setPregunta] = useState<FilaPregunta | null>(null);
  const [sobra, setSobra] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    contenidoPublicado().then(setPublicado, () => undefined);
    leerVersiones().then((v) => setVersion(v.find((x) => !x.retirada_en)?.numero ?? null), () => undefined);
  }, []);

  const capitulo = banco?.find((c) => c.numero === numero);
  const original = capitulo?.preguntas.find((p) => p.orden === orden) ?? null;
  useEffect(() => {
    if (original && !pregunta) setPregunta({ ...original });
  }, [original, pregunta]);

  // Medición en vivo con letra muy grande (con una pequeña espera mientras se escribe).
  useEffect(() => {
    if (!pregunta) return;
    const id = setTimeout(() => medirCapitulo([pregunta]).then((m) => setSobra(m.muyGrande)), 400);
    return () => clearTimeout(id);
  }, [pregunta?.texto, pregunta?.opcion_a, pregunta?.opcion_b, pregunta?.opcion_c]);

  const publicada = useMemo(() => (original ? enJuego(publicado, numero, original.numero) : null), [publicado, numero, original]);
  // «Antes» es lo que tienen los jugadores; si nunca se publicó, lo que estaba guardado.
  const antes = publicada ?? original;
  const cambios = pregunta && antes ? CAMPOS.filter((c) => mostrarCampo(pregunta, c) !== mostrarCampo(antes, c)) : [];
  const cambiosAlGuardado = pregunta && original ? CAMPOS.filter((c) => mostrarCampo(pregunta, c) !== mostrarCampo(original, c)) : [];

  if (errorBanco) return <p class="note err" role="alert">{errorBanco}</p>;
  if (!banco || !pregunta) return <p class="aviso-carga">{t('inicio.cargando')}</p>;
  if (!capitulo || !original) return <p class="note err">{t('vista.noExiste', { n: numero })}</p>;

  const posicion = ordenadas(capitulo.preguntas).findIndex((p) => p.orden === orden) + 1;
  const poner = (campo: Campo, valor: string | number) => setPregunta({ ...pregunta, [campo]: valor });

  async function guardar() {
    if (!capitulo || !pregunta || !original) return;
    setGuardando(true);
    setError('');
    try {
      const nuevo = { ...capitulo, preguntas: capitulo.preguntas.map((p) => (p.orden === orden ? pregunta : p)) };
      const medida = await medirCapitulo([pregunta]);
      const medicion: Medicion | null = capitulo.medicion
        ? { ...capitulo.medicion, preguntas: { ...capitulo.medicion.preguntas, [orden]: medida.preguntas[pregunta.orden] } }
        : await medirCapitulo(nuevo.preguntas);
      if (medicion && capitulo.medicion) {
        const valores = Object.values(medicion.preguntas);
        [medicion.normal, medicion.grande, medicion.muyGrande] = [0, 1, 2].map((i) => Math.min(...valores.map((v) => v[i])));
      }
      const [revisado] = await revisarCapitulos([nuevo], banco!, libro.titulo, new Map([[numero, medicion]]));
      await guardarPregunta(numero, pregunta, revisado, medicion);
      await anotar('pregunta_corregida', t('editar.registro', { capitulo: numero, pregunta: pregunta.numero ?? '?', campos: cambiosAlGuardado.map((c) => t(`editar.campo.${c}`)).join(', ') }));
      alGuardar(posicion);
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  const largo = pregunta.texto.length;

  return (
    <>
      <div class="top">
        <div>
          <a class="volver" href={`#/capitulo/${numero}/pregunta/${posicion}`}>{t('editar.volver', { n: numero })}</a>
          <h1>{t('editar.titulo', { n: pregunta.numero ?? '?' })}</h1>
          <p class="sub">{t('editar.sub', { capitulo: numero, titulo: capitulo.titulo, ronda: pregunta.ronda ?? '?', nombre: t(`vista.rondaNombre.${pregunta.ronda ?? 1}`) })}</p>
        </div>
        <span class={`st ${publicada ? 'pub' : 'listo'}`}>{publicada && version ? t('editar.publicada', { n: version }) : t('editar.sinPublicar')}</span>
      </div>

      <div class="editar">
        <section class="card">
          <div class="field">
            <label for="texto">{t('editar.pregunta')}</label>
            <textarea id="texto" class="input" rows={3} value={pregunta.texto} onInput={(e) => poner('texto', (e.target as HTMLTextAreaElement).value)} />
            <span class={`hint${largo > LARGO_PREGUNTA || (sobra !== null && sobra < 0) ? ' hint--mal' : ''}`}>
              {t('editar.letras', { n: largo, max: LARGO_PREGUNTA })} · {sobra === null ? t('editar.midiendo') : sobra >= 0 ? t('editar.entra') : t('editar.noEntra', { n: -sobra })}
            </span>
          </div>
          <fieldset class="field opciones-editar">
            <legend>{t('editar.opciones')}</legend>
            {(['opcion_a', 'opcion_b', 'opcion_c'] as const).map((campo, i) => (
              <div key={campo} class={`opcion-editar${pregunta.correcta === i ? ' opcion-editar--correcta' : ''}`}>
                <button type="button" class="opcion-editar__marca" aria-pressed={pregunta.correcta === i} aria-label={t('editar.marcarCorrecta', { letra: LETRAS[i] })} onClick={() => poner('correcta', i)}>
                  {pregunta.correcta === i ? <IconoCheck /> : LETRAS[i]}
                </button>
                <input class="input" aria-label={t('editar.opcion', { letra: LETRAS[i] })} value={pregunta[campo]} onInput={(e) => poner(campo, (e.target as HTMLInputElement).value)} />
              </div>
            ))}
            <span class="hint">{t('editar.mezcla')}</span>
          </fieldset>
          <div class="field">
            <label for="explicacion">{t('editar.explicacion')}</label>
            <textarea id="explicacion" class="input" rows={3} value={pregunta.explicacion} onInput={(e) => poner('explicacion', (e.target as HTMLTextAreaElement).value)} />
          </div>
          <div class="field">
            <label for="cita">{t('editar.cita')}</label>
            <input id="cita" class="input" value={pregunta.cita} onInput={(e) => poner('cita', (e.target as HTMLInputElement).value)} />
          </div>
          {error && <p class="note err" role="alert">{error}</p>}
          <div class="row" style={{ justifyContent: 'flex-end' }}>
            <a class="btn line" href={`#/capitulo/${numero}/pregunta/${posicion}`}>{t('editar.cancelar')}</a>
            <button class="btn pri" onClick={guardar} disabled={guardando || cambiosAlGuardado.length === 0}>{guardando ? t('editar.guardando') : t('editar.guardar')}</button>
          </div>
        </section>

        <div class="editar__lado">
          <section class="card">
            <h3>{t('editar.queCambio')}</h3>
            {cambios.length === 0 ? <p class="muted">{t('editar.sinCambios')}</p> : cambios.map((c) => (
              <div key={c} class="cambio">
                <span class="cambio__campo">{t(`editar.campo.${c}`)}</span>
                <span class="cambio__etiqueta">{t('editar.antes')}</span>
                <del>{mostrarCampo(antes!, c) || '—'}</del>
                <span class="cambio__etiqueta">{t('editar.ahora')}</span>
                <ins>{mostrarCampo(pregunta, c) || '—'}</ins>
              </div>
            ))}
          </section>
          <div class="note info">
            <IconoInfo />
            <span>{t('editar.llega', { n: numero })}</span>
          </div>
        </div>
      </div>
    </>
  );
}
