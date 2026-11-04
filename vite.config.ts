/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { temaVibrante } from './app/src/temas/vibrante';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));

/** Sirve contenido/publicado/contenido.bin como «contenido.bin» (en desarrollo y en la versión publicada). */
function contenidoPublicado(): Plugin {
  const ruta = resolve(raiz, 'contenido/publicado/contenido.bin');
  return {
    name: 'berea-contenido',
    configureServer(server) {
      server.middlewares.use('/contenido.bin', (_pedido, respuesta) => {
        respuesta.setHeader('Content-Type', 'application/octet-stream');
        respuesta.setHeader('Cache-Control', 'no-cache');
        respuesta.end(readFileSync(ruta));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'contenido.bin', source: readFileSync(ruta) });
    },
  };
}

/**
 * Instalable y sin internet: Workbox guarda en el aparato todo el juego (código, letra Nunito,
 * iconos y el contenido.bin incluido). Los sonidos y la música se generan en código: no hay archivos.
 * El contenido nuevo lo busca el propio juego (app/src/motor/actualizar-contenido.ts).
 */
function instalable() {
  return VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'script-defer',
    manifest: {
      name: 'Berea',
      short_name: 'Berea',
      description: 'Cada capítulo, un tesoro por descubrir.',
      lang: 'es',
      id: './',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      background_color: temaVibrante.color.bg,
      theme_color: temaVibrante.color.bg,
      icons: [
        { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{html,js,css,woff2,svg,png,bin}'],
      // Las direcciones con «?buscar=…» (contenido nuevo) siempre van a internet.
      ignoreURLParametersMatching: [/^utm_/],
      navigateFallback: 'index.html',
      // El panel de la autora vive en …/panel/ y no es parte del juego.
      navigateFallbackDenylist: [/\/panel(\/|$)/],
      cleanupOutdatedCaches: true,
    },
  });
}

export default defineConfig({
  root: 'app',
  // Rutas relativas: el juego funciona igual en GitHub Pages (subcarpeta) y en local.
  base: './',
  plugins: [preact(), contenidoPublicado(), instalable()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Celulares Android sencillos o antiguos: Chrome 80+ (2020). La firma del contenido
    // necesita BigInt, que llegó en 2018.
    target: ['es2020', 'chrome80', 'edge80', 'safari14'],
  },
  server: { port: 5173 },
  test: {
    root: raiz,
    include: ['pruebas/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
