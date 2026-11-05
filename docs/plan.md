# Berea · Plan, decisiones y dudas

Este archivo es la memoria del proyecto. Toda decisión que cambie algo de las especificaciones se anota aquí, con su fecha.

## Qué es

Trivia sin internet para quienes leen la serie del Gran Conflicto de Elena G. de White (jóvenes de 15 a 20 años, sobre todo). Eslogan: «Cada capítulo, un tesoro por descubrir.» El nombre viene de Hechos 17:11.

Primera versión: *Patriarcas y Profetas* (73 capítulos; hoy están listos del 1 al 10), solo español, solo estilo Vibrante, varios perfiles por aparato y funcionamiento completo sin internet.

## Reglas del juego (no se cambian sin preguntar a la autora)

**Capítulos**
- Se juegan en orden; el siguiente se desbloquea al aprobar el anterior.
- 20 preguntas en 4 rondas, en orden: 6 fáciles, 6 intermedias, 6 avanzadas, 2 de aplicación.
- En cada intento se mezclan las preguntas dentro de su ronda (las rondas no cambian de orden) y las 3 opciones dentro de cada pregunta. La correcta se sigue por su texto, no por la letra.

**Tiempo**
- Reloj de 30 s que arranca cuando aparece la pregunta. No corre durante el cambio de ronda.
- Si llega a 0: «Se acabó el tiempo», cuenta como incorrecta y no se muestra la correcta.

**Corrección**
- Acierto: «Correcto», puntos ganados, explicación y cita bíblica; botón «Siguiente».
- Error: solo «Incorrecto». Nunca se muestra la correcta.
- Al terminar: resumen de las 20 preguntas (correcta, incorrecta, sin respuesta), sin mostrar la clave.

**Aprobar y puntos**
- Se aprueba con 14 de 20, en cualquier intento.

| Intento | Puntos por correcta | Máximo del capítulo | Estrellas |
|---|---|---|---|
| 1.º | 100 | 2.000 | 3 |
| 2.º | 80 | 1.600 | 2 |
| 3.º en adelante | 60 | 1.200 | 1 |

- Se guardan los puntos y estrellas del intento que aprobó y cuántos intentos necesitó. Total del libro = suma de capítulos aprobados (máximo 146.000 puntos y 219 estrellas).
- Los puntos se muestran como bono, nunca como descuento: «¡Aprobaste a la primera! Bono de primer intento: +40 por respuesta», «Bono de segundo intento: +20 por respuesta», «¡Lo lograste! Tu constancia también cuenta».

**Intentos**
- Ilimitados y sin espera.
- Cerrar a mitad de capítulo pierde el intento y cuenta como intento.
- Un capítulo aprobado se puede repetir para practicar, sin cambiar sus puntos, estrellas ni registro.

**Reflexión**
- Al aprobar: reflexión opcional, sin puntos, que se guarda en «Mi diario» del perfil.

## Requisitos de plataforma

- PWA: Vite + TypeScript + Preact, IndexedDB para datos, Workbox para funcionar sin internet.
- Prioridad: PC con Windows (Chrome y Edge) y celulares Android sencillos o antiguos. iPhone deseable, no obligatorio.
- Sin cuentas, sin servidor, sin anuncios, sin estadísticas. Nada sale del aparato.
- Liviano: descarga rápida con internet lento.
- Preparado para crecer: tema intercambiable (Solemne), textos en archivo aparte (otros idiomas), contenido y progreso por libro (otros 4 libros).

## Fases

| Fase | Qué hace | Estado |
|---|---|---|
| 1 | Proyecto base | Hecha |
| 2 | Convertidor del Excel | Hecha |
| 3 | Motor y datos | Hecha |
| 4 | Tema Vibrante y componentes | Hecha |
| 5 | Pantallas 1–4 | Hecha |
| 6 | Pantallas 5–7 (la trivia) | Hecha |
| 7 | Pantallas 8–10 | Hecha |
| 8 | Pantallas 11–13 | Hecha |
| 9 | Sin internet, publicación y entrega | Hecha |

## Decisiones

- **2026-10-22 · Preact en lugar de JavaScript simple.** Pesa unos 4 KB y facilita armar 13 pantallas y una decena de componentes reutilizables sin volver pesado el juego.
- **2026-10-22 · Un solo `package.json` en la raíz.** Vite sirve la carpeta `app/` y compila a `dist/`. Las pruebas viven en `pruebas/`. Así hay un solo lugar para instalar y ejecutar todo.
- **2026-10-22 · Compilación para navegadores de 2019 en adelante** (`es2019`), pensando en celulares Android antiguos. *(Cambiado en la Fase 5 a 2020 / Chrome 80+.)*
- **2026-10-22 · Repositorio git pendiente.** Por ahora el proyecto vive en la carpeta `berea` del escritorio; el repositorio (a nombre de la autora) se crea más adelante.

### Fase 2 · Convertidor (2026-11-03)

- **Excel usado:** la versión del 22 de octubre de 2026 (`Banco_Preguntas_Patriarcas_y_Profetas (3).xlsx` de Descargas, idéntica a la (2)). Resultado: 10 capítulos, 200 preguntas, 0 errores, 0 advertencias. `contenido.bin` pesa 24 KB.
- **El convertidor es una sola página HTML** (`convertidor/listo/Convertidor-Berea.html`) que se abre con doble clic, sin instalar nada ni usar internet. Se compila con `npm run convertidor:build`. Para el programador existe además `npm run contenido`, que hace lo mismo por terminal.
- **Formato de `contenido.bin`:** marca «BRA1» + versión, contenido JSON comprimido (fflate), cifrado con AES-GCM de 256 bits y firmado con Ed25519. El juego verifica la firma antes de descifrar y rechaza cualquier archivo alterado. El código del formato vive en `app/src/contenido/formato.ts` y lo comparten el convertidor y el juego.
- **Firma con @noble/ed25519 y no con Ed25519 de WebCrypto:** los Android antiguos no traen Ed25519 en el navegador. noble funciona en todos y pesa unos 5 KB.
- **Claves:** se crearon una sola vez con `npm run claves:crear`. La privada está en `claves/berea-clave-de-firma.json` (excluida del repositorio; la autora debe guardar una copia segura). La pública y la de cifrado están en `app/src/contenido/claves.ts`. Crear claves nuevas invalida todo `contenido.bin` anterior.
- **Límite de la protección:** sin servidor, la clave de cifrado viaja dentro del juego. Frena a un jugador curioso, no a un experto.
- **Errores y advertencias:** los errores (sin correcta, letra inválida, ≠ 20 preguntas, rondas ≠ 6/6/6/2, opciones vacías o repetidas, N.º repetido o inválido, capítulos con saltos, columnas faltantes) impiden generar el archivo. Las advertencias (sin reflexión, sin explicación, sin cita, título distinto entre filas) no lo impiden.
- **Capítulos a medio escribir bloquean la conversión.** Es más seguro que publicar capítulos incompletos. La autora puede tenerlos en otra hoja («Borradores») hasta terminarlos.
- **Idiomas:** el Excel puede traer una columna opcional «Idioma» («es», «en»…). Si no la trae, se asume español. También se pueden arrastrar varios Excel a la vez (uno por libro o por idioma) y se combinan.
- **Identificador de cada pregunta:** su N.º del Excel dentro del capítulo. Las preguntas se guardan ordenadas por ronda y N.º. La correcta se guarda como la posición de la opción en el Excel; el juego la sigue por su texto al mezclar.

### Fase 3 · Motor y datos (2026-11-03)

- **Dónde está cada cosa:** `app/src/motor/` (reglas, mezclas, partida con reloj, empezar/terminar capítulo, carga del contenido) y `app/src/datos/` (perfiles, avance, diario, ajustes y copia de respaldo en IndexedDB). 64 pruebas automáticas en `pruebas/`.
- **El reloj recibe la hora desde afuera.** La partida no mira el reloj del aparato: la pantalla le pasa la hora en cada paso. Así el reloj solo corre cuando la pregunta está a la vista (no durante el cambio de ronda) y las pruebas pueden simular los 30 segundos sin esperar. Una respuesta que llega después de los 30 s cuenta como «Se acabó el tiempo».
- **El intento se cuenta al pulsar «Empezar»** y se anota como «intento en curso». Si el juego se cierra a mitad, al volver ese intento ya está contado y se descarta: hay que empezar de nuevo. Empezar otro intento sin terminar el anterior también cuenta.
- **Práctica (capítulo ya aprobado):** se juega igual y muestra los puntos a 100 por correcta, pero no se guarda nada; no cambia puntos, estrellas, intentos ni registro. *A confirmar con la autora* si en práctica prefiere ver otra escala o ninguna.
- **El total, el capítulo actual y el registro de intentos se calculan** a partir de los capítulos aprobados; no se guardan aparte, así nunca se desincronizan.
- **El avance se guarda por número de capítulo,** separado del contenido. Corregir preguntas o agregar capítulos no toca el avance; un capítulo aprobado conserva sus puntos aunque cambien sus preguntas.
- **Ajustes por perfil** (no por libro): tamaño de letra (normal, grande, muy grande), sonidos (encendidos al inicio) y música del menú (apagada al inicio).
- **Perfiles:** solo nombre o apodo (máximo 24 letras) y uno de 6 colores (turquesa, azul, morado, naranja, rojo, índigo; el tema pone el color exacto).
- **Copia de respaldo** (archivo `.berea`): comprimida y cifrada con AES-GCM, que detecta cualquier cambio. Además, al recuperarla se comprueba que los puntos y estrellas de cada capítulo cuadren con las reglas (por ejemplo, 2.º intento = 80 por correcta y 2 estrellas); si no cuadran, se rechaza. La clave se deriva de la del contenido. Mismo límite: frena a un curioso, no a un experto.
- **Recuperar una copia reemplaza** el perfil con el mismo id en ese aparato (o lo agrega si no existe). La pantalla de Ajustes (Fase 8) debe pedir confirmación antes.
- **Se pide `navigator.storage.persist()`** al abrir la base, para que el navegador no borre los datos por falta de espacio.

### Fase 4 · Tema Vibrante y componentes (2026-11-03)

- **Archivos del proyecto:** los diseños aprobados (19 imágenes) están en `docs/disenos/`, y las especificaciones y los encargos en `docs/especificaciones.pdf`, `docs/disenos.pdf` y `docs/encargos.md`, copiados de Descargas. La «Guía de pantallas» no se encontró en la PC.
- **Tema:** `app/src/temas/vibrante.ts` tiene los valores aprobados sin cambios. Se agregaron tres datos que el tema Solemne también tendrá que definir: `movimiento` (las duraciones de `animacion` en forma usable), `avatar` (qué color del tema usa cada avatar; solo el naranja lleva la inicial oscura, como en el diseño 02) y `reloj` («circular» o «linea»).
- **Variables CSS:** `aplicarTema(tema, tamañoDeLetra)` las pone en la página: `--color-*`, `--letra-*-tamano/alto/peso`, `--espacio-1…7`, `--radio-*`, `--sombra-*`, `--tamano-*`, `--mov-*`, `--avatar-*`. Cambiar el tamaño de letra es volver a llamarla.
- **Color de cada ronda:** un contenedor con la clase `.ronda-1` … `.ronda-4` define `--ronda`, `--ronda-soft`, `--ronda-ink` y `--ronda-on`. Todo lo de adentro (opciones, reloj, chip) toma ese color. `.fondo-ronda` pinta el tinte de la ronda con un cambio suave de 400 ms.
- **Tonos intermedios** (bordes de las opciones, sombra del avatar grande): se mezclan a partir de los colores del tema con `color-mix`, con un valor de respaldo para navegadores antiguos. Ningún color se escribe a mano: una prueba automática lo vigila en componentes y pantallas.
- **Letra Nunito guardada dentro del juego** (`app/public/fuentes/`, 75 KB, solo alfabetos latinos): funciona sin internet y no se pide a Google Fonts.
- **Reducir movimiento:** sin latidos, rebotes ni confeti; los cambios de color se mantienen.
- **Textos:** `t('ruta.del.texto', { valores })` lee de `app/src/textos/es.json`. Los números se muestran con punto de miles («4.500»), como en los diseños, con la función `numero()` (la configuración regional de los navegadores no pone el punto en números de 4 cifras).
- **Catálogo de componentes provisional:** mientras no existan las pantallas, `npm run dev` muestra un catálogo con todos los componentes y sus estados, para revisarlos. Se quita en la Fase 5.

### Fase 5 · Pantallas 1 a 4 (2026-11-03)

- **Navegación con la dirección de la página** (`#/biblioteca`, `#/libro/patriarcas-y-profetas`…), así el botón «Atrás» del celular y del navegador funciona. Si se recarga la página sin perfil elegido, se vuelve a «¿Quién va a jugar?».
- **Al entrar sin jugadores** en el aparato, «Entrar» lleva directo a «Nuevo jugador». «Crear y empezar» crea el perfil, lo elige y va a la biblioteca.
- **Al elegir un perfil** se aplica su tamaño de letra y se descarta un intento que haya quedado a medias (ya estaba contado).
- **Capítulo actual en «¿Quién va a jugar?»:** el del primer libro de la serie (Patriarcas y Profetas), que es el único de esta versión.
- **Libros de la serie** (`app/src/contenido/libros.ts`): los 5 libros en orden con su número de capítulos (73 en Patriarcas y Profetas → 146.000 puntos y 219 estrellas). Un libro está disponible cuando el contenido lo trae; si no, aparece como «Próximamente». Los títulos están en los textos.
- **El mapa muestra los capítulos que trae el contenido** (hoy 10). Si el libro tiene más, al final dice «Pronto llegarán más capítulos». Al abrir el mapa, la vista baja sola hasta el capítulo que toca.
- **Tocar un capítulo** (aprobado o disponible) lleva por ahora a una pantalla provisional; la trivia llega en la Fase 6. «Mi progreso» y «Ajustes» también son provisionales hasta la Fase 8.
- **Silencio:** el botón silencia todo y se recuerda en el aparato (no depende del perfil).
- **Música del menú generada con Web Audio** (`app/src/sonido/musica.ts`): una melodía suave hecha en código, sin archivos. No pesa, funciona sin internet y no necesita licencia. Suena solo en las pantallas de menú, si el perfil la activó en Ajustes y no está silenciado; nunca durante las preguntas. Viene apagada (se podrá activar en la Fase 8).
- **`contenido.bin` llega al juego** desde `contenido/publicado/` (Vite lo sirve en desarrollo y lo copia al publicar).
- **Navegadores:** el objetivo de compilación pasó de 2019 a 2020 (Chrome 80+), porque la firma del contenido usa BigInt. Los Android antiguos siguen cubiertos.
- **El catálogo de componentes** quedó solo para programar (`#/catalogo` con `npm run dev`); no va en la versión publicada.

### Fase 6 · La trivia (2026-11-03)

- **Rutas:** `…/capitulo/N` (05 · Prepárate), `…/capitulo/N/jugar` (06 y 07) y `…/capitulo/N/resultado` (08, provisional hasta la Fase 7). «Empezar» reemplaza la pantalla 05, así «Atrás» desde las preguntas vuelve al mapa. Salir o recargar a mitad pierde el intento (ya estaba contado).
- **Aviso de «Prepárate» según el intento** (siempre como bono, nunca como descuento): 1.º «Si apruebas a la primera, ganas el bono completo…»; 2.º «Si apruebas en este intento, ganas un bono de +20 por respuesta…»; 3.º en adelante «Cada intento te acerca. Tu constancia también cuenta…»; capítulo ya aprobado: «Practica todo lo que quieras: tus puntos y estrellas no cambian». *A confirmar con la autora.*
- **Cambio de ronda también al empezar la ronda 1** («Preguntas fáciles · Empecemos por lo básico»), sin el globo de puntos porque todavía son 0. Las frases de ánimo de cada ronda y los 3 mensajes de ánimo al fallar son propuestas: *a confirmar con la autora.*
- **El reloj de cada pregunta arranca en el mismo instante en que aparece** (al pulsar «Siguiente» o al terminar el cambio de ronda). Así nunca hay una pregunta a la vista que todavía no se pueda responder.
- **«Siguiente» queda fijo abajo** una vez respondida la pregunta. En la última pregunta dice «Ver resultado».
- **En PC:** las teclas A, B y C (o 1, 2 y 3) responden y Enter pasa a la siguiente.
- **Sonidos cortos generados con Web Audio** (`app/src/sonido/efectos.ts`): toque, correcto, incorrecto (suave, no estridente), se acabó el tiempo, un tic en los últimos 5 segundos y el cambio de ronda. Suenan solo si el perfil tiene los sonidos encendidos y no está todo silenciado. La música del menú no suena desde «Prepárate» en adelante.
- **Letra muy grande:** en la pantalla de pregunta, las opciones tienen menos relleno y el círculo de la letra es más chico, como en el diseño 06e.
- **Comprobado en Edge (celular de 360 × 740, letra muy grande):** se jugaron los 10 capítulos y se midieron las 200 preguntas; en todas, la pregunta y las 3 opciones se ven completas sin desplazar. La más ajustada (cap. 3, pregunta 18) sobra 100 px.

### Fase 7 · Final del capítulo (2026-11-03)

- **Resultado aprobado:** confeti, insignia que brilla, estrellas una por una, puntos · correctas · intento, y el mensaje de bono exacto de las especificaciones según el intento. **Pedido de la autora (2026-11-03): el botón principal dice «Salir» y vuelve al mapa de capítulos** (antes decía «Siguiente capítulo»); «Escribir mi reflexión» y «Ver resumen» se mantienen. Si con ese capítulo se completó el libro, el botón dice «Ver mi certificado» (pantalla 13, Fase 8).
- **Resultado no aprobado:** «¡Casi!» si faltaron 4 o menos, «¡Buen intento!» si faltaron más. «Te faltó solo 1 respuesta» / «Te faltaron solo N» (hasta 3) / «Te faltaron N». Barra de correctas con la meta de 14 marcada.
- **Práctica** (capítulo ya aprobado): si aprueba, sin confeti ni estrellas: «Repasaste el capítulo. Tus puntos y estrellas no cambian.». Si no aprueba: «Esta vez fue práctica: tu capítulo sigue aprobado con sus puntos y estrellas.».
- **Resumen:** las 20 tarjetas en el orden en que se jugaron, agrupadas por ronda. Al abrirlo muestra la primera que no salió bien. Comprobado que la pantalla no contiene ninguna respuesta correcta.
- **Reflexión:** se abre desde el resultado («Escribir mi reflexión»; si ya escribió, «Ver mi reflexión» con su texto para seguir). Solo para capítulos aprobados. «Guardar en mi diario» se activa cuando hay texto; «Saltar» vuelve sin guardar. Si el capítulo no trae reflexión, no aparece el botón.
- **Navegación:** el resultado reemplaza la pantalla de preguntas; resumen y reflexión vuelven al resultado con «Atrás». Si se recarga la página en el resultado o el resumen (ya no hay partida en memoria), se vuelve al mapa.

### Fase 8 · Progreso, Ajustes y Libro terminado (2026-11-03)

- **Mi progreso:** capítulos aprobados sobre 73, puntos y estrellas; álbum con una insignia por cada capítulo que trae el contenido (ganadas en dorado, por ganar apagadas); registro de intentos; tarjeta «Mi diario» con la última reflexión escrita. Si el libro está completo, aparece «Ver mi certificado».
- **Mi diario completo** (pantalla agregada, no estaba en los diseños): se abre tocando la última reflexión o desde «Ver mi diario completo» del certificado. Muestra todas las reflexiones por capítulo, con su pregunta, y permite «Editar» cada una.
- **Guardar el diario como archivo:** texto plano (`Berea - Mi diario - Nombre.txt`), ordenado por capítulo, que se abre bien en el Bloc de notas.
- **Imprimir:** sale solo la versión para papel (fondo blanco), nunca la pantalla. El diario se imprime ordenado por capítulo; el certificado se imprime en la primera hoja y el diario completo a continuación, como piden las especificaciones.
- **Ajustes:** los cambios se guardan al instante en el perfil. El tamaño de letra se ve enseguida en la vista previa y en todo el juego. Se agregó el interruptor como componente nuevo. La música puede sonar también en Ajustes, Mi progreso y Mi diario (son menús), para que se escuche apenas se activa.
- **Copia de respaldo:** «Guardar copia» descarga `Berea-Nombre-fecha.berea` con el perfil actual. «Recuperar copia» primero revisa el archivo: si fue alterado o no es una copia, lo dice y no hace nada; si está bien, pide confirmación («El avance de Joshua en este aparato se reemplazará…») antes de reemplazar. Comprobado: se borró el avance y la copia lo recuperó idéntico.
- **Certificado:** «Guardar certificado» crea una imagen PNG con los colores y la letra del tema. La fecha es la del último capítulo aprobado.
- **Se quitó la pantalla provisional** «Muy pronto»: ya existen todas las pantallas.

### Fase 9 · Sin internet, publicación y entrega (2026-11-04)

- **Instalable y sin internet con Workbox** (`vite-plugin-pwa`, configurado en `vite.config.ts`): guarda en el aparato el juego completo (código, estilos, letra Nunito, iconos y el `contenido.bin` incluido; 16 archivos, unos 290 KB). Los sonidos y la música se generan en código, así que no hay archivos que guardar. La versión nueva del juego se instala sola en segundo plano y se usa al volver a abrirlo; nunca recarga a mitad de una partida.
- **Iconos de instalación** (`app/public/iconos/`): creados a partir del logo provisional y los colores del tema (192, 512, maskable y Apple). Cuando llegue el logo definitivo hay que volver a crearlos.
- **Actualización del contenido** (`app/src/motor/actualizar-contenido.ts`): al abrir, el juego usa la versión más alta entre la copia guardada en el aparato y la incluida. Con internet busca `contenido.bin?buscar=…` (esa dirección siempre va a la red); si la firma es válida y la versión es más alta, la guarda en el aparato (Cache Storage `berea-contenido`) y la usa. Sin internet, con el servidor caído o con la firma alterada, sigue con la que tiene y no muestra ningún error. Si llega a mitad de una partida, se aplica al terminarla. La búsqueda es un pedido simple: sin cookies ni datos del jugador.
- **Preparado para el panel (P5):** para buscar en Supabase Storage solo hay que cambiar la dirección de búsqueda; la verificación y la regla «solo versiones más altas» ya están.
- **Publicación en GitHub Pages** con `.github/workflows/publicar.yml`: en cada cambio de la rama `main` corre las pruebas, arma el juego y lo publica. Si una prueba falla, no se publica nada. Guía para la autora: `docs/como-publicar.md` (subir `contenido.bin` desde la página de GitHub, sin instalar nada).
- **El Excel del banco no se sube al repositorio** (`.gitignore`): trae todas las respuestas a la vista y el repositorio de GitHub Pages gratuito es público. Queda solo en la PC de la autora. Las pruebas que lo leen se saltan donde no está. El `contenido.bin` sí se sube porque va cifrado. *A confirmar con la autora.*
- **Git instalado** (2.56) y repositorio iniciado en la carpeta `berea` (rama `main`), sin el primer commit todavía: falta la cuenta de GitHub de la autora. Comprobado que `claves/`, `contenido/excel/` y `.env` quedan fuera.
- **Se quitaron** las carpetas vacías `app/public/sonidos` y `app/public/musica`. LICENCIAS.md ahora incluye el logo, los iconos, las ilustraciones, los sonidos y la música (todos propios) y Workbox (MIT).

**Comprobado en Edge (en silencio, servidor propio que se apaga para simular «sin internet»):**

| Caso | Resultado |
|---|---|
| Se puede instalar (manifiesto e iconos) | Sí, Edge no informa ningún error |
| Sin internet: abre, muestra el mapa y se juega una pregunta | Sí, con la letra Nunito cargada |
| Vuelve internet con contenido nuevo | Lo descarga y lo usa al instante; el avance queda idéntico |
| Sin internet otra vez | Sigue con la versión nueva |
| Archivo con la firma alterada | Se rechaza y sigue con la versión que tenía, sin mostrar errores |
| El servidor responde con error | Sigue igual, sin mostrar errores |
| El reloj llega a 0 | «Se acabó el tiempo», cuenta como incorrecta y no muestra la correcta (prueba automática y recorrido) |
| Se cierra el juego a mitad de capítulo | Pierde el intento, que queda contado (prueba automática y recorrido) |
| Aprobar en el 1.º, 2.º y 3.er intento | 100, 80 y 60 por correcta; 3, 2 y 1 estrellas (pruebas automáticas) |
| Copia de respaldo | Se recupera idéntica; una copia alterada se rechaza |
| La pregunta más larga en 360 px con letra muy grande | Las 200 preguntas entran sin desplazar; la más ajustada tiene 100 px de margen |

### Panel de administración → vista previa en el convertidor (2026-11-03)

- Un panel clásico (ver jugadores, avance o estadísticas) no es posible sin servidor ni cuentas, y va contra «nada sale del aparato». Se propuso una **vista previa de los capítulos dentro del convertidor** (solo en la PC de la autora) para revisar el contenido tal como se ve en el juego antes de publicarlo. **La autora dijo que sí.** Falta definir el alcance y cuándo hacerlo (resumen enviado a Claude chat para planificar: `docs/resumen-para-claude-chat.md`).
- **2026-11-04 · Llegó el encargo del panel** (`docs/panel.md`, fases P0 a P6) con un panel en Supabase solo para la autora: el juego sigue sin cuentas y sin depender de Supabase. Los diseños están en `docs/disenos-panel/fuente/` (las 10 pantallas en HTML, tal como se descargaron del lienzo de diseño); faltan las imágenes PNG. Se empieza por P0, que solo pide el plan.

## Panel de administración · P0: plan (2026-11-04)

Encargos en `docs/panel.md`. Un panel web solo para la autora, con Supabase. El juego no cambia para los jugadores y **nunca depende de Supabase**: si Supabase falla o está pausado, solo se detiene el panel.

### 1. Tablas y estados

Todo en Postgres (Supabase). Las preguntas se guardan igual que en el Excel, para que «Descargar el banco como Excel» devuelva las mismas columnas.

| Tabla | Qué guarda | Columnas principales |
|---|---|---|
| `libros` | Los libros de la serie | `id` («patriarcas-y-profetas»), `titulo`, `total_capitulos` (73), `idioma` («es») |
| `capitulos` | Un capítulo escrito (los «sin escribir» no tienen fila) | `libro_id`, `numero`, `titulo`, `reflexion`, `validacion`, `avisos` (lista de errores y advertencias, con las mismas reglas del convertidor), `medicion` (px que sobran o faltan en 360 × 740 con cada tamaño de letra), `huella` (código del contenido actual), `huella_publicada` (código en la última versión publicada) |
| `preguntas` | Las 20 preguntas de cada capítulo | `libro_id`, `capitulo`, `numero` (N.º del Excel), `ronda`, `texto`, `opcion_a/b/c`, `correcta` (puede faltar en un borrador), `explicacion`, `cita` |
| `versiones` | Cada publicación | `numero` (1, 2, 3…), `publicada_en`, `capitulos` (lista), `mensaje`, `sha256` del archivo, `contenido` (copia exacta de lo publicado, sin cifrar), `vuelve_a` (si fue «Volver a esta»), `retirada_en` |
| `registro` | Actividad: entradas, subidas, correcciones, publicaciones, acciones delicadas (intentadas o hechas) | `cuando`, `accion`, `detalle`, `navegador`, `resultado` (hecho / rechazado). **Solo se agrega:** nadie puede cambiar ni borrar filas, ni siquiera la autora |
| `privado.config` | Id de la autora, clave pública del sello, códigos de recuperación (cifrados con hash) | Solo la leen las funciones del servidor; el navegador no tiene acceso |
| `privado.desafios` | Desafíos del sello (P6) | `id`, `accion`, `vence_en` (5 minutos), `usado_en` |

**Estado de un capítulo:** se calcula a partir de dos datos guardados, para que nunca se desincronice:
- `validacion` = **errores** / **advertencias** / **bien** (se recalcula al subir el Excel y al guardar cada corrección).
- Publicación: sin `huella_publicada` → **nuevo**; `huella` igual a `huella_publicada` → **publicado**; distinta → **publicado con corrección pendiente**.

Por lo tanto: «Borrador con errores» = errores; «Con advertencias» = advertencias y no publicado igual; «Listo» = bien y nuevo o corregido; «Publicado» = huellas iguales; «Sin escribir» = sin fila. El recuadro «Qué cambió» compara con la copia guardada en la última versión.

**Reglas RLS:** todo bloqueado por defecto. `libros`, `capitulos`, `preguntas` y `versiones` se leen y escriben solo si `auth.uid()` es el id de la autora **y** la sesión pasó el código de 6 números (`aal2` en el token). `registro`: la autora puede leer y agregar, nunca cambiar ni borrar. `privado.*`: sin acceso desde el navegador.

### 2. La llave de firma en el servidor

- Es **la misma** de `claves/berea-clave-de-firma.json`; no se crea otra.
- Se guarda como **secreto de las Edge Functions** (`BEREA_CLAVE_FIRMA`), con la terminal de Supabase, desde la PC (`supabase secrets set`). No pasa por el repositorio, ni por la base de datos, ni por el navegador. Elegí el secreto de funciones en lugar de Vault porque Vault vive dentro de la base de datos (y de sus copias), mientras que el secreto solo lo ve la función.
- La función **publicar** comprueba el token (es la autora y la sesión es `aal2`), arma el contenido con los capítulos marcados, lo empaqueta con el mismo `formato.ts` del juego (comprime, cifra, firma), lo sube a Storage y anota la versión y el registro. El código compartido (`formato.ts`, claves públicas, validación del convertidor) se copia a `supabase/functions/_shared/` con un script, para que juego, convertidor y servidor usen exactamente el mismo.
- La clave de cifrado no es secreta (ya viaja dentro del juego); la función usa la misma de `claves.ts`.
- La autora conserva su copia de la llave en el pendrive, como hasta ahora.

### 3. Cómo recibe el juego las versiones nuevas

- **Storage:** un depósito público `contenido` con `contenido.bin` (la versión vigente) y `versiones/N.bin`. Lectura pública sin cuenta; escritura solo desde la función publicar. Se sube con caché corta (60 s).
- **El juego ya tiene casi todo desde la Fase 9:** busca con internet, acepta solo archivos con firma válida y versión más alta, los guarda, y sigue sin errores si no hay internet o la firma no sirve. Cambios necesarios:
  1. **Dirección de búsqueda configurable** (`VITE_URL_CONTENIDO`): la de Supabase Storage. La dirección es pública, no es un secreto. Si no está configurada, busca en el mismo sitio, como hoy.
  2. **Número de versión:** el juego compara un número interno que hoy es la fecha y hora de la conversión (por ejemplo, 1793711043062). El panel seguirá usando ese número para el juego y mostrará «versión 4» solo como nombre. Si el panel publicara simplemente «4», el juego lo tomaría como más viejo y lo rechazaría.
  3. **«Volver a esta versión»:** el archivo viejo lleva su número viejo adentro y el juego lo rechazaría. Por eso la función lo vuelve a empaquetar y firmar con un número nuevo (mismo contenido, versión 5 = 3), como pide el encargo.
  4. **«Mensaje para los jugadores»:** campo nuevo y opcional `mensaje` en el contenido (el formato sigue siendo el 1, y los juegos ya instalados lo ignoran). El juego lo muestra en la pantalla de inicio. *Falta el diseño de cómo se ve en el juego.*
  5. **«Retirar el contenido publicado»:** borra el `contenido.bin` de Storage. Los jugadores conservan lo que tienen y dejan de recibir cambios, tal como dice el diseño 10.
- **Privacidad:** el pedido no lleva cookies, cuenta ni datos del jugador. Como cualquier sitio, Supabase ve la dirección IP del pedido, igual que hoy GitHub Pages.
- **El `contenido.bin` de GitHub Pages queda como base:** quien instala por primera vez recibe ese y enseguida busca el de Supabase. No hace falta mantenerlos iguales.
- **Desde que el panel funcione, se publica solo por el panel.** El convertidor queda como respaldo de emergencia. La «vista previa en el convertidor» que se había planeado la reemplaza la pantalla 06 del panel.

### 4. Lo que tienes que hacer tú en Supabase (te guío paso a paso cuando toque)

1. Crear una **organización a nombre de la autora** y, dentro, un **proyecto nuevo** «berea» (región São Paulo, la más cercana). Guardar la contraseña de la base de datos en el sobre.
2. En **Authentication → Sign In / Providers**: **desactivar «Allow new users to sign up»** (registro cerrado).
3. En **Authentication → Users → Add user**: crear `autora@berea.invalid` con su contraseña y marcar **«Auto Confirm User»**. Pasarme el **id del usuario** (UUID; no es secreto).
4. Crear el archivo `panel/.env` con la **dirección del proyecto** y la **clave pública** (anon/publishable). Te dejo la plantilla. La clave de servicio no se escribe en ningún lado.
5. Para que yo suba las tablas y las funciones: ejecutar una vez `npx supabase login`, que abre el navegador para que entres a tu cuenta. Subir la llave de firma como secreto lo hago yo con la terminal, **después de que me confirmes**: es el único momento en que la llave sale de la PC.
6. El código de 6 números se activa en la P1, la primera vez que la autora entra al panel: escanea un código QR con una aplicación de códigos en su celular.

### Hecho en Supabase (2026-11-04, con un token temporal del usuario)

- Organización **«Berea»** (`xoglslfcwkhzhcyfabry`) y proyecto **«berea»** (`zpcxvpimvksxqyteisoh`, São Paulo), nuevos y separados de todo lo demás. No se listaron ni miraron otros proyectos de la cuenta. La organización está en la cuenta del usuario: hay que invitar a la autora como dueña (Owner).
- **Registro cerrado** y **código de 6 números (TOTP)** activado. Comprobado: crear una cuenta desde afuera da «Signups not allowed».
- **Usuario de la autora:** `autora@berea.invalid`, ya confirmado, con id `c8846839-8fed-4204-bf18-44338f330d87`. La contraseña se generó al azar y está en `claves/autora-contrasena.txt`: hay que anotarla en el sobre y borrar el archivo. Comprobado: entra con la contraseña (sesión `aal1`, todavía sin código) y se rechaza una contraseña equivocada.
- `panel/.env` tiene la dirección del proyecto y la clave pública (excluido del repositorio). La clave de servicio no se guardó en ningún archivo.
- En `claves/` (excluida del repositorio): `supabase-token.txt` (**borrarlo y revocarlo en supabase.com al terminar el panel**), `supabase-proyecto.json` (ids) y `supabase-contrasena-base-de-datos.txt`.

### Acceso pensado para una autora olvidadiza (2026-11-04)

- **Usuario: `sharon@berea.invalid`** (antes `autora@berea.invalid`). En la pantalla Entrar basta con escribir **«sharon»**: el panel agrega `@berea.invalid`. *Pendiente: cambiar el correo en Supabase cuando haya token nuevo (el id del usuario no cambia).*
- **Contraseña: la maneja el programador** (pedido de la autora). Recomendado: una frase de 4 o 5 palabras fácil de recordar para ella. El programador la escribe en `claves/frase.txt` y se pone en Supabase junto con el cambio de correo; si no, queda la generada al azar de `claves/autora-contrasena.txt`. Va anotada en el sobre. El panel no le pide elegir contraseña.
- **Código de 6 números:** no se memoriza; lo da una aplicación del celular (Google o Microsoft Authenticator, con la copia en la nube activada para no perderlo al cambiar de celular).
- **Si se olvida la contraseña:** el programador la cambia desde Supabase. **Si pierde el celular:** usa un código de recuperación del sobre.
- **El sello (P6) no lleva clave propia:** es un archivo en el pendrive, con una copia en el sobre. Nada más que recordar.
- Resultado: lo único que hay que recordar es la frase, y aun así tiene respaldo.

### Puntos a decidir antes de la P1

- **Códigos de recuperación:** Supabase no los trae. Propongo hacerlos nosotros: 10 códigos de un solo uso que se guardan cifrados con hash. Con contraseña + un código, se borra el código de 6 números viejo para activar uno nuevo. Cada uso queda en el registro.
- **Dónde vive el panel:** propongo publicarlo junto al juego en GitHub Pages, en una dirección aparte (`…/berea/panel/`), sin enlace desde el juego y sin aparecer en buscadores. Así se usa desde cualquier PC, siempre con contraseña y código. La otra opción es solo en la PC de la autora.
- **Proyecto gratuito de Supabase:** se pausa tras 7 días sin uso. El juego no se ve afectado; el panel se reactiva con un clic en supabase.com. Si molesta, el plan de pago lo evita.
- **Número de la primera versión:** el contenido que tienen hoy los jugadores (capítulos 1 a 10) será la «versión 1» en el panel, salvo que la autora prefiera otro número.

## Panel · P1 (2026-11-04, en curso)

- **Hecho en la PC:** migración `supabase/migrations/20261104120000_panel_base.sql` (tablas, RLS solo para la autora con `aal2`, registro que solo se agrega, códigos de recuperación con hash y máximo 5 intentos fallidos por hora); panel en `panel/` (Entrar, Código de 6 números, activar el código la primera vez, código de recuperación, códigos nuevos, menú lateral e Inicio con datos reales o vacíos); `npm run panel:dev` y el panel se arma con `npm run build` en `dist/panel/`. 13 pruebas nuevas (107 en total). La pantalla Entrar coincide con el diseño 01.
- **Subido a Supabase (2026-11-04):** tablas y reglas, y el arreglo `20261104130000_codigos_recuperacion_arreglo.sql` (Supabase no permite DELETE sin WHERE desde el panel). Usuario cambiado a `sharon@berea.invalid` con la contraseña nueva que eligió la autora (`claves/frase.txt`).
- **Pruebas obligatorias en el Supabase real: 24 de 24 bien.** Sin cuenta no se lee ni se escribe nada. El registro de cuentas está cerrado («Signups not allowed»). Otro usuario no lee ni escribe nada, ni siquiera con su propio código de 6 números (aal2). La autora sin el código no lee ni escribe nada; con el código, sí. Un código equivocado se rechaza. El registro de actividad no se puede cambiar ni borrar. Las versiones solo las escribe el servidor. Los códigos de recuperación: se crean 10, no se pueden crear otros mientras queden sin usar, uno equivocado se rechaza, uno correcto borra el código de 6 números anterior y no sirve dos veces. Al final se borraron el usuario de prueba, el código de 6 números de prueba y el registro de prueba: la autora activa su código desde cero la primera vez que entre.

## Panel · P2 a P6 (2026-11-04)

**P2 · Banco de preguntas**
- Pantalla 04: el Excel se lee con el MISMO lector del convertidor (`leerExcel`) y cada capítulo se valida con sus MISMAS reglas (`armarContenido`), pero por separado: un capítulo con errores queda como borrador y no frena a los demás. Los capítulos iguales a lo publicado se agrupan en una fila («1 a 10 · Sin cambios»). Solo se guardan los capítulos que cambiaron. «Descargar el banco como Excel» devuelve las mismas columnas del Excel de la autora (comprobado: se vuelve a leer idéntico).
- Pantalla 05: estado calculado (validación + huellas), correctas A·B·C, si entra en celular con letra muy grande, filtros y la fila «N a 73 · Sin escribir». Los capítulos sin medición (los importados) se miden solos en segundo plano.
- **Huella de un capítulo:** SHA-256 de lo que ve el jugador, en el orden del juego. Se calcula igual desde el banco y desde un contenido publicado: comprobado con el Excel real, los 10 capítulos dan la misma huella que el `contenido.bin` vigente.
- **Banco vigente = versión 1:** el script de instalación importa el Excel actual y marca sus 10 capítulos como «Publicado» en la versión que tienen hoy los jugadores (el `contenido.bin` vigente, que también se sube a Storage).

**P3 · Vista previa**
- `panel/vista.html`: la pantalla de pregunta del juego armada con sus mismos componentes y estilos (`ChipRonda`, `Reloj`, `Opcion`, `pregunta.css`), dentro de un iframe de 360 × 740. Las opciones van en el orden del Excel y la correcta se ve como en el juego al acertar, con «CORRECTA» donde el juego pone «+100». Las preguntas corregidas sin publicar llevan marco morado.
- **Medición:** se mide como la ve el jugador antes de responder. Comprobado con los 10 capítulos: da el mismo resultado que la medición del juego (Fase 6): ninguna pregunta se sale y la más ajustada es la misma pregunta del capítulo 3, con 100 px de margen.
- **Control de calidad (solo advertencias):** preguntas repetidas en el libro, la misma letra correcta más de 9 veces de 20, citas con formato raro y preguntas que no entran con letra muy grande. Con el Excel real no da ninguna falsa alarma.

**P4 · Editar pregunta**
- Pantalla 07 con contador de letras, medición en vivo con letra muy grande, las 3 opciones con su botón de «correcta» y el recuadro «Qué cambió» (antes = lo que tienen los jugadores; si nunca se publicó, lo guardado). Al guardar se revalida el capítulo con las mismas reglas: un borrador pasa a «listo» al corregir sus errores. Registro: «Corregiste una pregunta · Capítulo 4 · pregunta 10 · explicación».

**P5 · Publicar**
- Función del servidor `publicar` (`supabase/functions/publicar`): comprueba que llama la autora con `aal2` (la misma regla `es_autora()` de la base), arma la versión con `armarVersion` (lo publicado + lo marcado; exige capítulos seguidos desde el 1), revisa cada capítulo, lo empaqueta con el MISMO `formato.ts` del juego, lo firma con la llave (secreto `BEREA_CLAVE_FIRMA`, el mismo archivo de `claves/`) y lo sube a Storage (`contenido.bin` y `versiones/N.bin`, caché de 60 s). Guarda número, fecha, capítulos, mensaje, SHA-256 y el contenido.
- El código compartido se copia para el servidor con `npm run funciones:preparar` (adapta las importaciones a Deno); así juego, panel y servidor usan exactamente el mismo formato y las mismas reglas.
- «Volver a esta» vuelve a firmar el contenido viejo con un número interno nuevo (el juego solo acepta números mayores).
- **Juego:** busca en `VITE_URL_CONTENIDO` (Storage) si está configurada; si no, en su propio sitio. Muestra el «Mensaje de la autora» en la bienvenida (campo opcional `mensaje` del contenido; los juegos viejos lo ignoran).

**P6 · Seguridad y sello**
- **Sello de la autora:** `npm run sello:crear` crea un par Ed25519 NUEVO (distinto de la llave de firma) en `claves/sello-de-la-autora.berea`, sin clave propia (pedido: nada más que recordar). La parte pública queda en `privado.config`. Para reemplazarlo (si se pierde el pendrive): borrar el archivo, volver a crearlo y actualizar `sello_publico` (lo hace el script de instalación).
- Cada acción delicada pide un desafío nuevo (`crear_desafio`, vence a los 5 minutos y sirve una vez) que el panel firma con el archivo del pendrive en el navegador; la función `accion-delicada` lo marca como usado y comprueba la firma. Cada intento, fallido o hecho, queda en el registro.
- **Límites honestos:** «Crear una llave de firma nueva» crea y descarga la llave, pero no la activa: para eso el programador debe ponerla como secreto y publicar el juego con su parte pública (si no, el juego rechazaría todo lo nuevo). «Pasar el proyecto» queda anotado y muestra los pasos (la transferencia se hace en supabase.com y GitHub).
- Guía para la autora: `docs/panel-guia.md`.

**«Código de Berea» en el celular (2026-11-04, pedido del usuario: «solo apretar Escanear»):** el cuadro de activación ya no es para una aplicación, sino que abre `panel/codigo.html#k=CLAVE` con el botón «Escanear código QR» de Android (o la cámara). La página guarda la clave en ese celular (llega después de «#», así que nunca viaja a ningún servidor, y se borra de la dirección y del historial) y muestra el código TOTP estándar (comprobado con los valores oficiales del RFC 6238 y contra una aplicación). Se agrega a la pantalla de inicio. Sigue siendo el mismo código de 6 números de Supabase: la seguridad no cambia. Límite: si se borran los datos del navegador del celular, se usa un código de recuperación. Queda la opción de Google Authenticator con un segundo cuadro. **Solo funciona con el panel publicado (https):** el celular no puede abrir `127.0.0.1` de la PC.

**PIN de «Código de Berea» (2026-11-05):** la clave del código se guarda en el celular cifrada con un PIN de 4 números (PBKDF2 310 000 vueltas + AES-GCM). Rechaza PIN fáciles (0000, 1234, 9876), pide esperar 5 minutos cada 5 PIN equivocados y se vuelve a cerrar al salir de la página o a los 3 minutos. «Olvidé mi PIN» borra la clave: se reactiva con un código de recuperación. **Límite honesto:** frena a quien agarre el celular un rato; con 4 números, alguien con conocimientos técnicos y el celular desbloqueado en sus manos podría probarlos todos fuera del navegador.

**Medidas de seguridad extra (2026-11-05, migración `20261105120000_seguridad.sql`):**
- **Sesiones cerradas de verdad:** `es_autora()` también exige que la sesión siga abierta en `auth.sessions`. Al salir, al cambiar la contraseña o al entrar en otro aparato (el panel cierra las demás sesiones con `signOut({ scope: 'others' })`), la sesión vieja deja de leer el banco enseguida, sin esperar a que venza su permiso.
- **Intentos equivocados:** el panel los anota con `anotar_entrada_fallida` (registro con «Rechazado», tope 100 por hora) y con 5 en 15 minutos `pausa_de_entrada` hace esperar 15 minutos. Inicio muestra la entrada anterior y cuántos intentos equivocados hubo desde entonces. **Límite honesto:** la espera la respeta el panel; quien llame a Supabase directamente solo choca con el límite de Supabase por dirección de internet (el plan gratis no permite revisar la contraseña en el servidor). Al revés, alguien podría hacer esperar a la autora anotando intentos falsos, pero nunca entrar.
- **Cierre por inactividad:** 15 minutos sin tocar el panel → sale solo.
- **Código reciente para publicar:** la función `publicar` exige el código de 6 números puesto hace 5 minutos o menos (lo lee de `amr` en el permiso de la sesión); si no, responde `pide-codigo` y el panel lo pide con una ventana y sigue solo.
- **Borrados con 24 horas de espera:** `borrar_libro` y `borrar_banco` (con el sello) quedan en `privado.borrados_pendientes`; una tarea de `pg_cron` cada 10 minutos los hace al cumplirse el plazo, con una copia justo antes. Inicio y Seguridad muestran el aviso con «Cancelar el borrado» (cancelar no pide el sello).
- **Copia diaria del banco:** `pg_cron` a las 07:00 UTC guarda capítulos y preguntas en `privado.copias` (las últimas 30). Para restaurar una: leer `privado.copias.datos` con el token y volver a insertar sus filas.
- **Protección de las páginas:** al armar, el panel lleva una regla CSP (solo su propio código, solo habla con Supabase, sin formularios hacia afuera) y no se dibuja si otra página lo mete dentro de la suya.
- Contraseña mínima: 10 letras (en Supabase y en «Cambiar la contraseña»).

**Instalación y pruebas en Supabase:** `npx vite-node supabase/pruebas-servidor.ts` (con un token en `claves/supabase-token.txt`) aplica las migraciones del sello y de seguridad, crea el sello, guarda el secreto, sube las funciones, importa la versión 1, corre las pruebas obligatorias de P5 y P6 y deja todo limpio; `--solo-limpiar` solo deja todo como la primera vez.

## Dudas abiertas

- ¿Qué puntos mostrar al practicar un capítulo ya aprobado? (Hoy: 100 por correcta, sin guardar.)
- Revisar con la autora los textos propuestos en la Fase 6: avisos de «Prepárate» para el 2.º y 3.er intento y para práctica, frases de cada cambio de ronda y mensajes de ánimo al fallar.

- Faltan por copiar al proyecto: `docs/especificaciones.pdf`, `docs/guia-pantallas.pdf` y las 19 imágenes en `docs/disenos/`.
- La autora debe guardar una copia de `claves/berea-clave-de-firma.json` en un lugar seguro (pendrive).
- En Descargas hay 4 versiones del Excel; conviene que la autora confirme que la del 22 de octubre es la vigente.
- Logo: se usará el de los diseños aprobados como provisional hasta tener el definitivo.
