// Sistema de diseño «Berea», estilo Vibrante, aprobado por la autora.
// Los valores de color, fuente, letra, espacio, radio, sombra, tamaño y animación son los
// del encargo de la Fase 4, sin cambios.

import type { Tema } from './tipos';

export const temaVibrante: Tema = {
  nombre: 'Vibrante',
  color: {
    bg: '#FFF8EE', surface: '#FFFFFF', surfaceSunk: '#F6EEDF',
    line: '#E9E1D3', lineStrong: '#8C86A3',
    ink: '#1F1B3D', inkMuted: '#5C5878', onColor: '#FFFFFF',
    primary: '#2B2575', onPrimary: '#FFFFFF', primaryPress: '#1D1856', primarySoft: '#E6E4F7',
    accent: '#2B2575', paper: '#FFFFFF', paperInk: '#1F1B3D',
    facil: '#0A7470', facilSoft: '#DDF3EF', facilInk: '#08544F',
    intermedia: '#1F5FD6', intermediaSoft: '#E1EAFD', intermediaInk: '#1747A6',
    avanzada: '#7A3FD1', avanzadaSoft: '#EEE6FB', avanzadaInk: '#5B2AA6',
    aplicacion: '#F08A24', onAplicacion: '#1F1B3D', aplicacionSoft: '#FDEBD7', aplicacionInk: '#8A4300',
    correcto: '#13803A', correctoSoft: '#DCF7E3', correctoInk: '#0E5A28',
    incorrecto: '#C8283F', incorrectoSoft: '#FDE3E6', incorrectoInk: '#9E1B30',
    tiempo: '#5E6782', tiempoSoft: '#ECEEF3', tiempoInk: '#3F475E',
    star: '#FFB81C', starEdge: '#B36A00', starEmpty: '#E3DACA',
  },
  fuente: "'Nunito', 'Segoe UI', system-ui, sans-serif", // pesos 500 700 800 900, licencia SIL OFL
  letra: {
    display: [44, 48, 900], titulo: [28, 34, 800], boton: [18, 22, 800], etiqueta: [14, 19, 700], // [tamaño px, alto de línea px, peso]
    normal:     { pregunta: [22, 29, 800], opcion: [18, 24, 700], texto: [17, 25, 500] },
    grande:     { pregunta: [25, 32, 800], opcion: [21, 27, 700], texto: [19, 28, 500] },
    muyGrande:  { pregunta: [28, 35, 800], opcion: [23, 29, 700], texto: [22, 31, 500] },
  },
  espacio: [4, 8, 12, 16, 24, 32, 48],
  radio: { sm: 10, md: 16, lg: 24, full: 999 },
  sombra: {
    tarjeta: '0 2px 0 #E9E1D3, 0 6px 16px rgba(31,27,61,0.06)',
    pop: '0 4px 0 #1D1856',
    popSuave: '0 4px 0 #D9CFBD',
  },
  tamano: { tocableMin: 56, reloj: 64, avatar: 56, paradaMapa: 72, contenidoMax: 560 },
  animacion: {
    lateEntrar: '1.6s ease-in-out infinite, escala 1 → 1.04',
    opcionTocada: '220ms, escala 0.96 → 1.02 → 1',
    relojUltimos5s: 'color incorrecto, late 0.9s, escala 1 → 1.08',
    cambioRonda: 'fondo al tinte de la nueva ronda en 400ms; pantalla 2.5s',
    confeti: '2.5s una vez, colores de ronda + star',
    estrellas: '250ms cada una, 120ms entre ellas, escala 0 → 1.2 → 1',
    insignia: 'brillo dorado 1.8s, dos veces',
    paradaDisponible: 'halo que pulsa 1.6s infinite',
  },
  movimiento: {
    late: '1.6s',
    opcionTocada: '220ms',
    relojLate: '0.9s',
    cambioRondaFondo: '400ms',
    pantallaRondaMs: 2500,
    confetiMs: 2500,
    estrella: '250ms',
    estrellaPausaMs: 120,
    insignia: '1.8s',
    parada: '1.6s',
  },
  avatar: {
    turquesa: { fondo: 'facil', texto: 'onColor' },
    azul: { fondo: 'intermedia', texto: 'onColor' },
    morado: { fondo: 'avanzada', texto: 'onColor' },
    naranja: { fondo: 'aplicacion', texto: 'onAplicacion' },
    rojo: { fondo: 'incorrecto', texto: 'onColor' },
    indigo: { fondo: 'primary', texto: 'onPrimary' },
  },
  reloj: 'circular',
};
