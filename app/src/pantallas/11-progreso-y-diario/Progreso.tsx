// Pantalla 11 · Mi progreso: capítulos, puntos y estrellas; álbum de insignias; registro
// de intentos y «Mi diario» (guardar como archivo e imprimir).

import { useApp } from '../../app/estado';
import { useProgreso } from '../../app/useProgreso';
import { Boton, BotonIcono, IconoAtras, Insignia } from '../../componentes';
import { libroDeLaSerie } from '../../contenido/libros';
import { entradasDiario } from '../../datos/diario';
import { capitulosAprobados, estaAprobado, totalEstrellas, totalPuntos } from '../../datos/progreso';
import { libroEnIdioma } from '../../motor/cargar-contenido';
import { numero as formatoNumero, ordinalIntento, t } from '../../textos';
import { DiarioImpreso, guardarDiario, imprimir } from './diario-acciones';
import './progreso.css';

export function Progreso({ libroId }: { libroId: string }) {
  const { contenido, perfil, ir, volver } = useApp();
  const progreso = useProgreso(libroId);
  const libro = contenido ? libroEnIdioma(contenido, libroId) : undefined;
  const serie = libroDeLaSerie(libroId);
  if (!progreso || !perfil) return null;

  const total = serie?.capitulos ?? libro?.capitulos.length ?? 0;
  const aprobados = capitulosAprobados(progreso);
  const puntos = totalPuntos(progreso);
  const estrellas = totalEstrellas(progreso);
  const entradas = entradasDiario(progreso, libro);
  const ultima = entradas.length ? entradas.reduce((a, b) => (b.fecha > a.fecha ? b : a)) : null;
  const tituloLibro = libro?.titulo ?? t(`libros.${libroId}`);
  const completo = total > 0 && aprobados.length >= total;
  // Álbum: los capítulos que trae el contenido (y los aprobados que ya no estuvieran).
  const album = [...new Set([...(libro?.capitulos.map((c) => c.numero) ?? []), ...aprobados.map((a) => a.capitulo)])].sort((a, b) => a - b);

  return (
    <>
      <main class="contenedor pantalla progreso no-imprimir">
        <div class="progreso__cabecera">
          <BotonIcono etiqueta={t('componentes.atras')} onClick={() => volver({ pantalla: 'capitulos', libro: libroId })}>
            <IconoAtras />
          </BotonIcono>
          <h1 class="t-titulo progreso__titulo">{t('progreso.titulo')}</h1>
        </div>

        <div class="progreso__datos" aria-label={t('progreso.resumenLector', { aprobados: aprobados.length, total, puntos: formatoNumero(puntos), estrellas })}>
          <div class="tarjeta progreso__dato" aria-hidden="true">
            <strong>
              {aprobados.length}
              <small>/{total}</small>
            </strong>
            <span>{t('progreso.capitulos')}</span>
          </div>
          <div class="tarjeta progreso__dato" aria-hidden="true">
            <strong>{formatoNumero(puntos)}</strong>
            <span>{t('progreso.puntos')}</span>
          </div>
          <div class="tarjeta progreso__dato" aria-hidden="true">
            <strong class="progreso__estrellas">★ {estrellas}</strong>
            <span>{t('progreso.estrellas')}</span>
          </div>
        </div>

        {completo && (
          <Boton ancho class="progreso__certificado" onClick={() => ir({ pantalla: 'terminado', libro: libroId })}>
            {t('progreso.verCertificado')}
          </Boton>
        )}

        <section class="tarjeta progreso__seccion">
          <h2 class="progreso__subtitulo">{t('progreso.insignias')}</h2>
          <div class="progreso__album">
            {album.map((n) => (
              <Insignia key={n} numero={n} tamano={48} ganada={estaAprobado(progreso, n)} />
            ))}
          </div>
        </section>

        <section class="tarjeta progreso__seccion">
          <h2 class="progreso__subtitulo">{t('progreso.registro')}</h2>
          {aprobados.length === 0 ? (
            <p class="t-apagado progreso__vacio">{t('progreso.registroVacio')}</p>
          ) : (
            <ul class="progreso__registro">
              {aprobados.map((a) => (
                <li key={a.capitulo}>
                  <span>{t('progreso.registroFila', { n: a.capitulo, intento: ordinalIntento(a.intento) })}</span>
                  <span class="progreso__registro-valor">
                    <span class="progreso__registro-estrellas" aria-label={t('componentes.estrellas', { n: a.estrellas, total: 3 })}>
                      {'★'.repeat(a.estrellas)}
                    </span>{' '}
                    {formatoNumero(a.puntos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="progreso__diario">
          <div class="progreso__diario-cabecera">
            <h2>{t('diario.titulo')}</h2>
            {entradas.length > 0 && <span class="t-etiqueta">{entradas.length === 1 ? t('diario.cantidad1') : t('diario.cantidad', { n: entradas.length })}</span>}
          </div>
          {ultima ? (
            <button type="button" class="progreso__diario-ultima" onClick={() => ir({ pantalla: 'diario', libro: libroId })}>
              <strong>{t('diario.ultima', { n: ultima.capitulo })}</strong> {ultima.texto}
            </button>
          ) : (
            <p class="progreso__diario-vacio">{t('diario.vacio')}</p>
          )}
          {entradas.length > 0 && (
            <div class="progreso__diario-botones">
              <Boton variante="blanco" class="boton--diario" onClick={() => guardarDiario(entradas, perfil.nombre, tituloLibro)}>
                {t('diario.guardarArchivo')}
              </Boton>
              <Boton variante="blanco" class="boton--diario" onClick={imprimir}>
                {t('diario.imprimir')}
              </Boton>
            </div>
          )}
        </section>
      </main>
      <DiarioImpreso entradas={entradas} nombre={perfil.nombre} libro={tituloLibro} />
    </>
  );
}
