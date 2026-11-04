---
title: "Berea · Panel de administración · Encargos para Claude Code"
date: "3 de noviembre de 2026"
---

# Cómo usar estos encargos

Son 7 encargos: uno de contexto (P0) y uno por fase (P1 a P6). Se pegan en orden en la misma conversación de Claude Code; en cada fase Claude Code trabaja, se detiene y tú revisas antes de seguir.

**Cuándo empezar:** después de terminar las fases 8 y 9 del juego. La fase P5 (publicar) necesita el mecanismo de actualización del juego de la fase 9.

**Antes de empezar, en el repositorio `berea`:**

- `docs/disenos-panel/`: las 10 imágenes del panel (`01-entrar.png` … `10-poner-sello.png`).
- `docs/panel.md`: este documento.
- Un proyecto de Supabase **nuevo y solo para Berea**, separado de cualquier otro proyecto, en una organización que quede a nombre de la autora. Pasa a Claude Code la dirección del proyecto y la clave pública en un archivo `.env` (nunca en el repositorio). La clave de servicio no se escribe en ningún archivo del repositorio.

| Fase | Qué hace | Imágenes |
|---|---|---|
| P0 | Contexto y reglas del panel | — |
| P1 | Base, acceso y diseño general | 01, 02, 03 |
| P2 | Banco de preguntas | 04, 05 |
| P3 | Revisión y vista previa | 06 |
| P4 | Edición de preguntas | 07 |
| P5 | Publicar con firma automática | 08 |
| P6 | Seguridad y sello de la autora | 09, 10 |

Las opciones extra (mensaje del día, versículo de la semana, textos editables, certificado personalizado, desafío extra) quedan fuera hasta que la autora las marque en el documento «Berea · Panel de administración».

# P0 · Contexto y reglas del panel

```text
Vamos a construir el panel de administración de Berea. Lee primero docs/plan.md (memoria del proyecto) y este encargo completo. Los diseños aprobados están en docs/disenos-panel/.

Qué es: una página web que usa SOLO la autora para manejar el contenido: subir el banco de preguntas (Excel), revisarlo, corregirlo y publicarlo para los jugadores. No hay coadministradores.

Reglas que no se cambian sin preguntar:
1. El juego no cambia para los jugadores: sin cuentas, sin datos personales, sin estadísticas. El panel nunca ve jugadores, avances ni reflexiones.
2. El juego nunca depende de Supabase. Si Supabase falla o está pausado, el juego sigue funcionando con el contenido que ya tiene; solo se detiene el panel.
3. Un solo usuario: la autora. El registro está cerrado. Las reglas de la base de datos (RLS) solo permiten leer y escribir a ese usuario, identificado por su id interno de Supabase, no por el texto del correo.
4. El usuario de la autora no es un correo real (por ejemplo autora@berea.invalid). Se crea a mano en Supabase, ya confirmado. Código de 6 números (TOTP) obligatorio.
5. Al publicar, el contenido se firma AUTOMÁTICAMENTE con la llave de firma que ya existe (claves/berea-clave-de-firma.json). No crees una llave nueva: invalidaría todo lo publicado. La llave vive como secreto del servidor (Supabase Vault o secreto de una Edge Function); el navegador nunca la ve.
6. Las acciones muy delicadas piden el SELLO DE LA AUTORA: un par de claves NUEVO, creado solo para esto y distinto de la llave de firma. La parte privada es un archivo que la autora guarda en su pendrive; la pública queda en el servidor. No hay huella ni otra forma. Las acciones son: crear una llave de firma nueva; descargar la llave o una copia completa; pasar el proyecto a otra persona; retirar el contenido publicado; borrar un libro o todo el banco. También cambiar el usuario, la contraseña y ver los códigos de recuperación.
7. Todo queda anotado en un registro de actividad con fecha y hora.

Tecnología:
- Carpeta nueva panel/ en el mismo repositorio, con Vite + TypeScript + Preact, como el juego.
- Reutiliza todo lo que ya existe: el tema Vibrante (app/src/temas/vibrante.ts), los componentes del juego para la vista previa, el lector y validador del convertidor (mismas reglas de errores y advertencias) y app/src/contenido/formato.ts para armar contenido.bin.
- Supabase: Auth (con TOTP), base de datos con RLS, Storage para los archivos publicados y Edge Functions para firmar y para las acciones delicadas.
- Textos del panel en un archivo aparte, en español.
- Diseño para PC, que también se pueda usar en una tableta; ancho mínimo cómodo 1024 px.

Todavía no programes nada. Responde con:
1. El esquema de tablas que propones (libros, capítulos, preguntas, versiones, registro de actividad), con sus estados.
2. Cómo vas a guardar y usar la llave de firma en el servidor.
3. Cómo recibirá el juego las versiones nuevas (ver P5) y qué hay que cambiar en el juego para eso.
4. Lo que necesitas que yo haga en Supabase con mis manos.
Anota las decisiones en docs/plan.md y detente.
```

# P1 · Base, acceso y diseño general

```text
Fase P1 del panel. Imágenes: 01-entrar.png, 02-codigo.png y 03-inicio.png de docs/disenos-panel/.

1. Crea las tablas y las reglas RLS acordadas en P0. Por defecto todo está bloqueado; solo el usuario de la autora puede leer y escribir.
2. Pantalla 01 · Entrar: usuario y contraseña. Texto «Solo la administradora puede entrar.» y aviso de recuperación: «¿Olvidaste la contraseña? Usa los códigos de recuperación de tu sobre, o pide al programador que la cambie.»
3. Pantalla 02 · Código de 6 números: 6 casillas, «Confirmar», «Volver» y «Usar un código de recuperación». Sin el código no se entra al panel.
4. Diseño general: menú lateral (Inicio, Subir banco de preguntas, Capítulos, Publicar con el número de cambios pendientes, Seguridad; abajo la autora y «Salir»).
5. Pantalla 03 · Inicio: «Hola, [nombre]», avance del libro (barra por estados: publicados, listos, con advertencias, con errores, sin escribir, sobre 73 capítulos), versión que tienen los jugadores, cambios sin publicar, capítulos que necesitan atención y actividad reciente. Por ahora puede mostrar datos vacíos.
6. Registro de actividad: anota cada entrada al panel (fecha, hora, navegador).

Pruebas obligatorias, y dime el resultado de cada una:
- Un usuario distinto de la autora (créalo solo para probar y bórralo después) no puede leer ni cambiar nada.
- Sin el código de 6 números no se puede leer ni escribir nada.
- El registro está cerrado: no se puede crear una cuenta desde la página.
Detente al terminar.
```

# P2 · Banco de preguntas

```text
Fase P2 del panel. Imágenes: 04-subir-banco.png y 05-capitulos.png.

1. Pantalla 04 · Subir banco de preguntas: arrastrar el Excel. Usa el MISMO lector y validador del convertidor, con las mismas reglas de errores y advertencias.
   - Muestra el resultado por capítulo: preguntas, rondas 6·6·6·2, estado y qué encontró. Los capítulos que no cambiaron respecto de la versión publicada se agrupan en una sola fila.
   - Resumen arriba: sin cambios, nuevos y listos, con advertencias, con errores.
   - DIFERENCIA con el convertidor: un capítulo con errores NO bloquea el archivo entero. Se guarda como borrador con errores y no se puede publicar hasta corregirlo. Los capítulos con advertencias se guardan y se pueden publicar.
   - Botones «Cancelar» y «Guardar en el banco». Nada llega a los jugadores hasta publicar.
2. «Descargar el banco como Excel»: devuelve el banco actual con las mismas columnas del Excel de la autora, para que siempre tenga una copia.
3. Pantalla 05 · Capítulos: tabla con capítulo, título, estado (publicado, publicado con corrección pendiente, listo, con advertencias, borrador con errores, sin escribir), correctas A·B·C, si entra en celular con letra muy grande, y acciones («Vista previa» o «Corregir»). Filtros: Todos, Publicados, Listos, Con avisos. Los capítulos sin escribir se agrupan en una fila («15 a 73 · Sin escribir»).
4. Importa el Excel vigente (10 capítulos) como punto de partida y marca esos capítulos como «Publicado» en la versión que tienen hoy los jugadores.
5. Registro de actividad: «Subiste el banco de preguntas» con el nombre del archivo.

Prueba con el Excel real y con una copia donde un capítulo tenga 19 preguntas y una pregunta sin correcta. Detente al terminar.
```

# P3 · Revisión y vista previa

```text
Fase P3 del panel. Imagen: 06-vista-previa.png.

1. Pantalla 06 · Vista previa de un capítulo, con la etiqueta «Vista previa · solo para la autora».
   - A la izquierda, las 20 preguntas como casillas agrupadas por ronda, con el color de cada ronda. La actual se marca. Las corregidas y no publicadas llevan un marco morado.
   - Al centro, un celular de 360 px que muestra la pregunta con los MISMOS componentes del juego. Las opciones aparecen en el orden del Excel (sin mezclar) y la correcta va en verde con la etiqueta «CORRECTA».
   - A la derecha: Pantalla (Celular / PC), Tamaño de letra (Normal / Grande / Muy grande), la explicación y la cita, «Editar esta pregunta» y los botones para ir a la pregunta anterior y siguiente.
2. Prueba de tamaño: mide si la pregunta y las 3 opciones entran sin desplazar en 360 × 740 con cada tamaño de letra. Muestra cuántos px sobran o faltan. Guarda el resultado por capítulo para la columna de la pantalla 05.
3. Control de calidad automático por capítulo: preguntas repetidas en el libro, opciones demasiado largas (que no entren), la correcta en la misma letra más de 9 veces de 20, y citas bíblicas con formato raro. Son advertencias, no errores.
4. El avance del libro en Inicio ahora usa los datos reales.
Detente al terminar.
```

# P4 · Edición de preguntas

```text
Fase P4 del panel. Imagen: 07-editar-pregunta.png.

1. Pantalla 07 · Editar pregunta: capítulo, número, ronda y si está publicada.
   - Campos: pregunta (con contador de letras y aviso de si entra en celular con letra muy grande), las 3 opciones con un botón para marcar la correcta, explicación (se muestra al acertar) y cita bíblica.
   - Aviso: «En el juego las opciones se mezclan; la correcta se sigue por su texto.»
   - Recuadro «Qué cambió» con el texto de antes tachado y el de ahora resaltado.
   - Aviso: «Este cambio llega a los jugadores en la próxima publicación. Quienes ya aprobaron el capítulo conservan sus puntos y estrellas.»
   - Botones «Cancelar» y «Guardar cambios».
2. Al guardar se vuelve a validar el capítulo con las mismas reglas. Un capítulo con errores pasa a «listo» cuando se corrigen.
3. Las correcciones de capítulos publicados quedan como «corrección pendiente» hasta publicar.
4. Registro de actividad: «Corregiste una pregunta» con el capítulo, la pregunta y el campo.
Detente al terminar.
```

# P5 · Publicar con firma automática

```text
Fase P5 del panel. Imagen: 08-publicar.png. Esta fase toca también el juego.

1. Pantalla 08 · Publicar la versión N:
   - «Qué incluye»: capítulos nuevos, listos y correcciones, cada uno con una casilla (marcados por defecto). Los capítulos con advertencias aparecen sin marcar, y la autora decide si los incluye. Los capítulos con errores aparecen bloqueados, con un botón «Corregir».
   - «Mensaje para los jugadores» (opcional), que el juego muestra en su pantalla de inicio.
   - «Todo lo marcado pasó la revisión», el texto «Los jugadores reciben la versión N la próxima vez que abran Berea con internet. Su avance no se toca.» y el botón «Publicar versión N» con «Se firma automáticamente con la llave de Berea».
   - «Versiones publicadas»: la que tienen los jugadores y las anteriores, con «Volver a esta».
2. Publicar = una Edge Function que comprueba que quien llama es la autora con el código de 6 números verificado, arma contenido.bin con formato.ts, lo cifra y lo firma con la llave del servidor, y lo sube a Supabase Storage. Guarda la versión: número, fecha, capítulos, mensaje y código de comprobación (hash) del archivo.
3. «Volver a esta versión» vuelve a publicar ese archivo como versión nueva (por ejemplo, la 5 igual a la 3), para que el juego siempre avance de número.
4. Juego: cuando hay internet, busca si hay una versión nueva en Storage. Si la firma es válida, la guarda y la usa; si no hay internet, si Supabase falla o si la firma no es válida, sigue con la que tiene, sin mostrar errores al jugador. Nunca borra el avance. No envía ningún dato del jugador al buscar.
5. Registro: «Publicaste la versión N».

Pruebas obligatorias: publicar una versión nueva; volver a una anterior; un archivo con la firma alterada es rechazado por el juego; el juego sigue funcionando si Storage no responde; el avance de un perfil no cambia después de actualizar. Detente al terminar.
```

# P6 · Seguridad y sello de la autora

```text
Fase P6 del panel. Imágenes: 09-seguridad.png y 10-poner-sello.png.

1. Pantalla 09 · Seguridad:
   - «Tu acceso»: usuario, contraseña, código de 6 números (Activo) y códigos de recuperación. Cambiar el usuario o la contraseña y ver los códigos piden el sello.
   - «Llave de firma de Berea»: dónde está (caja fuerte de Supabase), copia de respaldo (en el pendrive) y última firma. Texto: «Firma sola cada vez que publicas. El juego de cada jugador rechaza el contenido que no lleve esta firma.»
   - «Acciones muy delicadas», con el texto «Cada una pide tu sello: el archivo especial de tu pendrive, distinto de la llave que firma al publicar.»: crear una llave de firma nueva; descargar la llave o una copia de todo; pasar el proyecto a otra persona; retirar el contenido publicado; borrar un libro o todo el banco. Las dos últimas en rojo suave.
2. Pantalla 10 · Poner el sello: ventana con «Pon tu sello para continuar», qué va a pasar en palabras simples, el aviso «Conecta el pendrive donde guardas tu sello. Es distinto de la llave que firma al publicar y solo sirve para estas acciones.», el botón «Poner mi sello», «Cancelar» y «Esta acción queda anotada en el registro con fecha y hora.» No hay huella ni otra opción.
3. Crear el sello (una sola vez, por terminal, como npm run claves:crear): un par de claves Ed25519 NUEVO y distinto de la llave de firma. La parte privada se guarda en un archivo (por ejemplo sello-de-la-autora.berea) que la autora copia a su pendrive; puede ir cifrado con una clave que ella elija. La parte pública se guarda en el servidor. Nunca se sube la parte privada.
4. El sello en el servidor: cada acción delicada es una Edge Function que exige, además de la sesión con código de 6 números, un desafío nuevo firmado con el sello (de un solo uso y que vence en pocos minutos). El panel lee el archivo del pendrive en el navegador, firma el desafío y lo envía; el archivo no sale de la computadora.
5. Registro de cada acción delicada, intentada o realizada.
6. Escribe docs/panel-guia.md para la autora, en palabras simples: cómo entrar, cómo publicar, cómo poner el sello, qué guardar en el sobre (contraseña, códigos de recuperación y una segunda copia del sello) y qué hacer si pierde el celular o el pendrive.

Pruebas obligatorias: cada acción delicada falla sin sello, falla con un sello distinto, falla con un desafío viejo o repetido, y funciona con el sello correcto. Detente al terminar.
```
