// Pantalla 6 · Pregunta (con sus estados: esperando, correcto, incorrecto y se acabó el
// tiempo) y, entre rondas, la pantalla 7 · Cambio de ronda.
//
// La partida (motor) no mira el reloj: esta pantalla le pasa la hora. El reloj de cada
// pregunta arranca recién cuando la pregunta aparece, y no corre en el cambio de ronda.

import { useCallback, useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Boton, BotonSilencio, ChipRonda, IconoCronometro, Opcion, Reloj, type EstadoOpcion } from '../../componentes';
import { terminarCapitulo } from '../../motor/capitulo';
import type { Partida, Resultado } from '../../motor/partida';
import { sonar } from '../../sonido/efectos';
import { numero as formatoNumero, t } from '../../textos';
import { CambioDeRonda } from '../07-cambio-de-ronda/CambioDeRonda';
import './pregunta.css';

const LETRAS = ['A', 'B', 'C'];
const SEGUNDOS_TIC = 5;

function estadoOpcion(i: number, resultado: Resultado | null): EstadoOpcion {
  if (!resultado) return 'esperando';
  if (resultado.tipo === 'tiempo') return 'atenuada';
  if (resultado.opcion === i) return resultado.tipo;
  return 'atenuada';
}

function Segmentos({ partida }: { partida: Partida }) {
  return (
    <ol class="segmentos" aria-hidden="true">
      {partida.preguntas.map((p, i) => (
        <li key={p.numero} class={`segmento ronda-${p.ronda}${i < partida.indice ? ' segmento--hecho' : i === partida.indice ? ' segmento--actual' : ''}`} />
      ))}
    </ol>
  );
}

function Retroalimentacion({ resultado, indice }: { resultado: Resultado; indice: number }) {
  if (resultado.tipo === 'correcta') {
    return (
      <div class="retro retro--correcto">
        <p class="retro__titulo">{t('pregunta.correcto')}</p>
        {resultado.explicacion && <p class="retro__texto">{resultado.explicacion}</p>}
        {resultado.cita && <p class="retro__cita">{resultado.cita}</p>}
      </div>
    );
  }
  if (resultado.tipo === 'incorrecta') {
    // Nunca se dice cuál era la correcta: solo un mensaje de ánimo.
    return (
      <div class="retro retro--incorrecto">
        <p class="retro__titulo">{t('pregunta.incorrecto')}</p>
        <p class="retro__texto">{t(`pregunta.animo${(indice % 3) + 1}`)}</p>
      </div>
    );
  }
  return (
    <div class="retro retro--tiempo">
      <span class="retro__icono" aria-hidden="true">
        <IconoCronometro tamano={24} />
      </span>
      <div>
        <p class="retro__titulo">{t('pregunta.tiempo')}</p>
        <p class="retro__texto">{t('pregunta.tiempoDetalle')}</p>
      </div>
    </div>
  );
}

export function Jugar({ libroId, numero }: { libroId: string; numero: number }) {
  const { juego, setJuego, setResultado, datos, perfil, sonidos, silenciado, cambiarSilencio, ir } = useApp();
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  const [ahora, setAhora] = useState(() => performance.now());
  const [terminando, setTerminando] = useState(false);
  const ultimoSegundo = useRef(-1);
  const pregunta = useRef<HTMLHeadingElement>(null);

  const partida = juego && juego.libro === libroId && juego.partida.capitulo.numero === numero ? juego.partida : null;

  // Sin partida (por ejemplo, al recargar la página a mitad): el intento ya contó y se perdió.
  useEffect(() => {
    if (!partida) ir({ pantalla: 'capitulos', libro: libroId }, { reemplazar: true });
  }, [partida]);

  const mostrar = useCallback(() => {
    if (!partida || partida.estado !== 'antes-de-pregunta') return;
    const momento = performance.now();
    partida.mostrarPregunta(momento);
    ultimoSegundo.current = -1;
    setAhora(momento);
    refrescar(0);
    window.scrollTo(0, 0);
    pregunta.current?.focus({ preventScroll: true });
  }, [partida]);

  const enCambioDeRonda = partida?.estado === 'antes-de-pregunta' && partida.empiezaRonda;

  useEffect(() => {
    if (enCambioDeRonda) sonar('ronda', sonidos);
  }, [enCambioDeRonda, partida?.indice]);

  // Reloj: mientras la pregunta está a la vista se revisa varias veces por segundo.
  useEffect(() => {
    if (partida?.estado !== 'pregunta') return;
    const id = setInterval(() => {
      const momento = performance.now();
      const vencida = partida.actualizar(momento);
      if (vencida) {
        sonar('tiempo', sonidos);
        refrescar(0);
        return;
      }
      const segundos = partida.segundosRestantes(momento);
      if (segundos !== ultimoSegundo.current) {
        if (segundos <= SEGUNDOS_TIC && segundos > 0) sonar('tic', sonidos);
        ultimoSegundo.current = segundos;
      }
      setAhora(momento);
    }, 200);
    return () => clearInterval(id);
  }, [partida, partida?.estado, partida?.indice, sonidos]);

  const responder = useCallback(
    (opcion: number) => {
      if (!partida || partida.estado !== 'pregunta') return;
      const resultado = partida.responder(opcion, performance.now());
      sonar(resultado.tipo === 'correcta' ? 'correcto' : resultado.tipo === 'incorrecta' ? 'incorrecto' : 'tiempo', sonidos);
      refrescar(0);
    },
    [partida, sonidos],
  );

  const siguiente = useCallback(async () => {
    if (!partida || partida.estado !== 'respondida' || terminando) return;
    sonar('toque', sonidos);
    if (partida.siguiente() !== 'terminada') {
      // Si la siguiente no abre ronda, aparece ya y su reloj arranca en este mismo momento
      // (así nunca hay una pregunta a la vista que todavía no se pueda responder).
      if (partida.empiezaRonda) refrescar(0);
      else mostrar();
      return;
    }
    if (!datos || !perfil) return;
    setTerminando(true);
    const resultado = await terminarCapitulo(datos, perfil.id, libroId, partida);
    setResultado({ libro: libroId, numero, datos: resultado });
    ir({ pantalla: 'resultado', libro: libroId, numero }, { reemplazar: true });
    setJuego(null);
  }, [partida, terminando, datos, perfil, libroId, numero, sonidos, mostrar]);

  // En PC: A, B, C (o 1, 2, 3) para responder y Enter para seguir.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const opcion = 'abc'.indexOf(e.key.toLowerCase()) >= 0 ? 'abc'.indexOf(e.key.toLowerCase()) : '123'.indexOf(e.key);
      if (opcion >= 0 && partida?.estado === 'pregunta') {
        e.preventDefault();
        responder(opcion);
      } else if (e.key === 'Enter' && partida?.estado === 'respondida' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        void siguiente();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [partida, responder, siguiente]);

  if (!partida) return null;

  const actual = partida.preguntaActual;
  const respondida = partida.estado === 'respondida';
  const resultado = respondida ? partida.ultimoResultado : null;
  const segundos = partida.segundosRestantes(ahora);
  const ultima = partida.indice === partida.total - 1;

  return (
    <div class={`jugar ronda-${actual.ronda} fondo-ronda`}>
      {enCambioDeRonda && <CambioDeRonda ronda={actual.ronda} puntos={partida.puntos} alTerminar={mostrar} />}

      <main class="contenedor pantalla jugar__pantalla" aria-hidden={enCambioDeRonda ? 'true' : undefined}>
        <div class="pantalla__barra">
          <ChipRonda ronda={actual.ronda} />
          <div class="pantalla__barra-grupo">
            <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
            <Reloj segundos={segundos} detenido={respondida} />
          </div>
        </div>

        <div class="jugar__estado t-etiqueta">
          <span>{t('pregunta.numero', { n: actual.numero, total: partida.total })}</span>
          <span>{t('pregunta.puntos', { n: formatoNumero(partida.puntos) })}</span>
        </div>
        <Segmentos partida={partida} />

        <h1 class="t-pregunta jugar__pregunta" ref={pregunta} tabIndex={-1}>
          {actual.texto}
        </h1>

        <div class="jugar__opciones" role="group" aria-label={actual.texto}>
          {actual.opciones.map((texto, i) => (
            <Opcion
              key={`${actual.numero}-${i}`}
              letra={LETRAS[i]}
              texto={texto}
              estado={estadoOpcion(i, resultado)}
              puntos={resultado?.tipo === 'correcta' ? resultado.puntos : undefined}
              onElegir={() => responder(i)}
            />
          ))}
        </div>

        <div aria-live="polite">{resultado && <Retroalimentacion resultado={resultado} indice={partida.indice} />}</div>

        {respondida && (
          <div class="jugar__pie">
            <Boton ancho onClick={siguiente} disabled={terminando}>
              {ultima ? t('pregunta.verResultado') : t('pregunta.siguiente')}
            </Boton>
          </div>
        )}
      </main>
    </div>
  );
}
