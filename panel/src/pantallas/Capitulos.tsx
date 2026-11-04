// Pantalla 05 · Capítulos: estado de cada capítulo, correctas A·B·C, si entra en celular con letra
// muy grande, y «Vista previa» o «Corregir». Los capítulos sin escribir se agrupan en una fila.

import { useState } from 'preact/hooks';
import type { CapituloGuardado, Libro } from '../datos';
import { estadoCapitulo, type EstadoCapitulo } from '../estados';
import { t } from '../textos';
import { useBanco } from '../useBanco';

type Filtro = 'todos' | 'publicados' | 'listos' | 'avisos';

const PASA: Record<Filtro, (e: EstadoCapitulo) => boolean> = {
  todos: () => true,
  publicados: (e) => e === 'publicado' || e === 'correccion',
  listos: (e) => e === 'listo',
  avisos: (e) => e === 'advertencias' || e === 'errores',
};

const CLASE: Record<EstadoCapitulo, string> = { publicado: 'pub', correccion: 'borr', listo: 'listo', advertencias: 'adv', errores: 'err' };

export function EstadoChip({ capitulo }: { capitulo: CapituloGuardado }) {
  const estado = estadoCapitulo(capitulo);
  const advertencias = capitulo.avisos.filter((a) => a.tipo === 'advertencia').length;
  return <span class={`st ${CLASE[estado]}`}>{t(`estado.${estado}`, { n: advertencias })}</span>;
}

function Medida({ capitulo, midiendo }: { capitulo: CapituloGuardado; midiendo: boolean }) {
  if (capitulo.validacion === 'errores' && !capitulo.medicion) return <span class="muted">—</span>;
  if (!capitulo.medicion) return <span class="muted">{midiendo ? t('capitulos.midiendo') : t('capitulos.sinMedir')}</span>;
  const malas = capitulo.preguntas.filter((p) => (capitulo.medicion!.preguntas[p.orden]?.[2] ?? 0) < 0);
  if (!malas.length) return <span class="st pub">{t('capitulos.entran', { n: capitulo.preguntas.length })}</span>;
  return <span class="st err">{t(malas.length === 1 ? 'capitulos.noEntra1' : 'capitulos.noEntran', { n: malas[0].numero ?? '?', cuantas: malas.length })}</span>;
}

export function Capitulos({ libro }: { libro: Libro }) {
  const { banco, error, midiendo } = useBanco(libro);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  if (error) return <p class="note err" role="alert">{error}</p>;
  if (!banco) return <p class="aviso-carga">{t('inicio.cargando')}</p>;

  const cuenta = (f: Filtro) => banco.filter((c) => PASA[f](estadoCapitulo(c))).length;
  const visibles = banco.filter((c) => PASA[filtro](estadoCapitulo(c))).sort((a, b) => b.numero - a.numero);
  const ultimo = banco.reduce((m, c) => Math.max(m, c.numero), 0);

  return (
    <>
      <div class="top">
        <div>
          <h1>{t('capitulos.titulo')}</h1>
          <p class="sub">{t('capitulos.sub', { libro: libro.titulo, n: banco.length, total: libro.total_capitulos })}</p>
        </div>
        <div class="row" role="group" aria-label={t('capitulos.filtrar')}>
          {(['todos', 'publicados', 'listos', 'avisos'] as Filtro[]).map((f) => (
            <button key={f} class={`btn sm ${filtro === f ? 'activo' : 'line'}`} aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
              {t(`capitulos.filtro.${f}`, { n: cuenta(f) })}
            </button>
          ))}
        </div>
      </div>

      <section class="card card--tabla">
        <div class="scroll">
          <table class="tbl">
            <thead>
              <tr><th>{t('capitulos.col.cap')}</th><th>{t('capitulos.col.titulo')}</th><th>{t('capitulos.col.estado')}</th><th>{t('capitulos.col.correctas')}</th><th>{t('capitulos.col.celular')}</th><th class="derecha">{t('capitulos.col.acciones')}</th></tr>
            </thead>
            <tbody>
              {visibles.map((c) => {
                const estado = estadoCapitulo(c);
                const correctas = [0, 1, 2].map((i) => c.preguntas.filter((p) => p.correcta === i).length);
                const nuevo = estado !== 'publicado' && estado !== 'correccion';
                return (
                  <tr key={c.numero}>
                    <td>{c.numero}</td>
                    <td>{nuevo ? <b>{c.titulo || '—'}</b> : c.titulo}</td>
                    <td><EstadoChip capitulo={c} /></td>
                    <td class={estado === 'errores' ? 'muted' : ''}>{estado === 'errores' ? '—' : correctas.join(' · ')}</td>
                    <td><Medida capitulo={c} midiendo={midiendo === c.numero} /></td>
                    <td class="derecha">
                      {estado === 'errores'
                        ? <a class="btn sec sm" href={`#/capitulo/${c.numero}`}>{t('capitulos.corregir')}</a>
                        : <a class="btn line sm" href={`#/capitulo/${c.numero}`}>{t('capitulos.vista')}</a>}
                    </td>
                  </tr>
                );
              })}
              {filtro === 'todos' && ultimo < libro.total_capitulos && (
                <tr>
                  <td class="muted">{t('subir.rango', { desde: ultimo + 1, hasta: libro.total_capitulos })}</td>
                  <td class="muted">{t('capitulos.sinEscribir')}</td>
                  <td><span class="st vacio">{t('capitulos.nCapitulos', { n: libro.total_capitulos - ultimo })}</span></td>
                  <td class="muted">—</td>
                  <td class="muted">—</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
