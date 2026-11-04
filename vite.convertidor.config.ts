// Compila el convertidor en UNA sola página HTML (convertidor/listo/Convertidor-Berea.html)
// que la autora abre con doble clic, sin instalar nada y sin internet.
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'convertidor',
  base: './',
  plugins: [preact(), viteSingleFile()],
  build: {
    outDir: 'listo',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: { input: 'convertidor/Convertidor-Berea.html' },
  },
});
