---
title: "Berea · Encargos para Claude Code"
date: "22 de octubre de 2026"
---

# Cómo usar estos encargos

Son 9 encargos, uno por fase: se pega uno, Claude Code trabaja y se detiene, tú revisas, y recién entonces pasas al siguiente. Todos se mandan en la misma conversación de Claude Code, para que recuerde lo anterior.

**Antes de empezar, en el repositorio `berea`:**

- `contenido/excel/Banco_Preguntas_Patriarcas_y_Profetas.xlsx` (imprescindible).
- `docs/especificaciones.pdf` y `docs/guia-pantallas.pdf` (recomendados).
- `docs/disenos/`: las 19 imágenes de las pantallas (archivo `disenos.zip`), con nombres como `06-pregunta.png`.

| Fase | Qué hace | Depende de | Adjuntar |
|---|---|---|---|
| 1 | Proyecto base | — | — |
| 2 | Convertidor del Excel | 1 | — |
| 3 | Motor y datos | 2 | — |
| 4 | Tema y componentes | 3 | Nada: los valores ya van en el encargo |
| 5 | Pantallas 1–4 | 4 | Imágenes 01, 02, 02b, 03, 04 |
| 6 | Pantallas 5–7 | 5 | Imágenes 05, 06, 06b, 06c, 06d, 06e, 07 |
| 7 | Pantallas 8–10 | 6 | Imágenes 08, 08b, 09, 10 |
| 8 | Pantallas 11–13 | 7 | Imágenes 11, 12, 13 |
| 9 | Sin internet y entrega | 8 | — |

Las fases 1 a 3 no dependen del diseño. Si una decisión cambia, anótala en `docs/plan.md` para que Claude Code la tenga presente.

# Fase 1 · Contexto, reglas y proyecto base

Deja el proyecto armado y con todas las reglas del juego explicadas; todavía sin lógica.

```text
Vamos a programar Berea, una trivia sin internet para quienes leen la serie del Gran Conflicto de Elena G. de White. Eslogan: «Cada capítulo, un tesoro por descubrir.» En docs/ están las especificaciones y la guía de pantallas; léelas primero. El Excel está en contenido/excel/ y las imágenes de los diseños aprobados en docs/disenos/.

Plataforma: PWA con Vite + TypeScript (Preact o JavaScript simple, liviano), IndexedDB para guardar datos y Workbox para funcionar sin internet. Prioridad: PC con Windows (Chrome y Edge) y celulares Android sencillos o antiguos. Sin cuentas, sin servidor, sin anuncios, sin estadísticas. Nada sale del aparato.

Reglas del juego (no las cambies sin preguntar):
- Capítulos en orden; el siguiente se desbloquea al aprobar el anterior.
- 20 preguntas en 4 rondas, en orden: 6 fáciles, 6 intermedias, 6 avanzadas, 2 de aplicación. Se mezclan las preguntas dentro de su ronda (las rondas no cambian de orden) y las 3 opciones dentro de cada pregunta. La correcta se sigue por su texto, no por la letra.
- Reloj de 30 s que arranca cuando aparece la pregunta. Si llega a 0: «Se acabó el tiempo», cuenta como incorrecta y no se muestra la correcta.
- Acierto: «Correcto», puntos, explicación y cita bíblica. Error: solo «Incorrecto», nunca la correcta.
- Al terminar: resumen de las 20 preguntas (correcta, incorrecta, sin respuesta), sin mostrar la clave.
- Se aprueba con 14 de 20. Puntos por correcta: 1.er intento 100 (3 estrellas), 2.º 80 (2 estrellas), 3.º en adelante 60 (1 estrella). Se guardan los puntos y estrellas del intento que aprobó y cuántos intentos necesitó. Máximo del libro: 146.000.
- Los puntos se muestran como bono, nunca como descuento.
- Intentos ilimitados y sin espera. Cerrar a mitad de capítulo pierde el intento y cuenta como intento.
- Un capítulo aprobado se puede repetir para practicar, sin cambiar sus puntos, estrellas ni registro.
- Al aprobar: reflexión opcional que se guarda en «Mi diario».

En este paso solo crea el proyecto base con esta estructura, sin lógica todavía:

berea/
├── README.md, LICENCIAS.md, .gitignore (incluye claves/)
├── docs/plan.md                (decisiones y dudas)
├── contenido/excel/ y contenido/publicado/
├── convertidor/
├── app/
│   ├── public/ (iconos, sonidos, musica)
│   └── src/
│       ├── motor/ contenido/ datos/ componentes/ temas/
│       ├── textos/es.json
│       └── pantallas/ 01-bienvenida 02-perfil 03-biblioteca 04-capitulos 05-antes-de-empezar 06-pregunta 07-cambio-de-ronda 08-resultado 09-resumen 10-reflexion 11-progreso-y-diario 12-ajustes 13-libro-terminado
└── pruebas/

Deja Vite, TypeScript y Vitest configurados y una página que diga «Berea» funcionando. LICENCIAS.md es una tabla: recurso, tipo, archivo, autor, licencia, enlace. Detente al terminar.
```

# Fase 2 · Convertidor del Excel

La herramienta con la que la autora convierte el Excel en el archivo del juego, sin programar. Se prueba con el Excel real: deben salir 10 capítulos sin errores.

```text
Ahora el convertidor (carpeta convertidor/): una página que la autora abre en su PC sin instalar nada. Arrastra el Excel y descarga contenido.bin.

Hojas del Excel:
- Banco: Libro, Capítulo, Título del capítulo, N.º, Ronda, Pregunta, Opción A, Opción B, Opción C, Correcta (A/B/C), Explicación, Cita. Ignora Revisado por, Fecha de revisión y Observaciones. La Ronda viene como «1 Fácil», «2 Intermedia», «3 Avanzada» o «4 Aplicación». Lee las columnas por nombre aceptando variantes: el encabezado real dice «Explicación (se muestra al aprobar)», pero la explicación se muestra al acertar cada pregunta.
- Reflexiones: Libro, Capítulo, Título del capítulo, Pregunta de reflexión.
- Control: ignórala.

El contenido debe admitir varios libros y varios idiomas: libro → idioma → capítulos → preguntas.

Avisos claros en español si hay: pregunta sin correcta o con letra inválida; capítulo con un número distinto de 20 preguntas; rondas que no sean 6/6/6/2; opciones vacías o repetidas; capítulo sin reflexión.

Protección: cifra el contenido (AES-GCM) y fírmalo (Ed25519). La clave privada de firma queda solo en la PC de la autora, en claves/ (excluida del repositorio). Documenta que, sin servidor, esto frena a un jugador curioso pero no a un experto.

Pruébalo con el Excel real: deben salir 10 capítulos sin errores. Escribe también docs/como-actualizar-contenido.md, paso a paso para alguien que no programa. Detente al terminar.
```

# Fase 3 · Motor del juego y datos

Toda la lógica del juego y lo que se guarda en el aparato, todavía sin pantallas y con pruebas automáticas.

```text
Ahora el motor (app/src/motor/) y los datos (app/src/datos/), todavía sin pantallas.

Motor: cargar y verificar contenido.bin (rechaza un archivo alterado); armar el intento con las mezclas; reloj de 30 s que no corre durante el cambio de ronda; corregir; calcular puntos, estrellas y aprobación según las reglas; registrar el «intento en curso» al empezar, para contar como perdido un intento que se cierra a mitad.

Datos en IndexedDB; pide navigator.storage.persist():
- Varios perfiles: nombre o apodo y uno de 6 colores de avatar. Sin fotos ni otros datos.
- Por perfil y por libro: capítulo actual; puntos, estrellas e intentos de cada capítulo aprobado; total; diario de reflexiones; ajustes (tamaño de letra en 3 niveles, sonidos, música del menú).
- Actualizar el contenido nunca borra el avance; si cambia una pregunta de un capítulo aprobado, se conservan sus puntos.
- Copia de respaldo: exportar e importar un archivo firmado que no se pueda modificar para inventar puntos.

Pruebas automáticas: aprobar en el 1.º, 2.º y 3.er intento (con sus puntos y estrellas); 13 correctas no aprueba; el reloj llega a 0; cerrar a mitad cuenta como intento; repetir un capítulo aprobado no cambia nada; un respaldo alterado es rechazado; un contenido alterado es rechazado. Detente al terminar.
```

# Fase 4 · Tema Vibrante y componentes

Pasa el sistema de diseño aprobado al código. Los valores ya van dentro del encargo.

```text
Estos son los valores del sistema de diseño «Berea», estilo Vibrante, aprobados por la autora. Créalos como tema en app/src/temas/vibrante.ts y exponlos como variables CSS. Ninguna pantalla escribe colores, fuentes ni tamaños directamente: todo sale del tema, porque después habrá un tema Solemne con los mismos nombres.

export const temaVibrante = {
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
  fuente: "'Nunito', 'Segoe UI', system-ui, sans-serif", // Google Fonts, pesos 500 700 800 900, licencia SIL OFL
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
};

Reglas del tema:
- La ronda Aplicación es la única con texto oscuro encima (onAplicacion); las otras rondas y los estados usan onColor.
- Durante cada ronda, el fondo de la pantalla de pregunta usa su tinte (facilSoft, intermediaSoft, avanzadaSoft, aplicacionSoft).
- Con «reducir movimiento» activo en el aparato: sin latidos ni confeti, solo cambios de color.

Crea los componentes en app/src/componentes/, siguiendo las imágenes de docs/disenos/: Botón (primario con borde inferior que se hunde 4 px al tocarlo; secundario), Opción A/B/C (esperando, correcta con check y «+100», incorrecta con «Incorrecto», atenuada), Reloj circular de 30 s, Estrellas, Insignia dentada con el número del capítulo, Avatar, Chip de ronda, Botón de silencio, Parada del mapa y Confeti. El reloj debe poder cambiarse por tema (el Solemne usará una línea dorada).

Los 3 tamaños de letra se cambian desde los ajustes del perfil. Todos los textos van en app/src/textos/es.json. Detente al terminar.
```

# Fase 5 · Pantallas de entrada (1 a 4)

Imágenes: 01-bienvenida, 02-perfil, 02b-crear-perfil, 03-biblioteca, 04-capitulos.

```text
Construye las pantallas 1 a 4 igual que los diseños aprobados de docs/disenos/ (celular 390 px; en PC el contenido se centra con ancho máximo 560 px):

1. 01-bienvenida: logo grande, «Berea», eslogan «Cada capítulo, un tesoro por descubrir.», Hechos 17:11 en una tarjeta («Recibieron la palabra con toda solicitud, escudriñando cada día las Escrituras.»), botón «Entrar» que late, botón de silencio arriba a la derecha.
2. 02-perfil: tarjetas de los perfiles del aparato (avatar de color con la inicial, nombre, capítulo actual, puntos y estrellas) y botón «Nuevo jugador». Vista de crear perfil: avatar grande, campo «Tu nombre o apodo», 6 colores a elegir y «Crear y empezar».
3. 03-biblioteca: los 5 libros como islas unidas por un camino punteado. Patriarcas y Profetas disponible con su avance («3 de 73 capítulos»); Profetas y Reyes, El Deseado de todas las gentes, Los Hechos de los Apóstoles y El Conflicto de los Siglos con «Próximamente». Arriba: perfil (toca para cambiar), Ajustes y silencio.
4. 04-capitulos: arriba, el puntaje del libro con barra («4.500 de 146.000 puntos») y estrellas («6 de 219»). Debajo, un camino en zigzag con una parada por capítulo: aprobada (número, estrellas, puntaje e intento), disponible (brilla, con «¡Te toca!») o bloqueada (candado). Botón flotante «Mi progreso».

Conéctalas con los datos reales del motor. Música opcional solo en estas pantallas de menú. Detente al terminar.
```

# Fase 6 · La trivia (5 a 7)

La parte más importante. Imágenes: 05-antes-de-empezar, 06-pregunta, 06b-correcto, 06c-incorrecto, 06d-se-acabo-el-tiempo, 06e-letra-muy-grande, 07-cambio-de-ronda.

```text
Construye la trivia igual que los diseños aprobados de docs/disenos/:

5. 05-antes-de-empezar: «¡Prepárate!» con rebote, «Capítulo N» y su título, «¿Ya leíste el capítulo? Responde sin mirar el libro.», las reglas en dos líneas con íconos (20 preguntas, 30 segundos cada una; apruebas con 14 correctas), el aviso «Si apruebas a la primera, ganas el bono completo. ¡Lee con calma antes de empezar!», y los botones «Empezar» y «Volver». «Empezar» crea el intento en curso.

6. 06-pregunta: arriba, chip de ronda, silencio y reloj circular; debajo, «Pregunta X de 20», los puntos acumulados y una barra de 20 segmentos con el color de cada ronda. Luego la pregunta y 3 tarjetas grandes A, B, C. El fondo usa el tinte de la ronda. Estados:
   - esperando: el reloj corre;
   - correcto (6b): la opción en verde con check y «+100» (o +80/+60 según el intento), las otras atenuadas, caja «¡Correcto!» con la explicación y la cita, reloj detenido, botón «Siguiente»;
   - incorrecto (6c): la opción en rojo con «Incorrecto», las otras atenuadas, un mensaje de ánimo, botón «Siguiente». NUNCA se muestra cuál era la correcta;
   - se acabó el tiempo (6d): reloj en 0, opciones atenuadas, aviso gris «Se acabó el tiempo · Pasamos a la siguiente pregunta». Sin mostrar la correcta.
   El reloj de la siguiente pregunta arranca recién cuando aparece. En los últimos 5 segundos el reloj pasa a rojo y late.

7. 07-cambio-de-ronda: pantalla completa del color de la nueva ronda, número grande, «Ronda 3 · Preguntas avanzadas», una frase de ánimo, los puntos acumulados y el avance de las 4 rondas. Dura 2,5 s, sin botones; el reloj no corre.

OBLIGATORIO (diseño 6e): en un celular de 360 × 740 px, la pregunta y las 3 opciones se ven completas sin desplazar con la letra muy grande. Compruébalo con la pregunta más larga del Excel (capítulo 9: «Si alguien te dice que la creación duró millones de años…»).

Sin música durante las preguntas. Detente al terminar.
```

# Fase 7 · Final del capítulo (8 a 10)

Imágenes: 08-resultado-aprobado, 08b-resultado-no-aprobado, 09-resumen, 10-reflexion.

```text
Construye el final del capítulo igual que los diseños aprobados de docs/disenos/:

8. 08-resultado, aprobado: confeti, la insignia del capítulo que brilla, «¡Aprobaste!», el capítulo, las estrellas apareciendo una por una, tres datos (puntos · correctas · intento) y el mensaje de bono según el intento:
   - 1.er intento: «¡Aprobaste a la primera! Bono de primer intento: +40 por respuesta»
   - 2.º intento: «Bono de segundo intento: +20 por respuesta»
   - 3.º o más: «¡Lo lograste! Tu constancia también cuenta»
   Botones «Siguiente capítulo», «Escribir mi reflexión» y «Ver resumen». Al aprobar se desbloquea el siguiente capítulo.

8b. 08-resultado, no aprobado: «¡Casi! Lee otra vez y vuelve. Te faltaron N respuestas.», correctas sobre 20 con la meta de 14 marcada en la barra, y el aviso de que en el nuevo intento cambia el orden de preguntas y opciones. Botones «Volver a los capítulos» y «Ver resumen».

9. 09-resumen: las 20 preguntas como tarjetas agrupadas por ronda: verde (correcta), rojo suave (incorrecta) y gris punteado (sin respuesta). Al tocar una, se da vuelta y muestra el texto de su pregunta y su estado. NUNCA muestra la opción correcta.

10. 10-reflexion: fondo lila, lápiz animado, la pregunta de reflexión del capítulo y una libreta con renglones para escribir. Texto: «No da puntos y solo tú la lees. Se guarda en «Mi diario».» Botones «Saltar» y «Guardar en mi diario».

Detente al terminar.
```

# Fase 8 · Progreso, Ajustes y Libro terminado (11 a 13)

Imágenes: 11-progreso-y-diario, 12-ajustes, 13-libro-terminado.

```text
Construye las últimas pantallas igual que los diseños aprobados de docs/disenos/:

11. 11-progreso-y-diario: tres datos arriba (capítulos aprobados de 73, puntos, estrellas); álbum de insignias (ganadas en dorado, por ganar apagadas); registro de intentos, por ejemplo «Cap. 1 · 1.er intento · ★★★ 1.900»; tarjeta «Mi diario» con la última reflexión y los botones «Guardar como archivo» e «Imprimir» (el diario completo, ordenado por capítulo).

12. 12-ajustes: tamaño de letra en 3 niveles (Normal, Grande, Muy grande) con vista previa; interruptores de Sonidos y Música del menú («Nunca suena durante las preguntas»); «Estilo» deshabilitado con «Próximamente» (llegará con el Solemne); «Cambiar de perfil»; «Copia de respaldo» con «Guardar copia» y «Recuperar copia».

13. 13-libro-terminado: confeti, una gran insignia, «¡Terminaste el libro!», y un certificado con el logo, el nombre del jugador, «por completar Patriarcas y Profetas, capítulo por capítulo», los puntos del libro sobre 146.000, las estrellas sobre 219 y la fecha. Botones «Guardar certificado», «Imprimir» y «Ver mi diario completo».

Detente al terminar.
```

# Fase 9 · Sin internet, publicación, guías y pruebas

Deja el juego instalable, publicado y listo para entregar a la autora.

```text
Último paso:
1. Que el juego se instale en PC y celular y funcione completamente sin internet, incluidos sonidos, imágenes y la fuente Nunito.
2. Que, cuando haya internet, descargue un contenido.bin nuevo sin borrar el avance de ningún perfil.
3. Prepara la publicación en GitHub Pages.
4. Escribe docs/como-publicar.md: cómo publicar una versión nueva, para alguien que no programa. Revisa que docs/como-actualizar-contenido.md siga al día.
5. Revisa que LICENCIAS.md tenga cada sonido, música, imagen y fuente usada, con su licencia.
6. Comprueba estos casos y dime el resultado de cada uno: el reloj llega a 0; se cierra el juego a mitad de capítulo; se aprueba en el 1.º, 2.º y 3.er intento; se actualiza el contenido sin perder avance; se guarda y recupera la copia de respaldo; la pregunta más larga entra sin desplazar en 360 px con letra muy grande.
```

Después de esta fase quedan las pruebas con personas: 2 PC con Windows, 2 celulares Android (uno sencillo o antiguo) y un grupo de 5 a 10 jóvenes que lean los capítulos y jueguen.
