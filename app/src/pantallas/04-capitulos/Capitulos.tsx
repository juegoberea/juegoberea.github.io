// Pantalla 4 · Capítulos de un libro: puntaje del libro y camino en zigzag de paradas.

import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Boton, BotonIcono, BotonSilencio, Estrellas, IconoAtras, ParadaMapa, type EstadoParada } from '../../componentes';
import { libroDeLaSerie } from '../../contenido/libros';
import type { Capitulo } from '../../contenido/tipos';
import { capituloDisponible, totalEstrellas, totalPuntos } from '../../datos/progreso';
import type { ProgresoLibro } from '../../datos/tipos';
import { libroEnIdioma } from '../../motor/cargar-contenido';
import { estrellasMaximasLibro, puntosMaximosLibro } from '../../motor/reglas';
import { numero, ordinalIntento, t } from '../../textos';
import './capitulos.css';

/** Alto de cada parada del camino, en px; el dibujo del camino usa la misma medida. */
const ALTO_FILA = 124;
/** Posición horizontal de las paradas (en % del ancho), alternando izquierda y derecha. */
const X_IZQ = 28;
const X_DER = 72;

const xDe = (i: number) => (i % 2 === 0 ? X_IZQ : X_DER);

function estadoDe(progreso: ProgresoLibro, numeroCapitulo: number): EstadoParada {
  if (progreso.capitulos[numeroCapitulo]?.aprobado) return 'aprobada';
  return capituloDisponible(progreso, numeroCapitulo) ? 'disponible' : 'bloqueada';
}

function Camino({ estados }: { estados: EstadoParada[] }) {
  const alto = estados.length * ALTO_FILA;
  return (
    <svg class="camino" viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
      {estados.slice(1).map((estado, i) => {
        const y1 = i * ALTO_FILA + ALTO_FILA / 2;
        const y2 = y1 + ALTO_FILA;
        const d = `M${xDe(i)} ${y1} C ${xDe(i)} ${y1 + ALTO_FILA * 0.55}, ${xDe(i + 1)} ${y2 - ALTO_FILA * 0.55}, ${xDe(i + 1)} ${y2}`;
        // El tramo que lleva a un capítulo abierto se pinta como recorrido.
        return <path key={i} class={`camino__tramo${estado === 'bloqueada' ? '' : ' camino__tramo--hecho'}`} d={d} vector-effect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

function Parada({ capitulo, indice, estado, progreso, alTocar }: { capitulo: Capitulo; indice: number; estado: EstadoParada; progreso: ProgresoLibro; alTocar: () => void }) {
  const lado = indice % 2 === 0 ? 'izq' : 'der';
  const aprobado = progreso.capitulos[capitulo.numero]?.aprobado;
  return (
    <li class={`parada-fila parada-fila--${lado}`} style={{ height: `${ALTO_FILA}px` }} data-estado={estado}>
      <span class="parada-fila__circulo" style={{ left: `${xDe(indice)}%` }}>
        <ParadaMapa numero={capitulo.numero} estado={estado} onClick={alTocar} />
      </span>
      <span class="parada-fila__info">
        {estado === 'bloqueada' ? (
          <>
            <span class="parada-fila__titulo parada-fila__titulo--bloqueado">{t('capitulos.bloqueado', { n: capitulo.numero, titulo: capitulo.titulo })}</span>
            <span class="t-etiqueta t-apagado">{t('capitulos.bloqueadoAyuda', { n: capitulo.numero - 1 })}</span>
          </>
        ) : (
          <>
            <span class="parada-fila__titulo">{capitulo.titulo}</span>
            {aprobado ? (
              <>
                <Estrellas ganadas={aprobado.estrellas} />
                <span class="t-etiqueta t-apagado">
                  {t('capitulos.aprobadoDetalle', { puntos: numero(aprobado.puntos), intento: ordinalIntento(aprobado.intento) })}
                </span>
              </>
            ) : (
              <span class="parada-fila__te-toca t-etiqueta">{t('capitulos.teToca')}</span>
            )}
          </>
        )}
      </span>
    </li>
  );
}

export function Capitulos({ libroId }: { libroId: string }) {
  const { datos, contenido, perfil, silenciado, cambiarSilencio, ir, volver } = useApp();
  const [progreso, setProgreso] = useState<ProgresoLibro | null>(null);
  const lista = useRef<HTMLOListElement>(null);

  const libro = contenido ? libroEnIdioma(contenido, libroId) : undefined;
  const serie = libroDeLaSerie(libroId);
  const totalCapitulos = serie?.capitulos ?? libro?.capitulos.length ?? 0;

  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    datos.obtenerProgreso(perfil.id, libroId).then((p) => vigente && setProgreso(p));
    return () => {
      vigente = false;
    };
  }, [datos, perfil, libroId]);

  // Lleva la vista hasta el capítulo que toca.
  useEffect(() => {
    lista.current?.querySelector('[data-estado="disponible"]')?.scrollIntoView({ block: 'center' });
  }, [progreso, libro]);

  const atras = () => volver({ pantalla: 'biblioteca' });

  if (!libro || !progreso) {
    return (
      <main class="contenedor pantalla">
        <div class="pantalla__barra">
          <BotonIcono etiqueta={t('componentes.atras')} onClick={atras}>
            <IconoAtras />
          </BotonIcono>
        </div>
        {contenido && !libro && <p class="aviso-carga">{t('capitulos.noDisponible')}</p>}
      </main>
    );
  }

  const puntos = totalPuntos(progreso);
  const estrellas = totalEstrellas(progreso);
  const maximo = puntosMaximosLibro(totalCapitulos);
  const estados = libro.capitulos.map((c) => estadoDe(progreso, c.numero));

  return (
    <div class="capitulos">
      <header class="capitulos__cabecera">
        <div class="contenedor">
          <div class="pantalla__barra">
            <BotonIcono etiqueta={t('componentes.atras')} onClick={atras}>
              <IconoAtras />
            </BotonIcono>
            <div class="capitulos__titulo">
              <span class="capitulos__marca t-etiqueta">{t('capitulos.marca')}</span>
              <h1 class="capitulos__libro">{libro.titulo}</h1>
            </div>
            <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
          </div>

          <div class="capitulos__puntaje">
            <p class="capitulos__puntos">
              <strong>{numero(puntos)}</strong> <span>{t('capitulos.puntos', { total: numero(maximo) })}</span>
            </p>
            <p class="capitulos__estrellas" aria-label={t('capitulos.estrellasLector', { n: estrellas, total: estrellasMaximasLibro(totalCapitulos) })}>
              <span aria-hidden="true">★ {t('capitulos.estrellas', { n: estrellas, total: estrellasMaximasLibro(totalCapitulos) })}</span>
            </p>
          </div>
          <div class="barra-avance" role="progressbar" aria-valuemin={0} aria-valuemax={maximo} aria-valuenow={puntos}>
            <span class="barra-avance__relleno" style={{ width: `${(puntos / maximo) * 100}%` }} />
          </div>
        </div>
      </header>

      <main class="contenedor capitulos__mapa">
        <div class="capitulos__camino">
          <Camino estados={estados} />
          <ol class="capitulos__lista" ref={lista}>
            {libro.capitulos.map((capitulo, i) => (
              <Parada
                key={capitulo.numero}
                capitulo={capitulo}
                indice={i}
                estado={estados[i]}
                progreso={progreso}
                alTocar={() => ir({ pantalla: 'capitulo', libro: libroId, numero: capitulo.numero })}
              />
            ))}
          </ol>
        </div>
        {libro.capitulos.length < totalCapitulos && <p class="aviso-carga">{t('capitulos.masCapitulos')}</p>}
      </main>

      <div class="capitulos__flotante">
        <Boton variante="blanco" icono={<span class="capitulos__icono-estrella" aria-hidden="true">★</span>} onClick={() => ir({ pantalla: 'progreso', libro: libroId })}>
          {t('capitulos.miProgreso')}
        </Boton>
      </div>
    </div>
  );
}
