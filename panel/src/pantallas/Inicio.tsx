// Pantalla 03 · Inicio: avance del libro, versión de los jugadores, cambios sin publicar,
// capítulos que necesitan atención y actividad reciente.

import { describirCapitulos, fechaCorta, fechaDia, necesitanAtencion, resumenLibro } from '../estados';
import type { DatosPanel } from '../datos';
import type { Autora } from '../sesion';
import { t } from '../textos';

const porcentaje = (n: number, total: number) => `${((n / total) * 100).toFixed(2)}%`;

export function Inicio({ autora, datos }: { autora: Autora; datos: DatosPanel }) {
  const { libro, capitulos, version, registro } = datos;
  const r = resumenLibro(capitulos, libro.total_capitulos);
  const atencion = necesitanAtencion(capitulos);
  const partes = ['publicados', 'listos', 'advertencias', 'errores'] as const;

  return (
    <>
      <div class="top">
        <div>
          <h1>{t('inicio.hola', { nombre: autora.nombre })}</h1>
          <p class="sub">{t('inicio.sub', { libro: libro.titulo })}</p>
        </div>
        <div class="row">
          <a class="btn sec" href="#/subir">{t('inicio.subir')}</a>
          <a class="btn pri" href="#/publicar">{t('inicio.publicar')}</a>
        </div>
      </div>

      <section class="card" aria-labelledby="avance">
        <div class="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="avance">{t('inicio.avance')}</h2>
          <span class="muted" style={{ fontSize: '15px', fontWeight: 800 }}>{t('inicio.escritos', { n: r.escritos, total: libro.total_capitulos })}</span>
        </div>
        <div class="bar" role="img" aria-label={t('inicio.barra', { ...r })}>
          {partes.map((p) => r[p] > 0 && <i key={p} class={p} style={{ width: porcentaje(r[p], libro.total_capitulos) }} />)}
        </div>
        <div class="leg">
          {partes.map((p) => <span key={p} class={p}>{t(`inicio.${p}`, { n: r[p] })}</span>)}
          <span class="sin-escribir">{t('inicio.sinEscribir', { n: r.sinEscribir })}</span>
        </div>
      </section>

      <div class="cols3">
        <section class="card">
          <h3>{t('inicio.version')}</h3>
          {version ? (
            <>
              <div class="kpi">
                <b>{t('inicio.versionN', { n: version.numero })}</b>
                <span>{t('inicio.versionDetalle', { fecha: fechaDia(version.publicada_en), capitulos: describirCapitulos(version.capitulos) })}</span>
              </div>
              <span class="st pub" style={{ alignSelf: 'flex-start' }}>{t('inicio.versionFirmada')}</span>
            </>
          ) : (
            <div class="kpi">
              <b style={{ fontSize: '20px', lineHeight: '26px' }}>{t('inicio.sinVersion')}</b>
              <span>{t('inicio.sinVersionDetalle')}</span>
            </div>
          )}
        </section>
        <section class="card">
          <h3>{t('inicio.cambios')}</h3>
          <div class="kpi">
            <b>{r.cambios === 1 ? t('inicio.cambio1') : r.cambios === 0 ? t('inicio.sinCambios') : t('inicio.cambiosN', { n: r.cambios })}</b>
            {r.cambios > 0 && <span>{t('inicio.cambiosDetalle', { nuevos: r.nuevos, correcciones: r.correcciones })}</span>}
          </div>
          {r.cambios > 0 && <a class="btn sec sm" href="#/publicar" style={{ alignSelf: 'flex-start' }}>{t('inicio.verCambios')}</a>}
        </section>
        <section class="card">
          <h3>{t('inicio.atencion')}</h3>
          {atencion.length ? (
            <div class="atencion">
              {atencion.slice(0, 5).map((a) => (
                <a key={a.numero} href="#/capitulos">
                  <span>{t('inicio.capituloAviso', { n: a.numero, aviso: a.texto })}</span>
                  <span class={`st ${a.tipo === 'error' ? 'err' : 'adv'}`}>{t(`inicio.${a.tipo}`)}</span>
                </a>
              ))}
            </div>
          ) : (
            <p class="muted">{t('inicio.atencionNada')}</p>
          )}
        </section>
      </div>

      <section class="card" aria-labelledby="actividad">
        <h2 id="actividad">{t('inicio.actividad')}</h2>
        {registro.length ? (
          <div class="scroll">
            <table class="tbl">
              <thead><tr><th>{t('inicio.cuando')}</th><th>{t('inicio.que')}</th><th>{t('inicio.detalle')}</th></tr></thead>
              <tbody>
                {registro.map((fila) => (
                  <tr key={fila.id}>
                    <td class="muted">{fechaCorta(fila.cuando)}</td>
                    <td>
                      {t(`acciones.${fila.accion}`) === `acciones.${fila.accion}` ? fila.accion : t(`acciones.${fila.accion}`)}
                      {fila.resultado === 'rechazado' && <> <span class="st err">{t('inicio.rechazado')}</span></>}
                    </td>
                    <td>{[fila.detalle, fila.navegador].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p class="muted">{t('inicio.sinActividad')}</p>
        )}
      </section>
    </>
  );
}
