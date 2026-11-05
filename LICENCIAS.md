# Licencias de los recursos usados

Cada sonido, música, imagen, icono, fuente y biblioteca que use el juego o el convertidor debe aparecer aquí con su licencia. Solo se aceptan recursos de uso libre o con licencia comprada.

Revisado en la Fase 9 (2026-11-04): el juego no usa ningún archivo de sonido, música ni imagen de terceros. La única pieza externa que se ve o se oye es la fuente Nunito.

| Recurso | Tipo | Archivo | Autor | Licencia | Enlace |
|---|---|---|---|---|---|
| Nunito (variable, pesos 200–1000) | Fuente | `app/public/fuentes/nunito-latin-wght-normal.woff2`, `nunito-latin-ext-wght-normal.woff2` (licencia en `Nunito-OFL.txt`) | Vernon Adams, Jacques Le Bailly, Manvel Shmavonyan, Alexei Vanyashin | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nunito |
| Iconos de la interfaz (altavoz, candado, check, libro…) | Imagen (SVG en código) | `app/src/componentes/iconos.tsx` | Dibujados para Berea | Propios del proyecto | — |
| Logo provisional (libro abierto con estrella) | Imagen (SVG en código) | `app/src/componentes/Logo.tsx` | Dibujado para Berea a partir de los diseños aprobados | Propio del proyecto | — |
| Iconos de instalación (192, 512, maskable, Apple) | Imagen (PNG y SVG) | `app/public/iconos/` | Creados a partir del logo de Berea | Propios del proyecto | — |
| Ilustraciones del juego (insignias, mapa, certificado, confeti) | Imagen (SVG y canvas en código) | `app/src/componentes/`, `app/src/pantallas/` | Dibujadas para Berea | Propias del proyecto | — |
| Sonidos (toque, correcto, incorrecto, tiempo, tic, ronda, aprobado, casi) | Sonido (generado en código con Web Audio, sin archivos) | `app/src/sonido/efectos.ts` | Compuestos para Berea | Propios del proyecto | — |
| Música del menú | Música (generada en código con Web Audio, sin archivos) | `app/src/sonido/musica.ts` | Compuesta para Berea | Propia del proyecto | — |
| Preact | Biblioteca de código (juego y convertidor) | (dependencia) | Jason Miller y colaboradores | MIT | https://github.com/preactjs/preact |
| noble-ed25519 | Biblioteca de código: firma del contenido (juego y convertidor) | (dependencia) | Paul Miller | MIT | https://github.com/paulmillr/noble-ed25519 |
| fflate | Biblioteca de código: compresión del contenido (juego y convertidor) | (dependencia) | Arjun Barrett | MIT | https://github.com/101arrowz/fflate |
| Workbox | Biblioteca de código: funcionamiento sin internet (service worker del juego) | `dist/sw.js`, `dist/workbox-*.js` (generados) | Google y colaboradores | MIT | https://github.com/GoogleChrome/workbox |
| qrcode-generator | Biblioteca de código: cuadro para escanear al activar el código de 6 números (solo panel) | (dependencia) | Kazuhiko Arase | MIT | https://github.com/kazuhikoarase/qrcode-generator |
| Supabase JS | Biblioteca de código: conexión del panel con Supabase (solo panel) | (dependencia) | Supabase | MIT | https://github.com/supabase/supabase-js |
| SheetJS Community Edition | Biblioteca de código: lectura del Excel (solo convertidor) | (dependencia) | SheetJS LLC | Apache 2.0 | https://sheetjs.com |
