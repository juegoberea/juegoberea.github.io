# Berea

> Cada capítulo, un tesoro por descubrir.

Trivia sin internet para quienes leen la serie del Gran Conflicto de Elena G. de White. Después de leer cada capítulo, el jugador responde 20 preguntas; si aprueba, pasa al siguiente. Funciona en PC con Windows y en celulares, sin cuentas, sin servidor y sin enviar ningún dato fuera del aparato.

El nombre viene de Hechos 17:11: «Recibieron la palabra con toda solicitud, escudriñando cada día las Escrituras.»

## Carpetas

| Carpeta | Qué contiene |
|---|---|
| `app/` | El juego (aplicación web instalable). |
| `app/src/motor/` | Reglas del juego: intentos, reloj, corrección y puntos. |
| `app/src/contenido/` | Lectura y verificación del archivo de contenido. |
| `app/src/datos/` | Lo que se guarda en el aparato: perfiles, avance, diario, ajustes. |
| `app/src/componentes/` | Piezas visuales reutilizables (botones, reloj, estrellas…). |
| `app/src/temas/` | Colores, letras y tamaños de cada estilo (Vibrante; luego Solemne). |
| `app/src/textos/` | Todos los textos de la interfaz, por idioma. |
| `app/src/pantallas/` | Las 13 pantallas del juego. |
| `app/public/` | Letra Nunito e iconos de instalación (los sonidos y la música se generan en código). |
| `.github/workflows/` | Publicación automática en GitHub Pages. |
| `convertidor/` | Herramienta para convertir el Excel de preguntas en `contenido.bin`. |
| `contenido/excel/` | El banco de preguntas en Excel (lo edita la autora). |
| `contenido/publicado/` | El `contenido.bin` que usa el juego. |
| `docs/` | Especificaciones, guía de pantallas, diseños, plan y guías. |
| `pruebas/` | Pruebas automáticas. |

## Para programar

Requiere [Node.js](https://nodejs.org) (versión LTS).

```bash
npm install      # una sola vez
npm run dev      # abre el juego en http://localhost:5173
npm test         # ejecuta las pruebas
npm run build    # genera la versión para publicar en dist/

npm run contenido          # convierte contenido/excel/*.xlsx en contenido/publicado/contenido.bin
npm run convertidor:build  # genera la página del convertidor para la autora (convertidor/listo/)
npm run claves:crear       # crea las claves de firma y cifrado (UNA sola vez; ya están creadas)
```

Para actualizar las preguntas sin programar: [docs/como-actualizar-contenido.md](docs/como-actualizar-contenido.md). Para publicar una versión nueva: [docs/como-publicar.md](docs/como-publicar.md).

Las decisiones del proyecto y las dudas abiertas están en [docs/plan.md](docs/plan.md).
