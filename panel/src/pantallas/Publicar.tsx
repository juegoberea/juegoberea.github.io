// Pantalla 08 · Publicar la versión N: qué incluye (con casillas), mensaje para los jugadores,
// el botón que publica (se firma solo en el servidor) y las versiones publicadas con «Volver a esta».

import { useEffect, useState } from 'preact/hooks';
import type { Contenido } from '../../../app/src/contenido/tipos';
import { contenidoPublicado, leerVersiones, llamarFuncion, LIBRO, type CapituloGuardado, type FilaVersion, type Libro } from '../datos';
import { describirCapitulos, estadoCapitulo, fechaDia } from '../estados';
import { IconoCheck, IconoInfo } from '../iconos';
import { t } from '../textos';
import { useBanco } from '../useBanco';
import { corregidasSinPublicar } from './VistaPrevia';

const LARGO_MENSAJE = 300;

function detalle(c: CapituloGuardado, publicado: Contenido | null): { clase: string; etiqueta: string; texto: string } {
  const estado = estadoCapitulo(c);
  if (estado === 'errores') return { clase: 'err', etiqueta: t('publicar.etiqueta.errores'), texto: t('publicar.conErrores') };
  if (estado === 'advertencias') {
    const aviso = c.avisos.find((a) => a.tipo === 'advertencia')?.texto ?? '';
    return { clase: 'adv', etiqueta: t('publicar.etiqueta.advertencias'), texto: t('publicar.conAdvertencias', { aviso }) };
  }
  if (estado === 'correccion') {
    const n = corregidasSinPublicar(c, publicado).size;
    return { clase: 'borr', etiqueta: t('publicar.etiqueta.correccion'), texto: t(n === 1 ? 'publicar.corregida1' : 'publicar.corregidas', { n }) };
  }
  return { clase: 'listo', etiqueta: t('publicar.etiqueta.nuevo'), texto: t('publicar.nuevas', { n: c.preguntas.length }) };
}

export function Publicar({ libro, alPublicar }: { libro: Libro; alPublicar: () => void }) {
  const { banco, error: errorBanco, recargar } = useBanco(libro);
  const [versiones, setVersiones] = useState<FilaVersion[] | null>(null);
  const [publicado, setPublicado] = useState<Contenido | null>(null);
  const [marcados, setMarcados] = useState<Set<number> | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  async function cargar() {
    const [v, c] = await Promise.all([leerVersiones(), contenidoPublicado()]);
    setVersiones(v);
    setPublicado(c);
  }
  useEffect(() => {
    cargar().catch((e) => setAviso({ tipo: 'err', texto: String(e.message ?? e) }));
  }, []);

  const pendientes = (banco ?? []).filter((c) => estadoCapitulo(c) !== 'publicado').sort((a, b) => a.numero - b.numero);
  // Marcados por defecto: los nuevos listos y las correcciones. Los con advertencias, sin marcar.
  useEffect(() => {
    if (banco && !marcados) setMarcados(new Set(pendientes.filter((c) => ['listo', 'correccion'].includes(estadoCapitulo(c))).map((c) => c.numero)));
  }, [banco]);

  if (errorBanco) return <p class="note err" role="alert">{errorBanco}</p>;
  if (!banco || !versiones || !marcados) return <p class="aviso-carga">{t('inicio.cargando')}</p>;

  const siguiente = (versiones[0]?.numero ?? 0) + 1;
  const vigente = versiones.find((v) => !v.retirada_en) ?? null;
  // Los capítulos deben quedar seguidos desde el 1: lo que ya tienen los jugadores más lo marcado.
  const enJuego = new Set(publicado?.libros[LIBRO]?.idiomas.es?.capitulos.map((c) => c.numero) ?? []);
  const despues = [...new Set([...enJuego, ...marcados])].sort((a, b) => a - b);
  const salteado = despues.findIndex((n, i) => n !== i + 1);
  const falta = salteado >= 0 ? salteado + 1 : null;
  const puede = marcados.size > 0 && falta === null && !trabajando;

  function alternar(n: number) {
    const nuevo = new Set(marcados);
    if (nuevo.has(n)) nuevo.delete(n);
    else nuevo.add(n);
    setMarcados(nuevo);
  }

  async function publicar(cuerpo: { capitulos: number[]; mensaje: string } | { volverA: number }) {
    setTrabajando(true);
    setAviso(null);
    try {
      const r = await llamarFuncion<{ numero: number }>('publicar', cuerpo);
      setAviso({ tipo: 'ok', texto: t('publicar.listo', { n: r.numero }) });
      setMensaje('');
      setMarcados(null);
      await Promise.all([cargar(), recargar()]);
      alPublicar();
    } catch (e) {
      setAviso({ tipo: 'err', texto: (e as Error).message });
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <>
      <div class="top">
        <div>
          <h1>{t('publicar.titulo', { n: siguiente })}</h1>
          <p class="sub">{t('publicar.sub')}</p>
        </div>
      </div>

      {aviso && <p class={`note ${aviso.tipo}`} role={aviso.tipo === 'err' ? 'alert' : 'status'}>{aviso.texto}</p>}

      <div class="publicar">
        <div class="publicar__principal">
          <section class="card" aria-labelledby="incluye">
            <h2 id="incluye">{t('publicar.incluye')}</h2>
            {pendientes.length === 0 ? <p class="muted">{t('publicar.nada')}</p> : (
              <ul class="incluye">
                {pendientes.map((c) => {
                  const d = detalle(c, publicado);
                  const bloqueado = estadoCapitulo(c) === 'errores';
                  return (
                    <li key={c.numero} class={`incluye__fila${bloqueado ? ' incluye__fila--bloqueada' : ''}`}>
                      <input type="checkbox" id={`cap${c.numero}`} checked={marcados.has(c.numero)} disabled={bloqueado} onChange={() => alternar(c.numero)} />
                      <label for={`cap${c.numero}`} class="incluye__texto">
                        <b>{t('publicar.capitulo', { n: c.numero, titulo: c.titulo })}</b>
                        <span class="muted">{d.texto}</span>
                      </label>
                      {bloqueado ? <a class="btn sec sm" href={`#/capitulo/${c.numero}`}>{t('capitulos.corregir')}</a> : <span class={`st ${d.clase}`}>{d.etiqueta}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            {falta !== null && <p class="note err">{t('publicar.salteado', { n: falta })}</p>}
          </section>

          <section class="card">
            <div class="row" style={{ justifyContent: 'space-between' }}>
              <label for="mensaje" class="field__titulo">{t('publicar.mensaje')}</label>
              <span class="hint">{t('publicar.opcional')}</span>
            </div>
            <textarea id="mensaje" class="input" rows={3} maxLength={LARGO_MENSAJE} value={mensaje} onInput={(e) => setMensaje((e.target as HTMLTextAreaElement).value)} />
            <span class="hint">{t('publicar.mensajeAyuda')}</span>
          </section>

          <section class="card">
            {marcados.size > 0 && falta === null && <div class="note ok"><IconoCheck /><span>{t('publicar.revisado')}</span></div>}
            <p class="sub">{t('publicar.llega', { n: siguiente })}</p>
            <button class="btn pri grande" disabled={!puede} onClick={() => publicar({ capitulos: [...marcados], mensaje })}>
              {trabajando ? t('publicar.publicando') : t('publicar.boton', { n: siguiente })}
            </button>
            <span class="hint centrado">{t('publicar.firma')}</span>
          </section>
        </div>

        <section class="card publicar__versiones" aria-labelledby="versiones">
          <h2 id="versiones">{t('publicar.versiones')}</h2>
          {versiones.length === 0 ? <p class="muted">{t('publicar.sinVersiones')}</p> : (
            <ul class="versiones">
              {versiones.map((v) => (
                <li key={v.numero}>
                  <div>
                    <b>{t('publicar.version', { n: v.numero, fecha: fechaDia(v.publicada_en) })}</b>
                    <span class="muted">{describirCapitulos(v.capitulos)}{v.vuelve_a ? ` · ${t('publicar.igualA', { n: v.vuelve_a })}` : ''}{v.retirada_en ? ` · ${t('publicar.retirada')}` : ''}</span>
                  </div>
                  {v.numero === vigente?.numero ? <span class="st pub">{t('publicar.laTienen')}</span>
                    : (
                      <button class="btn line sm" disabled={trabajando} onClick={() => confirm(t('publicar.confirmarVolver', { n: v.numero, nueva: siguiente })) && publicar({ volverA: v.numero })}>
                        {t('publicar.volver')}
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}
          <div class="note info"><IconoInfo /><span>{t('publicar.volverAyuda')}</span></div>
        </section>
      </div>
    </>
  );
}
