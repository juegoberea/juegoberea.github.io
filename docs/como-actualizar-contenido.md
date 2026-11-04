# Cómo actualizar el contenido de Berea

Esta guía es para agregar capítulos o corregir preguntas **sin programar**. Solo necesitas el Excel, tu PC con Windows y el navegador Chrome o Edge. No hace falta internet para convertir.

## Lo que necesitas

| Qué | Dónde está |
|---|---|
| El Excel del banco de preguntas | `contenido/excel/Banco_Preguntas_Patriarcas_y_Profetas.xlsx` |
| El convertidor | `convertidor/listo/Convertidor-Berea.html` |
| Tu clave de firma | `claves/berea-clave-de-firma.json` (solo en tu PC) |

> **Cuida tu clave de firma.** Es lo que demuestra que el contenido es tuyo: el juego rechaza cualquier archivo que no esté firmado con ella. Guarda una copia en un pendrive o en un lugar seguro. **No la envíes por correo ni la subas a internet.** Si se pierde, el programador tendrá que crear otra y publicar una versión nueva del juego.

## Paso 1 · Edita el Excel

Abre el Excel y trabaja como siempre.

**Hoja «Banco»** (una fila por pregunta):
- **Libro:** igual en todas las filas del libro, por ejemplo «Patriarcas y Profetas».
- **Capítulo:** el número (1, 2, 3…).
- **Título del capítulo:** igual en las 20 filas del capítulo.
- **N.º:** del 1 al 20 dentro del capítulo, sin repetir.
- **Ronda:** «1 Fácil», «2 Intermedia», «3 Avanzada» o «4 Aplicación».
- **Pregunta, Opción A, Opción B, Opción C:** las tres opciones deben ser distintas.
- **Correcta:** solo la letra A, B o C.
- **Explicación:** se muestra cuando el jugador acierta.
- **Cita:** la cita bíblica.
- Las columnas **Revisado por**, **Fecha de revisión** y **Observaciones** son para ti; el juego no las usa.

**Hoja «Reflexiones»** (una fila por capítulo): Libro, Capítulo, Título del capítulo y la Pregunta de reflexión.

La hoja **«Control»** es solo para ti; el convertidor no la lee.

Cada capítulo debe tener **exactamente 20 preguntas**: 6 fáciles, 6 intermedias, 6 avanzadas y 2 de aplicación. Los capítulos van seguidos desde el 1, sin saltos.

Guarda el Excel (Ctrl + G) antes de seguir.

## Paso 2 · Abre el convertidor

En la carpeta `convertidor/listo/`, haz **doble clic** en `Convertidor-Berea.html`. Se abre en tu navegador.

## Paso 3 · Carga tu clave (solo la primera vez)

Arrastra el archivo `berea-clave-de-firma.json` (carpeta `claves`) al recuadro del **paso 1**. Verás «Clave cargada» en verde.

Si dejas marcada la casilla «Recordar la clave en esta PC», las próximas veces aparecerá cargada sola. Si alguna vez usas una PC que no es tuya, desmárcala o pulsa «Olvidar la clave en esta PC» al terminar.

## Paso 4 · Arrastra el Excel

Arrastra el Excel al recuadro del **paso 2**. El convertidor lo revisa al instante y muestra:

- Una tabla con cada capítulo: cuántas preguntas tiene, si tiene reflexión y su estado.
- Una lista de avisos, si hay algo que corregir:
  - **Error** (en rojo): impide generar el archivo. Por ejemplo: una pregunta sin respuesta correcta, una letra que no es A, B o C, un capítulo que no tiene 20 preguntas, rondas que no son 6/6/6/2, o una opción vacía o repetida.
  - **Revisar** (en naranja): no impide generar el archivo, pero conviene corregirlo. Por ejemplo: un capítulo sin reflexión o una pregunta sin cita.

Cada aviso dice el **capítulo** y la **fila del Excel** donde está el problema. Corrígelo en el Excel, **guárdalo** y vuelve a arrastrarlo. Repite hasta que diga «Todo en orden».

> ¿Tienes un capítulo a medio escribir? El convertidor no genera el archivo mientras un capítulo esté incompleto. Termínalo, o pásalo a otra hoja del Excel (por ejemplo «Borradores») hasta que esté listo: el convertidor solo lee las hojas «Banco» y «Reflexiones».

## Paso 5 · Descarga el archivo

Pulsa **«Descargar contenido.bin»**. El archivo queda en tu carpeta de **Descargas**.

## Paso 6 · Publica el archivo

Sube el `contenido.bin` descargado a la carpeta `contenido/publicado/` del proyecto en GitHub, reemplazando el anterior. La guía [como-publicar.md](como-publicar.md) lo explica paso a paso y en unos 2 minutos queda publicado.

Los jugadores reciben el contenido nuevo la próxima vez que abran el juego con internet; si están sin internet, siguen con el que tenían. **No pierden su avance:** conservan sus capítulos aprobados, sus puntos, sus estrellas y su diario, aunque hayas corregido preguntas de capítulos que ya aprobaron.

## Si algo sale mal

| Mensaje | Qué hacer |
|---|---|
| «Ese archivo no es una clave de firma de Berea» | Arrastraste otro archivo. Busca `berea-clave-de-firma.json` en la carpeta `claves`. |
| «Esta clave de firma no corresponde a esta versión del juego» | Es una clave antigua o de otra copia del proyecto. Usa la de la carpeta `claves` del proyecto actual. |
| «A la hoja Banco le faltan estas columnas…» | Se cambió o borró un encabezado de la fila 1. Revisa que los nombres de las columnas sigan ahí. |
| «El Excel no tiene la hoja Banco» | Se cambió el nombre de la hoja. Debe llamarse «Banco». |
| El botón de descargar está gris | Falta la clave (paso 1) o el Excel todavía tiene errores en rojo. |

## Sobre la protección del contenido

El archivo `contenido.bin` va **cifrado** (las preguntas y respuestas no se pueden leer abriéndolo) y **firmado** (si alguien lo modifica, el juego lo rechaza). Como el juego funciona sin internet y sin servidor, la clave para leerlo tiene que viajar dentro del juego. Esto **frena a un jugador curioso, pero no a un experto** decidido a buscarla. Para una trivia de estudio personal, es una protección razonable.
