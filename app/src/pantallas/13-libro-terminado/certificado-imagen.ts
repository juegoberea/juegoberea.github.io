// Dibuja el certificado como imagen PNG (para «Guardar certificado»), con los colores y la
// letra del tema.

import type { Tema } from '../../temas/tipos';

export interface DatosCertificado {
  etiqueta: string;
  reconoce: string;
  nombre: string;
  porCompletar: string;
  libro: string;
  capituloPorCapitulo: string;
  puntos: string;
  dePuntos: string;
  estrellas: string;
  deEstrellas: string;
  fecha: string;
}

const ANCHO = 1600;
const ALTO = 1130;

// Mismos trazos que el componente Logo (viewBox 100 × 80).
const LOGO = [
  { d: 'M5 24 Q28 18 50 26 L50 77 Q28 69 5 74 Z', color: 'facil' },
  { d: 'M95 24 Q72 18 50 26 L50 77 Q72 69 95 74 Z', color: 'intermedia' },
  { d: 'M13 30 Q32 26 49 32 L49 69 Q32 63 13 66 Z', color: 'avanzada' },
  { d: 'M87 30 Q68 26 51 32 L51 69 Q68 63 87 66 Z', color: 'aplicacion' },
] as const;
const ESTRELLA = 'M50 1.5 L53.3 9.4 L61.8 10.1 L55.4 15.7 L57.3 24 L50 19.6 L42.7 24 L44.6 15.7 L38.2 10.1 L46.7 9.4 Z';

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function certificadoComoImagen(tema: Tema, d: DatosCertificado): Promise<Blob> {
  const c = tema.color;
  const familia = tema.fuente;
  try {
    await Promise.all([900, 800, 600].map((peso) => document.fonts.load(`${peso} 40px ${familia}`)));
  } catch {
    // Sin la letra cargada se usa la de respaldo.
  }

  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d')!;
  const fuente = (peso: number, tamano: number) => `${peso} ${tamano}px ${familia}`;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Tarjeta con borde dorado y su sombra inferior.
  rectRedondeado(ctx, 60, 80, ANCHO - 120, ALTO - 140, 48);
  ctx.fillStyle = c.starEdge;
  ctx.fill();
  rectRedondeado(ctx, 60, 60, ANCHO - 120, ALTO - 140, 48);
  ctx.fillStyle = c.star;
  ctx.fill();
  rectRedondeado(ctx, 74, 74, ANCHO - 148, ALTO - 168, 38);
  ctx.fillStyle = c.paper;
  ctx.fill();

  // Logo.
  ctx.save();
  ctx.translate(ANCHO / 2 - 70, 120);
  ctx.scale(1.4, 1.4);
  for (const parte of LOGO) {
    ctx.fillStyle = c[parte.color];
    ctx.fill(new Path2D(parte.d));
  }
  const estrella = new Path2D(ESTRELLA);
  ctx.fillStyle = c.star;
  ctx.fill(estrella);
  ctx.strokeStyle = c.starEdge;
  ctx.lineWidth = 1.6;
  ctx.stroke(estrella);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const centro = ANCHO / 2;

  ctx.fillStyle = c.starEdge;
  ctx.font = fuente(900, 40);
  ctx.letterSpacing = '8px';
  ctx.fillText(d.etiqueta.toUpperCase(), centro, 320);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = c.inkMuted;
  ctx.font = fuente(600, 40);
  ctx.fillText(d.reconoce, centro, 390);

  ctx.fillStyle = c.paperInk;
  ctx.font = fuente(900, 104);
  ctx.fillText(d.nombre, centro, 510, ANCHO - 240);

  // «por completar **Libro**,» con el libro en negrita.
  const antes = `${d.porCompletar} `;
  const despues = ',';
  ctx.font = fuente(600, 42);
  const anchoAntes = ctx.measureText(antes).width;
  const anchoDespues = ctx.measureText(despues).width;
  ctx.font = fuente(900, 42);
  const anchoLibro = ctx.measureText(d.libro).width;
  let x = centro - (anchoAntes + anchoLibro + anchoDespues) / 2;
  ctx.textAlign = 'left';
  ctx.font = fuente(600, 42);
  ctx.fillText(antes, x, 590);
  x += anchoAntes;
  ctx.font = fuente(900, 42);
  ctx.fillText(d.libro, x, 590);
  x += anchoLibro;
  ctx.font = fuente(600, 42);
  ctx.fillText(despues, x, 590);
  ctx.textAlign = 'center';
  ctx.fillText(d.capituloPorCapitulo, centro, 650);

  // Puntos y estrellas.
  ctx.fillStyle = c.paperInk;
  ctx.font = fuente(900, 80);
  ctx.fillText(d.puntos, centro - 230, 780);
  ctx.fillStyle = c.starEdge;
  ctx.fillText(`★ ${d.estrellas}`, centro + 230, 780);
  ctx.fillStyle = c.inkMuted;
  ctx.font = fuente(700, 34);
  ctx.fillText(d.dePuntos, centro - 230, 830);
  ctx.fillText(d.deEstrellas, centro + 230, 830);

  ctx.font = fuente(700, 36);
  ctx.fillText(d.fecha, centro, 925);

  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen'))), 'image/png'));
}
