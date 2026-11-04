// Mi diario completo: todas las reflexiones del libro, ordenadas por capítulo.

import { useApp } from '../../app/estado';
import { useProgreso } from '../../app/useProgreso';
import { Boton, BotonIcono, IconoAtras } from '../../componentes';
import { entradasDiario } from '../../datos/diario';
import { libroEnIdioma } from '../../motor/cargar-contenido';
import { t } from '../../textos';
import { DiarioImpreso, guardarDiario, imprimir } from './diario-acciones';
import './progreso.css';

export function Diario({ libroId }: { libroId: string }) {
  const { contenido, perfil, ir, volver } = useApp();
  const progreso = useProgreso(libroId);
  const libro = contenido ? libroEnIdioma(contenido, libroId) : undefined;
  if (!progreso || !perfil) return null;

  const entradas = entradasDiario(progreso, libro);
  const tituloLibro = libro?.titulo ?? t(`libros.${libroId}`);

  return (
    <>
      <main class="contenedor pantalla diario no-imprimir">
        <div class="progreso__cabecera">
          <BotonIcono etiqueta={t('componentes.atras')} onClick={() => volver({ pantalla: 'progreso', libro: libroId })}>
            <IconoAtras />
          </BotonIcono>
          <div>
            <h1 class="t-titulo progreso__titulo">{t('diario.titulo')}</h1>
            <p class="t-apagado diario__cantidad">
              {entradas.length === 1 ? t('diario.cantidad1') : t('diario.cantidad', { n: entradas.length })} · {tituloLibro}
            </p>
          </div>
        </div>

        {entradas.length === 0 && <p class="aviso-carga">{t('diario.vacio')}</p>}

        <ol class="diario__lista">
          {entradas.map((e) => (
            <li key={e.capitulo} class="diario__entrada">
              <div class="diario__entrada-cabecera t-etiqueta">
                <span>{e.titulo ? t('diario.capitulo', { n: e.capitulo, titulo: e.titulo }) : t('diario.capituloSinTitulo', { n: e.capitulo })}</span>
                <button type="button" class="diario__editar" onClick={() => ir({ pantalla: 'reflexion', libro: libroId, numero: e.capitulo })}>
                  {t('diario.editar')}
                </button>
              </div>
              {e.pregunta && <p class="diario__pregunta">{e.pregunta}</p>}
              <p class="diario__texto">{e.texto}</p>
            </li>
          ))}
        </ol>

        {entradas.length > 0 && (
          <>
            <div class="pantalla__relleno" />
            <div class="progreso__diario-botones">
              <Boton variante="secundario" onClick={() => guardarDiario(entradas, perfil.nombre, tituloLibro)}>
                {t('diario.guardarArchivo')}
              </Boton>
              <Boton variante="secundario" onClick={imprimir}>
                {t('diario.imprimir')}
              </Boton>
            </div>
          </>
        )}
      </main>
      <DiarioImpreso entradas={entradas} nombre={perfil.nombre} libro={tituloLibro} />
    </>
  );
}
