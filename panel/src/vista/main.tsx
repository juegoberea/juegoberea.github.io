// Vista previa: la pantalla de pregunta del juego (06), armada con sus MISMOS componentes y estilos.
// Las opciones van en el orden del Excel, sin mezclar, y la correcta en verde con «CORRECTA».
// También mide si la pregunta y las 3 opciones entran sin desplazar (la ventana mide 360 × 740).

import { render } from 'preact';
import { BotonSilencio, ChipRonda, Opcion, Reloj } from '../../../app/src/componentes';
import type { NumeroRonda } from '../../../app/src/contenido/tipos';
import type { TamanoLetra } from '../../../app/src/datos/tipos';
import '../../../app/src/pantallas/comun.css';
import '../../../app/src/pantallas/06-pregunta/pregunta.css';
import { aplicarTema } from '../../../app/src/temas/aplicar';
import '../../../app/src/temas/base.css';
import { temaVibrante } from '../../../app/src/temas/vibrante';
import { numero as formatoNumero, t as tJuego } from '../../../app/src/textos';
import type { FilaPregunta } from '../compartido/banco';
import { t } from '../textos';
import { TAMANOS, type AlaVista, type DesdeLaVista } from './mensajes';
import './vista.css';

const LETRAS = ['A', 'B', 'C'];
const raiz = document.getElementById('vista')!;
const avisar = (m: DesdeLaVista) => parent.postMessage(m, location.origin);

function Pregunta({ pregunta, posicion, rondas, marcar }: { pregunta: FilaPregunta; posicion: number; rondas: number[]; marcar: boolean }) {
  const ronda = (pregunta.ronda ?? 1) as NumeroRonda;
  const opciones = [pregunta.opcion_a, pregunta.opcion_b, pregunta.opcion_c];
  return (
    <div class={`jugar ronda-${ronda} fondo-ronda`}>
      <main class="contenedor pantalla jugar__pantalla">
        <div class="pantalla__barra">
          <ChipRonda ronda={ronda} />
          <div class="pantalla__barra-grupo">
            <BotonSilencio silenciado={false} onCambiar={() => undefined} />
            <Reloj segundos={30} detenido />
          </div>
        </div>
        <div class="jugar__estado t-etiqueta">
          <span>{tJuego('pregunta.numero', { n: posicion + 1, total: rondas.length })}</span>
          <span>{tJuego('pregunta.puntos', { n: formatoNumero(0) })}</span>
        </div>
        <ol class="segmentos" aria-hidden="true">
          {rondas.map((r, i) => <li key={i} class={`segmento ronda-${r}${i < posicion ? ' segmento--hecho' : i === posicion ? ' segmento--actual' : ''}`} />)}
        </ol>
        <h1 class="t-pregunta jugar__pregunta">{pregunta.texto}</h1>
        <div class="jugar__opciones">
          {opciones.map((texto, i) => {
            const correcta = marcar && pregunta.correcta === i;
            // La correcta se ve como en el juego al acertar; donde el juego pone «+100», aquí dice «CORRECTA».
            return (
              <div key={i} class={`vista__opcion${correcta ? ' vista__opcion--correcta' : ''}`} style={correcta ? { '--etiqueta': JSON.stringify(t('vista.correcta')) } : undefined}>
                <Opcion letra={LETRAS[i]} texto={texto} estado={correcta ? 'correcta' : 'esperando'} puntos={correcta ? 100 : undefined} />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/** px que sobran debajo de la última opción (negativo = faltan). */
function sobra(): number {
  const fondo = Math.max(0, ...[...document.querySelectorAll('.opcion')].map((o) => o.getBoundingClientRect().bottom));
  return Math.round(window.innerHeight - fondo);
}

/**
 * Mide como la ve el jugador antes de responder (sin marcar la correcta) y, si se pide, después
 * deja a la vista la versión con la correcta marcada.
 */
function mostrar(pregunta: FilaPregunta, posicion: number, rondas: number[], letra: TamanoLetra, marcar = false): number {
  aplicarTema(temaVibrante, letra);
  render(<Pregunta pregunta={pregunta} posicion={posicion} rondas={rondas} marcar={false} />, raiz);
  const medida = sobra();
  if (marcar) render(<Pregunta pregunta={pregunta} posicion={posicion} rondas={rondas} marcar />, raiz);
  return medida;
}

window.addEventListener('message', async (e: MessageEvent<AlaVista>) => {
  if (e.origin !== location.origin) return;
  const m = e.data;
  await document.fonts.ready;
  if (m.tipo === 'mostrar') {
    avisar({ tipo: 'medida', sobra: mostrar(m.pregunta, m.posicion, m.rondas, m.letra, true) });
  } else if (m.tipo === 'medir') {
    const rondas = m.preguntas.map((p) => p.ronda ?? 1);
    const resultados: Record<number, [number, number, number]> = {};
    m.preguntas.forEach((p, i) => {
      resultados[p.orden] = TAMANOS.map((letra) => mostrar(p, i, rondas, letra)) as [number, number, number];
    });
    avisar({ tipo: 'medicion', id: m.id, resultados });
  }
});

aplicarTema(temaVibrante, 'normal');
avisar({ tipo: 'lista' });
