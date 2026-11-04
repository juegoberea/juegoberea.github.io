# Cómo publicar una versión nueva de Berea

Esta guía es para publicar **sin programar**. Berea vive en GitHub Pages, un servicio gratuito de GitHub: cada vez que subes un archivo nuevo al proyecto en GitHub, el juego se vuelve a publicar solo, en unos 2 minutos.

Solo necesitas tu PC, internet y tu cuenta de GitHub. No hace falta instalar nada.

> **Desde que existe el panel de administración, las preguntas se publican desde el panel** (ver [panel-guia.md](panel-guia.md)): se sube el Excel, se revisa y se pulsa «Publicar». Lo que sigue (subir `contenido.bin` a GitHub) queda como **camino de emergencia** si el panel no funciona.

## Camino de emergencia: publicar preguntas sin el panel

### Paso 1 · Prepara el archivo

Sigue la guía [como-actualizar-contenido.md](como-actualizar-contenido.md) hasta descargar el **`contenido.bin`** nuevo. Queda en tu carpeta de **Descargas**.

### Paso 2 · Súbelo a GitHub

1. Entra a **github.com** con tu cuenta y abre el proyecto **berea**.
2. Haz clic en la carpeta **`contenido`** y luego en **`publicado`**.
3. Arriba a la derecha, pulsa **«Add file»** y después **«Upload files»**.
4. Arrastra el `contenido.bin` de tu carpeta de Descargas a la página. Reemplaza al anterior, que tiene el mismo nombre.
5. Abajo, en el primer recuadro, escribe qué cambiaste. Por ejemplo: «Capítulos 11 y 12» o «Corrijo la pregunta 10 del capítulo 4».
6. Pulsa el botón verde **«Commit changes»**.

### Paso 3 · Espera unos 2 minutos y comprueba

1. Arriba, en el proyecto, abre la pestaña **«Actions»**.
2. Verás una fila con lo que escribiste en el paso 2:
   - **Círculo amarillo:** se está publicando. Espera.
   - **Check verde:** listo, ya está publicado.
   - **Cruz roja:** no se publicó y los jugadores siguen con la versión anterior; no se rompió nada. Avísale al programador.
3. Abre el juego en tu navegador y revisa que se vean los capítulos nuevos. Si no los ves, cierra el juego y vuelve a abrirlo.

### Qué pasa con los jugadores

- Reciben el contenido nuevo **la próxima vez que abran Berea con internet**. No tienen que hacer nada ni volver a instalar el juego.
- **No pierden su avance:** conservan sus capítulos aprobados, sus puntos, sus estrellas y su diario, aunque hayas corregido preguntas de capítulos que ya aprobaron.
- Si están sin internet, siguen jugando con la versión que ya tenían. Cuando vuelvan a tener internet, reciben la nueva.
- Si un capítulo cambió mientras alguien lo estaba jugando, el cambio se ve al terminar ese intento.

## Dirección del juego

Los jugadores entran a una dirección de este tipo (la pone el programador la primera vez):

**https://[tu-usuario].github.io/berea/**

Desde ahí pueden **instalarlo**:
- **En la PC (Chrome o Edge):** el botón de instalar que aparece a la derecha de la barra de direcciones.
- **En el celular Android (Chrome):** el menú ⋮ → «Instalar aplicación» o «Agregar a la pantalla principal».
- **En iPhone (Safari):** el botón Compartir → «Agregar a inicio».

Una vez instalado, Berea funciona **sin internet**: preguntas, letra, sonidos y música van dentro del juego.

## Primera vez (lo hace el programador, una sola vez)

1. Crear en GitHub, con la cuenta de la autora, un proyecto llamado `berea` y subir esta carpeta (**sin** la carpeta `claves/`, que ya está excluida en `.gitignore`).
2. En el proyecto: **Settings → Pages → Build and deployment → Source: «GitHub Actions»**.
3. Subir un cambio a la rama `main` (o abrir **Actions → Publicar Berea → Run workflow**). El archivo `.github/workflows/publicar.yml` corre las pruebas, arma el juego y lo publica. Si una prueba falla, no se publica nada.
4. En **Settings → Secrets and variables → Actions → Variables**, crear tres variables (son públicas, no son secretos):
   - `SUPABASE_URL`: `https://zpcxvpimvksxqyteisoh.supabase.co`
   - `SUPABASE_CLAVE_PUBLICA`: la clave pública (anon) del proyecto, la misma de `panel/.env`.
   - `URL_CONTENIDO`: `https://zpcxvpimvksxqyteisoh.supabase.co/storage/v1/object/public/contenido/contenido.bin` (donde el juego busca lo que publica el panel).
5. Anotar la dirección que aparece en **Settings → Pages** y compartirla con los jugadores. El panel queda en esa misma dirección terminada en `/panel/` (solo para la autora; no aparece en buscadores).

Los cambios de programación (pantallas, reglas, textos) se publican igual: al subirlos a `main`, el juego se publica solo. Los jugadores reciben esa versión al abrir el juego con internet, y su avance no se toca.

## Lo que nunca debe subirse

- **La carpeta `claves/`** ni el archivo `berea-clave-de-firma.json`. Es tu llave de firma: guárdala en tu PC y en tu pendrive, nunca en internet.
- Archivos con datos de jugadores (copias de respaldo `.berea`, diarios): son de cada jugador.
