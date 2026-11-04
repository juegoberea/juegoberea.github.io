# Berea · Resumen del avance (3 de noviembre de 2026)

Te paso el estado del proyecto Berea para que me ayudes a **planificar un agregado nuevo** (al final del documento). El código lo está escribiendo Claude Code siguiendo los 9 encargos del documento «Berea · Encargos para Claude Code», una fase a la vez.

## Qué es Berea

Trivia sin internet para quienes leen la serie del Gran Conflicto de Elena G. de White (jóvenes de 15 a 20 años, sobre todo). Autora: Sharon Berrio. Eslogan: «Cada capítulo, un tesoro por descubrir.» Primera versión: *Patriarcas y Profetas* (73 capítulos; hoy hay 10 listos en el Excel, 200 preguntas), solo español, estilo Vibrante, varios perfiles por aparato.

Reglas principales: 20 preguntas por capítulo en 4 rondas (6 fáciles, 6 intermedias, 6 avanzadas, 2 de aplicación); 30 s por pregunta; se aprueba con 14; puntos por correcta 100 / 80 / 60 según el intento (3 / 2 / 1 estrellas); al fallar nunca se muestra la correcta; cerrar a mitad cuenta como intento; repetir un capítulo aprobado es práctica y no cambia nada; reflexión opcional al aprobar que va a «Mi diario».

## Tecnología

- Aplicación web instalable (PWA): Vite + TypeScript + Preact. Datos en IndexedDB. Sin cuentas, sin servidor, sin estadísticas: nada sale del aparato.
- Navegadores: Chrome 80+ (2020) en adelante. Prioridad: PC con Windows (Chrome y Edge) y Android sencillos o antiguos.
- Peso actual: el juego ~34 KB comprimido + 24 KB de preguntas + letra Nunito local (75 KB).
- Proyecto en `Escritorio\berea`. Todavía no hay repositorio git (se creará a nombre de la autora).

## Estado de las fases

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Proyecto base | ✅ Hecha |
| 2 | Convertidor del Excel | ✅ Hecha |
| 3 | Motor del juego y datos | ✅ Hecha |
| 4 | Tema Vibrante y componentes | ✅ Hecha |
| 5 | Pantallas 1–4 (bienvenida, perfiles, biblioteca, capítulos) | ✅ Hecha |
| 6 | Pantallas 5–7 (prepárate, preguntas, cambio de ronda) | ✅ Hecha |
| 7 | Pantallas 8–10 (resultado, resumen, reflexión) | ✅ Hecha |
| 8 | Pantallas 11–13 (Mi progreso y diario, Ajustes, Libro terminado) | ⏳ Siguiente |
| 9 | Sin internet, publicación en GitHub Pages, guías y pruebas finales | ⏳ Pendiente |

82 pruebas automáticas pasan. Además, cada fase con pantallas se comprobó jugando en el navegador (Edge) simulando un celular, con capturas comparadas contra los 19 diseños aprobados.

## Lo construido, en breve

- **Convertidor (Fase 2):** una sola página HTML que la autora abre con doble clic, sin instalar nada ni usar internet. Arrastra su clave de firma (una vez) y el Excel; la página revisa todo y avisa en español con capítulo y fila (pregunta sin correcta, letra inválida, capítulo sin 20 preguntas, rondas que no son 6/6/6/2, opciones vacías o repetidas, capítulo sin reflexión…). Si no hay errores, descarga `contenido.bin`: comprimido, cifrado (AES-GCM) y firmado (Ed25519). El juego rechaza cualquier archivo alterado. Con el Excel real salen 10 capítulos, 0 errores. Hay una guía paso a paso para la autora (`docs/como-actualizar-contenido.md`). Límite conocido: sin servidor, la clave de cifrado viaja en el juego; frena a un curioso, no a un experto.
- **Motor y datos (Fase 3):** mezcla de preguntas dentro de cada ronda y de opciones dentro de cada pregunta (la correcta se sigue por su texto); reloj que solo corre con la pregunta a la vista; puntos, estrellas e intentos; varios perfiles (nombre + 1 de 6 colores); avance por libro que nunca se borra al actualizar preguntas; diario; ajustes; copia de respaldo cifrada que además rechaza puntos inventados.
- **Tema y componentes (Fase 4):** todos los colores, letras, tamaños y animaciones aprobados como un «tema» intercambiable (preparado para el futuro estilo Solemne). Una prueba automática impide escribir colores a mano en las pantallas. Respeta «reducir movimiento» del aparato.
- **Pantallas 1 a 10 (Fases 5–7):** todas funcionando con datos reales. Requisito clave cumplido: en un celular de 360 × 740 con letra muy grande, se jugaron los 10 capítulos y **las 200 preguntas entran completas sin desplazar**.
- **Sonido:** la música del menú y los efectos cortos se generan con código (Web Audio), sin archivos: no pesan, funcionan sin internet y no necesitan licencia. La música viene apagada; nunca suena durante las preguntas; un botón silencia todo.

## Decisiones tomadas por el programador que conviene que la autora confirme

1. **Textos propuestos** (no venían en el encargo, todos en tono de ánimo):
   - Aviso de «Prepárate» en el 2.º intento: «Si apruebas en este intento, ganas un bono de +20 por respuesta…»; en el 3.º en adelante: «Cada intento te acerca. Tu constancia también cuenta…»; en práctica: «Practica todo lo que quieras: tus puntos y estrellas no cambian».
   - Frases de cada cambio de ronda (ej. ronda 1: «Empecemos por lo básico. ¡Tú puedes!»; ronda 4: «Lo que leíste, llevado a tu vida.»).
   - Tres mensajes de ánimo al fallar, que se alternan (ej. «No pasa nada: sigue adelante, aún quedan preguntas.»).
   - En el resultado no aprobado: «¡Casi!» si faltaron 4 o menos; «¡Buen intento!» si faltaron más.
2. **Práctica** (repetir un capítulo aprobado): durante el juego se muestran los puntos a 100 por correcta, pero no se guarda nada. ¿Prefiere otra escala o no mostrar puntos?
3. **La pantalla de cambio de ronda también aparece al empezar la ronda 1.**
4. **Recuperar una copia de respaldo reemplaza** el avance de ese mismo perfil en el aparato (se pedirá confirmación en Ajustes).
5. **Un capítulo a medio escribir en el Excel impide generar el archivo.** Mientras lo termina, puede tenerlo en otra hoja («Borradores»).

## Pendientes conocidos

- **Fase 8:** «Mi progreso» (datos, álbum de insignias, registro de intentos, Mi diario con «Guardar como archivo» e «Imprimir»), «Ajustes» (tamaño de letra, sonidos, música, estilo «Próximamente», cambiar perfil, copia de respaldo) y «¡Terminaste el libro!» con certificado.
- **Fase 9:** funcionamiento completo sin internet e instalación (Workbox), actualización de `contenido.bin` sin perder avance, publicación en GitHub Pages, guía «cómo publicar», revisión de licencias y comprobación final de los casos de prueba.
- Crear el repositorio git **a nombre de la autora**.
- La autora debe guardar una copia segura (pendrive) de su clave de firma `claves/berea-clave-de-firma.json`. Si se pierde, hay que crear otra y publicar una versión nueva del juego.
- Después de la Fase 9: pruebas con personas (2 PC con Windows, 2 Android —uno sencillo o antiguo— y 5 a 10 jóvenes).

## Lo nuevo que hay que planificar: «panel de administración» → vista previa en el convertidor

Se le preguntó a la autora si quería un panel de administración. Un panel clásico (ver jugadores, su avance o estadísticas) **no es posible** con las reglas del proyecto: necesitaría servidor y cuentas, y nada debe salir del aparato (además, son jóvenes: privacidad). Se le propuso en cambio una **vista previa dentro del convertidor**, y **la autora dijo que sí**.

Idea propuesta: al arrastrar el Excel en el convertidor (que solo existe en la PC de la autora, junto con su clave), poder ver cada capítulo tal como aparece en el juego —pregunta, 3 opciones con la correcta marcada, explicación, cita, ronda y reflexión—, incluso con «letra muy grande» y ancho de celular, para revisar el contenido antes de publicarlo sin tener que jugar los capítulos en orden.

**Te pido:**
1. Ayudarme a definir qué debe incluir exactamente la vista previa (qué ve, qué puede hacer, qué NO debe hacer).
2. Decidir cuándo hacerla: ¿antes de la Fase 8, entre la 8 y la 9, o después de la 9?
3. Redactar el encargo para Claude Code con el mismo formato que los anteriores (un bloque de texto que se pega, con lo que debe hacer y «Detente al terminar»).
4. Señalar las preguntas que todavía conviene hacerle a la autora.
