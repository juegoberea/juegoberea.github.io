// Pantalla 04 · Subir banco de preguntas. Lee el Excel con el lector y las reglas del convertidor.
// Diferencia con el convertidor: un capítulo con errores no frena a los demás; queda como borrador
// y no se puede publicar hasta corregirlo. Nada llega a los jugadores hasta publicar.

import { useRef, useState } from 'preact/hooks';
import { RONDAS } from '../../../app/src/contenido/tipos';
import { anotarBanco, descargarExcel } from '../acciones';
import type { CapituloBanco } from '../compartido/banco';
import { guardarCapitulos, leerBanco, type CapituloGuardado, type Libro } from '../datos';
import { IconoBajar, IconoExcel, IconoInfo } from '../iconos';
import { leerExcelBanco, revisarCapitulos, type CapituloRevisado, type Medicion } from '../revision';
import { mensajeDeError } from '../sesion';
import { t } from '../textos';
import { medirCapitulo } from '../vista/medir';

type Clase = 'sinCambios' | 'listo' | 'advertencias' | 'errores';

interface Fila {
  revisado: CapituloRevisado;
  clase: Clase;
  nuevo: boolean;
  /** Igual a lo que ya está guardado en el banco: no hace falta volver a guardarlo. */
  igualAlBanco: boolean;
}

interface Revision {
  archivo: string;
  leidoEn: Date;
  preguntas: number;
  reflexiones: number;
  filas: Fila[];
  mediciones: Map<number, Medicion | null>;
}

function clasificar(r: CapituloRevisado, guardado: CapituloGuardado | undefined): Fila {
  const publicado = guardado?.huella_publicada ?? null;
  const clase: Clase = publicado === r.huella && r.validacion !== 'errores' ? 'sinCambios' : r.validacion === 'errores' ? 'errores' : r.validacion === 'advertencias' ? 'advertencias' : 'listo';
  return { revisado: r, clase, nuevo: !guardado || guardado.huella_publicada === null, igualAlBanco: guardado?.huella === r.huella };
}

const rondasDe = (c: CapituloBanco) => RONDAS.map((r) => c.preguntas.filter((p) => p.ronda === r.numero).length);
const rondasBien = (c: CapituloBanco) => rondasDe(c).every((n, i) => n === RONDAS[i].cantidad);

/** Agrupa los capítulos sin cambios que van seguidos en una sola fila («1 a 10»). */
function agrupar(filas: Fila[]): (Fila | Fila[])[] {
  const salida: (Fila | Fila[])[] = [];
  for (const f of filas) {
    const ultima = salida[salida.length - 1];
    if (f.clase === 'sinCambios' && Array.isArray(ultima) && ultima[ultima.length - 1].revisado.capitulo.numero === f.revisado.capitulo.numero - 1) ultima.push(f);
    else salida.push(f.clase === 'sinCambios' ? [f] : f);
  }
  return salida;
}

function Estado({ fila }: { fila: Fila }) {
  const clase = { sinCambios: 'pub', listo: 'listo', advertencias: 'adv', errores: 'err' }[fila.clase];
  const texto = fila.clase === 'listo' ? t(fila.nuevo ? 'subir.estadoNuevo' : 'subir.estadoCorregido') : t(`subir.estado.${fila.clase}`);
  return <span class={`st ${clase}`}>{texto}</span>;
}

export function SubirBanco({ libro, alGuardar }: { libro: Libro; alGuardar: () => void }) {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [trabajando, setTrabajando] = useState<'leyendo' | 'guardando' | 'descargando' | null>(null);
  const [error, setError] = useState('');
  const entrada = useRef<HTMLInputElement>(null);

  async function leer(archivo: File) {
    setError('');
    setRevision(null);
    setTrabajando('leyendo');
    try {
      const leido = leerExcelBanco(await archivo.arrayBuffer(), archivo.name, libro.id);
      if (leido.errorArchivo) throw new Error(leido.errorArchivo);
      if (!leido.capitulos.length) throw new Error(t('subir.sinCapitulos', { libro: libro.titulo }));
      const guardados = await leerBanco();
      const porNumero = new Map(guardados.map((g) => [g.numero, g]));
      // Para buscar preguntas repetidas se mira el libro entero: lo guardado más lo nuevo.
      const libroCompleto = [...guardados.filter((g) => !leido.capitulos.some((c) => c.numero === g.numero)), ...leido.capitulos];
      const mediciones = new Map<number, Medicion | null>();
      for (const c of leido.capitulos) mediciones.set(c.numero, c.preguntas.length ? await medirCapitulo(c.preguntas) : null);
      const revisados = await revisarCapitulos(leido.capitulos, libroCompleto, libro.titulo, mediciones);
      setRevision({ archivo: archivo.name, leidoEn: new Date(), preguntas: leido.preguntas, reflexiones: leido.reflexiones, filas: revisados.map((r) => clasificar(r, porNumero.get(r.capitulo.numero))), mediciones });
    } catch (e) {
      setError(e instanceof Error && !('code' in e) ? e.message : mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  async function guardar() {
    if (!revision) return;
    setTrabajando('guardando');
    try {
      const cambiados = revision.filas.filter((f) => !f.igualAlBanco).map((f) => f.revisado);
      await guardarCapitulos(cambiados, revision.mediciones);
      await anotarBanco(revision.archivo, revision.filas.length);
      alGuardar();
    } catch (e) {
      setError(mensajeDeError(e));
      setTrabajando(null);
    }
  }

  async function descargar() {
    setTrabajando('descargando');
    try {
      await descargarExcel(libro);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  const cuenta = (clase: Clase) => revision?.filas.filter((f) => f.clase === clase).length ?? 0;
  const conErrores = revision?.filas.filter((f) => f.clase === 'errores').map((f) => f.revisado.capitulo.numero) ?? [];

  return (
    <>
      <div class="top">
        <div>
          <h1>{t('subir.titulo')}</h1>
          <p class="sub">{t('subir.sub')}</p>
        </div>
        <button class="btn line" onClick={descargar} disabled={trabajando !== null}>
          <IconoBajar />
          {trabajando === 'descargando' ? t('subir.descargando') : t('subir.descargar')}
        </button>
      </div>

      <label
        class="drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const archivo = e.dataTransfer?.files[0];
          if (archivo) void leer(archivo);
        }}
      >
        <span class="drop__icono"><IconoExcel /></span>
        <span class="drop__texto">
          {revision ? (
            <>
              <b>{revision.archivo}</b>
              <span class="muted">{t('subir.leido', { hora: revision.leidoEn.toTimeString().slice(0, 5), capitulos: revision.filas.length, preguntas: revision.preguntas, reflexiones: revision.reflexiones })}</span>
            </>
          ) : (
            <>
              <b>{trabajando === 'leyendo' ? t('subir.leyendo') : t('subir.arrastra')}</b>
              <span class="muted">{t('subir.arrastraDetalle')}</span>
            </>
          )}
        </span>
        <span class="btn line sm">{revision ? t('subir.otro') : t('subir.elegir')}</span>
        <input
          ref={entrada}
          class="solo-lectores"
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            const archivo = (e.target as HTMLInputElement).files?.[0];
            if (archivo) void leer(archivo);
            (e.target as HTMLInputElement).value = '';
          }}
        />
      </label>

      {error && <p class="note err" role="alert">{error}</p>}

      {revision && (
        <>
          <div class="row">
            <span class="st pub">{t('subir.resumen.sinCambios', { n: cuenta('sinCambios') })}</span>
            <span class="st listo">{t('subir.resumen.listos', { n: cuenta('listo') })}</span>
            <span class="st adv">{t('subir.resumen.advertencias', { n: cuenta('advertencias') })}</span>
            <span class="st err">{t('subir.resumen.errores', { n: cuenta('errores') })}</span>
          </div>

          <section class="card card--tabla" aria-labelledby="resultado">
            <h2 id="resultado">{t('subir.resultado')}</h2>
            <div class="scroll">
              <table class="tbl">
                <thead>
                  <tr><th>{t('subir.col.cap')}</th><th>{t('subir.col.titulo')}</th><th>{t('subir.col.preguntas')}</th><th>{t('subir.col.rondas')}</th><th>{t('subir.col.estado')}</th><th>{t('subir.col.encontro')}</th></tr>
                </thead>
                <tbody>
                  {agrupar(revision.filas).map((g) => {
                    if (Array.isArray(g)) {
                      const [primera, ultima] = [g[0].revisado.capitulo, g[g.length - 1].revisado.capitulo];
                      return (
                        <tr key={`g${primera.numero}`}>
                          <td>{g.length > 1 ? t('subir.rango', { desde: primera.numero, hasta: ultima.numero }) : primera.numero}</td>
                          <td>{g.length > 1 ? t('subir.rangoTitulo', { desde: primera.titulo, hasta: ultima.titulo }) : primera.titulo}</td>
                          <td>{g.reduce((s, f) => s + f.revisado.capitulo.preguntas.length, 0)}</td>
                          <td>{t('subir.bien')}</td>
                          <td><Estado fila={g[0]} /></td>
                          <td class="muted">{t('subir.igualesPublicada')}</td>
                        </tr>
                      );
                    }
                    const c = g.revisado.capitulo;
                    const avisos = g.revisado.avisos;
                    return (
                      <tr key={c.numero}>
                        <td>{c.numero}</td>
                        <td>{c.titulo || '—'}</td>
                        <td class={c.preguntas.length !== 20 ? 'mal' : ''}>{c.preguntas.length}</td>
                        <td class={rondasBien(c) ? '' : 'mal'}>{rondasBien(c) ? t('subir.bien') : rondasDe(c).join('·')}</td>
                        <td><Estado fila={g} /></td>
                        <td class={avisos.length ? '' : 'muted'}>
                          {avisos.length === 0 ? t('subir.sinProblemas') : (
                            <ul class="avisos">
                              {avisos.slice(0, 3).map((a, i) => <li key={i} class={a.tipo === 'error' ? 'aviso-error' : ''}>{a.texto}</li>)}
                              {avisos.length > 3 && <li class="muted">{t('subir.yMas', { n: avisos.length - 3 })}</li>}
                            </ul>
                          )}
                          {g.clase === 'advertencias' && <span class="muted">{t('subir.sePuedePublicar')}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {conErrores.length > 0 && (
            <div class="note info">
              <IconoInfo />
              <span>{t(conErrores.length === 1 ? 'subir.notaErrores1' : 'subir.notaErrores', { capitulos: conErrores.join(', ') })}</span>
            </div>
          )}

          <div class="row" style={{ justifyContent: 'flex-end' }}>
            <button class="btn line" onClick={() => setRevision(null)} disabled={trabajando !== null}>{t('subir.cancelar')}</button>
            <button class="btn pri" onClick={guardar} disabled={trabajando !== null}>{trabajando === 'guardando' ? t('subir.guardando') : t('subir.guardar')}</button>
          </div>
        </>
      )}
    </>
  );
}
