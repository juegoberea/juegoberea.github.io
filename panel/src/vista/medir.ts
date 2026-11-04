// Mide un capítulo en un celular de 360 × 740 con los 3 tamaños de letra, usando la vista previa
// (los mismos componentes del juego) en un iframe escondido.

import type { FilaPregunta } from '../compartido/banco';
import type { Medicion } from '../revision';
import type { DesdeLaVista } from './mensajes';

let marco: Promise<HTMLIFrameElement> | null = null;
let siguienteId = 1;

function iframeEscondido(): Promise<HTMLIFrameElement> {
  marco ??= new Promise((listo) => {
    const iframe = document.createElement('iframe');
    iframe.src = 'vista.html';
    iframe.title = 'medidor';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    Object.assign(iframe.style, { position: 'fixed', left: '-10000px', top: '0', width: '360px', height: '740px', border: '0', visibility: 'hidden' });
    const alListo = (e: MessageEvent<DesdeLaVista>) => {
      if (e.source === iframe.contentWindow && e.data.tipo === 'lista') {
        window.removeEventListener('message', alListo);
        listo(iframe);
      }
    };
    window.addEventListener('message', alListo);
    document.body.appendChild(iframe);
  });
  return marco;
}

export async function medirCapitulo(preguntas: FilaPregunta[]): Promise<Medicion> {
  const iframe = await iframeEscondido();
  const id = siguienteId++;
  const resultados = await new Promise<Record<number, [number, number, number]>>((listo) => {
    const alMedir = (e: MessageEvent<DesdeLaVista>) => {
      if (e.source === iframe.contentWindow && e.data.tipo === 'medicion' && e.data.id === id) {
        window.removeEventListener('message', alMedir);
        listo(e.data.resultados);
      }
    };
    window.addEventListener('message', alMedir);
    iframe.contentWindow!.postMessage({ tipo: 'medir', id, preguntas }, location.origin);
  });
  const peor = (i: number) => Math.min(...Object.values(resultados).map((r) => r[i]));
  return { normal: peor(0), grande: peor(1), muyGrande: peor(2), preguntas: resultados };
}
