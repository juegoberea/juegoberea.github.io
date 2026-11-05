// Panel de administración (solo la autora). Se publica junto al juego en dist/panel/.
//   npm run panel:dev     → http://127.0.0.1:5174
//   npm run build         → arma el juego y después el panel
// La dirección y la clave pública de Supabase vienen de panel/.env (no se sube al repositorio;
// en GitHub se configuran como variables del repositorio).

import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: 'panel',
  base: './',
  // La letra Nunito y los iconos son los mismos del juego.
  publicDir: '../app/public',
  plugins: [preact()],
  build: {
    outDir: '../dist/panel',
    emptyOutDir: true,
    rollupOptions: {
      // vista.html: la pantalla de pregunta del juego, dentro de un «celular» (P3).
      // codigo.html: el código de 6 números en el celular de la autora, sin instalar nada.
      input: { panel: 'panel/index.html', vista: 'panel/vista.html', codigo: 'panel/codigo.html' },
    },
    target: ['es2020', 'chrome90', 'edge90', 'safari14'],
    // El panel lo usa solo la autora en su PC: el lector de Excel y Supabase pesan, y está bien.
    chunkSizeWarningLimit: 1200,
  },
  server: { host: '127.0.0.1', port: 5174 },
});
