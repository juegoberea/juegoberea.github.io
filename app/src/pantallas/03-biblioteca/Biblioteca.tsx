// Pantalla 3 · Tu biblioteca: los 5 libros de la serie como islas unidas por un camino.

import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Avatar, BotonIcono, BotonSilencio, IconoAjustes } from '../../componentes';
import { SERIE } from '../../contenido/libros';
import { capitulosAprobados } from '../../datos/progreso';
import { t } from '../../textos';
import './biblioteca.css';

/** Centro de cada isla: x en % del ancho, y en px. La primera es la grande. */
const ISLAS = [
  { x: 30, y: 105, grande: true },
  { x: 74, y: 300 },
  { x: 25, y: 420 },
  { x: 74, y: 550 },
  { x: 31, y: 655 },
];
const ALTO = 720;
/** Camino punteado que pasa por las islas (mismas coordenadas). */
const CAMINO = 'M30 105 C 62 120, 74 190, 74 300 C 74 340, 40 360, 25 420 C 22 470, 60 500, 74 550 C 80 590, 45 610, 31 655';

export function Biblioteca() {
  const { datos, contenido, errorContenido, perfil, silenciado, cambiarSilencio, ir } = useApp();
  const [aprobados, setAprobados] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    Promise.all(SERIE.map(async (l) => [l.id, capitulosAprobados(await datos.obtenerProgreso(perfil.id, l.id)).length] as const)).then(
      (pares) => vigente && setAprobados(Object.fromEntries(pares)),
    );
    return () => {
      vigente = false;
    };
  }, [datos, perfil]);

  if (!perfil) return null;

  return (
    <main class="contenedor pantalla">
      <div class="pantalla__barra">
        <button type="button" class="biblioteca__perfil" onClick={() => ir({ pantalla: 'perfiles' })}>
          <Avatar nombre={perfil.nombre} color={perfil.color} />
          <span class="biblioteca__perfil-texto">
            <span class="biblioteca__perfil-nombre">{perfil.nombre}</span>
            <span class="t-etiqueta t-apagado">{t('biblioteca.cambiarPerfil')}</span>
          </span>
        </button>
        <div class="pantalla__barra-grupo">
          <BotonIcono etiqueta={t('componentes.ajustes')} onClick={() => ir({ pantalla: 'ajustes' })}>
            <IconoAjustes />
          </BotonIcono>
          <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
        </div>
      </div>

      <h1 class="t-titulo pantalla__titulo">{t('biblioteca.titulo')}</h1>
      <p class="pantalla__subtitulo">{t('biblioteca.subtitulo')}</p>

      <div class="islas" style={{ height: `${ALTO}px` }}>
        <svg class="islas__camino" viewBox={`0 0 100 ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={CAMINO} vector-effect="non-scaling-stroke" />
        </svg>

        <ol class="islas__lista">
          {SERIE.map((libro, i) => {
            const isla = ISLAS[i];
            const disponible = Boolean(contenido?.libros[libro.id]);
            const titulo = t(`libros.${libro.id}`);
            const posicion = { left: `${isla.x}%`, top: `${isla.y}px` };

            if (!disponible) {
              const cargando = i === 0 && !contenido && !errorContenido;
              return (
                <li key={libro.id} class="isla isla--pronto" style={posicion}>
                  <span class="isla__titulo">{titulo}</span>
                  <span class="isla__estado t-etiqueta">{cargando ? t('biblioteca.cargando') : t('biblioteca.proximamente')}</span>
                </li>
              );
            }
            return (
              <li key={libro.id} class={`isla${isla.grande ? ' isla--grande' : ''}`} style={posicion}>
                <button type="button" class="isla__boton" onClick={() => ir({ pantalla: 'capitulos', libro: libro.id })}>
                  <span class="isla__numero t-etiqueta">{t('biblioteca.libro', { n: i + 1 })}</span>
                  <span class="isla__titulo">{titulo}</span>
                  <span class="isla__avance t-etiqueta">{t('biblioteca.avance', { n: aprobados[libro.id] ?? 0, total: libro.capitulos })}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {errorContenido && (
        <p class="aviso-carga" role="alert">
          {t(errorContenido === 'alterado' ? 'errores.contenidoAlterado' : 'errores.contenidoRed')}
        </p>
      )}
    </main>
  );
}
