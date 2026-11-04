// Pantalla 12 · Ajustes: tamaño de letra con vista previa, sonidos, música del menú,
// estilo (próximamente), cambiar de perfil y copia de respaldo.

import { useRef, useState } from 'preact/hooks';
import { descargar } from '../../app/archivos';
import { useApp } from '../../app/estado';
import { Avatar, Boton, BotonIcono, IconoAdelante, IconoAtras, Interruptor } from '../../componentes';
import { abrirRespaldo, ErrorRespaldo, exportarRespaldo, importarRespaldo, nombreArchivoRespaldo, EXTENSION_RESPALDO } from '../../datos/respaldo';
import { TAMANOS_LETRA, type Ajustes as AjustesPerfil, type TamanoLetra } from '../../datos/tipos';
import { sonar } from '../../sonido/efectos';
import { t } from '../../textos';
import './ajustes.css';

const NOMBRE_LETRA: Record<TamanoLetra, string> = {
  normal: 'ajustes.letraNormal',
  grande: 'ajustes.letraGrande',
  muyGrande: 'ajustes.letraMuyGrande',
};

type Aviso = { tipo: 'bien' | 'error'; texto: string } | null;

function unirNombres(nombres: string[]): string {
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')}${t('ajustes.y')}${nombres[nombres.length - 1]}`;
}

export function Ajustes() {
  const { datos, perfil, actualizarPerfil, ir, volver, silenciado } = useApp();
  const [aviso, setAviso] = useState<Aviso>(null);
  const [porRecuperar, setPorRecuperar] = useState<{ archivo: Uint8Array; nombres: string[] } | null>(null);
  const selector = useRef<HTMLInputElement>(null);
  if (!perfil || !datos) return null;

  async function cambiar(cambio: Partial<AjustesPerfil>) {
    if (!datos || !perfil) return;
    const nuevo = await datos.guardarAjustes(perfil.id, { ...perfil.ajustes, ...cambio });
    actualizarPerfil(nuevo);
    if (cambio.sonidos) sonar('toque', !silenciado);
  }

  async function guardarCopia() {
    if (!datos || !perfil) return;
    descargar(await exportarRespaldo(datos, [perfil.id]), nombreArchivoRespaldo(perfil.nombre));
    setAviso({ tipo: 'bien', texto: t('ajustes.copiaGuardada') });
  }

  async function elegirCopia(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    try {
      const respaldo = await abrirRespaldo(bytes);
      setAviso(null);
      setPorRecuperar({ archivo: bytes, nombres: respaldo.perfiles.map((p) => p.perfil.nombre) });
    } catch (error) {
      setAviso({ tipo: 'error', texto: t(error instanceof ErrorRespaldo && error.motivo === 'alterado' ? 'ajustes.copiaAlterada' : 'ajustes.copiaFormato') });
    }
  }

  async function recuperar() {
    if (!datos || !perfil || !porRecuperar) return;
    const recuperados = await importarRespaldo(datos, porRecuperar.archivo);
    setPorRecuperar(null);
    setAviso({ tipo: 'bien', texto: t('ajustes.copiaRecuperada', { nombres: unirNombres(recuperados.map((p) => p.nombre)) }) });
    // Si la copia traía este mismo perfil, se ve su avance y sus ajustes recuperados.
    const actual = await datos.obtenerPerfil(perfil.id);
    if (actual) actualizarPerfil(actual);
  }

  return (
    <main class="contenedor pantalla ajustes">
      <div class="progreso__cabecera ajustes__cabecera">
        <BotonIcono etiqueta={t('componentes.atras')} onClick={() => volver({ pantalla: 'biblioteca' })}>
          <IconoAtras />
        </BotonIcono>
        <h1 class="t-titulo ajustes__titulo">{t('ajustes.titulo')}</h1>
      </div>

      <section class="tarjeta ajustes__seccion">
        <h2 class="ajustes__subtitulo" id="titulo-letra">
          {t('ajustes.letra')}
        </h2>
        <div class="segmentado" role="radiogroup" aria-labelledby="titulo-letra">
          {TAMANOS_LETRA.map((nivel) => (
            <button
              key={nivel}
              type="button"
              role="radio"
              aria-checked={perfil.ajustes.letra === nivel}
              class={`segmentado__opcion${perfil.ajustes.letra === nivel ? ' segmentado__opcion--elegida' : ''}`}
              onClick={() => cambiar({ letra: nivel })}
            >
              {t(NOMBRE_LETRA[nivel])}
            </button>
          ))}
        </div>
        <div class="ajustes__vista-previa">
          <span class="t-etiqueta">{t('ajustes.vistaPrevia')}</span>
          <p class="t-pregunta">{t('ajustes.ejemplo')}</p>
        </div>
      </section>

      <section class="tarjeta ajustes__seccion ajustes__lista">
        <div class="ajustes__fila">
          <span class="ajustes__fila-texto">
            <strong id="ajuste-sonidos">{t('ajustes.sonidos')}</strong>
          </span>
          <Interruptor encendido={perfil.ajustes.sonidos} etiquetadoPor="ajuste-sonidos" onCambiar={(v) => cambiar({ sonidos: v })} />
        </div>
        <div class="ajustes__fila">
          <span class="ajustes__fila-texto">
            <strong id="ajuste-musica">{t('ajustes.musica')}</strong>
            <span class="t-etiqueta">{t('ajustes.musicaAyuda')}</span>
          </span>
          <Interruptor encendido={perfil.ajustes.musica} etiquetadoPor="ajuste-musica" onCambiar={(v) => cambiar({ musica: v })} />
        </div>
        <div class="ajustes__fila ajustes__fila--apagada">
          <span class="ajustes__fila-texto">
            <strong>{t('ajustes.estilo')}</strong>
            <span class="t-etiqueta">{t('ajustes.estiloActual')}</span>
          </span>
          <span class="ajustes__pronto t-etiqueta">{t('ajustes.proximamente')}</span>
        </div>
      </section>

      <button type="button" class="tarjeta ajustes__perfil" onClick={() => ir({ pantalla: 'perfiles' })}>
        <Avatar nombre={perfil.nombre} color={perfil.color} tamano="chico" />
        <strong>{t('ajustes.cambiarPerfil')}</strong>
        <IconoAdelante />
      </button>

      <section class="tarjeta ajustes__seccion">
        <h2 class="ajustes__subtitulo">{t('ajustes.respaldo')}</h2>
        <p class="ajustes__ayuda t-etiqueta">{t('ajustes.respaldoAyuda')}</p>
        <div class="ajustes__botones">
          <Boton variante="secundario" onClick={guardarCopia}>
            {t('ajustes.guardarCopia')}
          </Boton>
          <Boton variante="secundario" onClick={() => selector.current?.click()}>
            {t('ajustes.recuperarCopia')}
          </Boton>
          <input ref={selector} type="file" accept={EXTENSION_RESPALDO} hidden onChange={elegirCopia} />
        </div>
        {aviso && (
          <p class={`ajustes__aviso ajustes__aviso--${aviso.tipo}`} role="status">
            {aviso.texto}
          </p>
        )}
      </section>

      {porRecuperar && (
        <div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
          <div class="dialogo__caja">
            <h2 id="dialogo-titulo" class="ajustes__subtitulo">
              {t('ajustes.confirmarTitulo')}
            </h2>
            <p>{t('ajustes.confirmarTexto', { nombres: unirNombres(porRecuperar.nombres) })}</p>
            <div class="ajustes__botones">
              <Boton variante="secundario" onClick={() => setPorRecuperar(null)}>
                {t('ajustes.cancelar')}
              </Boton>
              <Boton onClick={recuperar}>{t('ajustes.confirmar')}</Boton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
