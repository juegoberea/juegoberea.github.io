// Rutas del juego en la dirección de la página (#/biblioteca, #/libro/…), así el botón
// «Atrás» del celular y del navegador funciona como se espera.

export type Ruta =
  | { pantalla: 'bienvenida' }
  | { pantalla: 'perfiles' }
  | { pantalla: 'perfil-nuevo' }
  | { pantalla: 'biblioteca' }
  | { pantalla: 'capitulos'; libro: string }
  /** 05 · Antes de empezar */
  | { pantalla: 'capitulo'; libro: string; numero: number }
  /** 06 y 07 · Preguntas y cambios de ronda */
  | { pantalla: 'jugar'; libro: string; numero: number }
  /** 08 · Resultado del capítulo */
  | { pantalla: 'resultado'; libro: string; numero: number }
  /** 09 · Resumen de las 20 preguntas */
  | { pantalla: 'resumen'; libro: string; numero: number }
  /** 10 · Reflexión */
  | { pantalla: 'reflexion'; libro: string; numero: number }
  /** 13 · Libro terminado */
  | { pantalla: 'terminado'; libro: string }
  | { pantalla: 'progreso'; libro: string }
  /** 11 · Mi diario completo (todas las reflexiones del libro) */
  | { pantalla: 'diario'; libro: string }
  | { pantalla: 'ajustes' }
  | { pantalla: 'catalogo' };

/** Pantallas que necesitan un perfil elegido. */
export function necesitaPerfil(ruta: Ruta): boolean {
  return !['bienvenida', 'perfiles', 'perfil-nuevo', 'catalogo'].includes(ruta.pantalla);
}

/** Pantallas de menú: las únicas donde puede sonar la música. */
export function esMenu(ruta: Ruta): boolean {
  return ['bienvenida', 'perfiles', 'perfil-nuevo', 'biblioteca', 'capitulos', 'progreso', 'diario', 'ajustes'].includes(ruta.pantalla);
}

export function leerRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c, d] = partes;
  if (a === 'perfiles') return b === 'nuevo' ? { pantalla: 'perfil-nuevo' } : { pantalla: 'perfiles' };
  if (a === 'biblioteca') return { pantalla: 'biblioteca' };
  if (a === 'ajustes') return { pantalla: 'ajustes' };
  if (a === 'catalogo') return { pantalla: 'catalogo' };
  if (a === 'libro' && b) {
    if (c === 'capitulo' && Number(d) >= 1) {
      const numero = Math.floor(Number(d));
      if (partes[4] === 'jugar') return { pantalla: 'jugar', libro: b, numero };
      if (partes[4] === 'resultado') return { pantalla: 'resultado', libro: b, numero };
      if (partes[4] === 'resumen') return { pantalla: 'resumen', libro: b, numero };
      if (partes[4] === 'reflexion') return { pantalla: 'reflexion', libro: b, numero };
      return { pantalla: 'capitulo', libro: b, numero };
    }
    if (c === 'progreso') return { pantalla: 'progreso', libro: b };
    if (c === 'terminado') return { pantalla: 'terminado', libro: b };
    if (c === 'diario') return { pantalla: 'diario', libro: b };
    return { pantalla: 'capitulos', libro: b };
  }
  return { pantalla: 'bienvenida' };
}

export function escribirRuta(ruta: Ruta): string {
  switch (ruta.pantalla) {
    case 'bienvenida':
      return '#/';
    case 'perfiles':
      return '#/perfiles';
    case 'perfil-nuevo':
      return '#/perfiles/nuevo';
    case 'biblioteca':
      return '#/biblioteca';
    case 'capitulos':
      return `#/libro/${encodeURIComponent(ruta.libro)}`;
    case 'capitulo':
      return `#/libro/${encodeURIComponent(ruta.libro)}/capitulo/${ruta.numero}`;
    case 'jugar':
      return `#/libro/${encodeURIComponent(ruta.libro)}/capitulo/${ruta.numero}/jugar`;
    case 'resultado':
      return `#/libro/${encodeURIComponent(ruta.libro)}/capitulo/${ruta.numero}/resultado`;
    case 'resumen':
      return `#/libro/${encodeURIComponent(ruta.libro)}/capitulo/${ruta.numero}/resumen`;
    case 'reflexion':
      return `#/libro/${encodeURIComponent(ruta.libro)}/capitulo/${ruta.numero}/reflexion`;
    case 'terminado':
      return `#/libro/${encodeURIComponent(ruta.libro)}/terminado`;
    case 'diario':
      return `#/libro/${encodeURIComponent(ruta.libro)}/diario`;
    case 'progreso':
      return `#/libro/${encodeURIComponent(ruta.libro)}/progreso`;
    case 'ajustes':
      return '#/ajustes';
    case 'catalogo':
      return '#/catalogo';
  }
}
