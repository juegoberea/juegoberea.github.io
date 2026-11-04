// Estado compartido del juego: base de datos, contenido, perfil elegido, silencio y ruta.

import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { SERIE } from '../contenido/libros';
import type { Contenido } from '../contenido/tipos';
import { Datos } from '../datos/base';
import type { Perfil } from '../datos/tipos';
import { descartarIntentoInterrumpido, type ResultadoCapitulo } from '../motor/capitulo';
import type { Partida } from '../motor/partida';
import { almacenNavegador, buscarContenidoNuevo, contenidoInicial } from '../motor/actualizar-contenido';
import { ErrorContenido } from '../motor/cargar-contenido';
import { aplicarTema } from '../temas/aplicar';
import { useTema } from '../temas/contexto';
import { escribirRuta, leerRuta, necesitaPerfil, type Ruta } from './rutas';

const GUARDADO_SILENCIO = 'berea-silencio';

export type ErrorCarga = 'red' | 'alterado' | null;

export interface EstadoApp {
  datos: Datos | null;
  errorDatos: boolean;
  contenido: Contenido | null;
  errorContenido: ErrorCarga;
  perfil: Perfil | null;
  elegirPerfil: (perfil: Perfil) => Promise<void>;
  /** Refleja en pantalla un perfil que cambió (ajustes, copia recuperada). */
  actualizarPerfil: (perfil: Perfil) => void;
  silenciado: boolean;
  cambiarSilencio: (silenciado: boolean) => void;
  /** true si pueden sonar los efectos (sonidos encendidos en el perfil y sin silencio). */
  sonidos: boolean;
  /** La partida en juego (entre «Empezar» y el resultado). */
  juego: { libro: string; partida: Partida } | null;
  setJuego: (juego: { libro: string; partida: Partida } | null) => void;
  /** El resultado del último capítulo terminado, para las pantallas de resultado y resumen. */
  resultado: { libro: string; numero: number; datos: ResultadoCapitulo } | null;
  setResultado: (resultado: { libro: string; numero: number; datos: ResultadoCapitulo } | null) => void;
  ruta: Ruta;
  ir: (ruta: Ruta, opciones?: { reemplazar?: boolean }) => void;
  volver: (siNoHay: Ruta) => void;
}

const ContextoApp = createContext<EstadoApp | null>(null);

export function useApp(): EstadoApp {
  const estado = useContext(ContextoApp);
  if (!estado) throw new Error('useApp debe usarse dentro de <ProveedorApp>.');
  return estado;
}

function leerSilencio(): boolean {
  try {
    return localStorage.getItem(GUARDADO_SILENCIO) === '1';
  } catch {
    return false;
  }
}

export function ProveedorApp({ children }: { children: ComponentChildren }) {
  const tema = useTema();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [errorDatos, setErrorDatos] = useState(false);
  const [contenido, setContenido] = useState<Contenido | null>(null);
  const [contenidoNuevo, setContenidoNuevo] = useState<Contenido | null>(null);
  const [errorContenido, setErrorContenido] = useState<ErrorCarga>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [silenciado, setSilenciado] = useState(leerSilencio);
  const [ruta, setRuta] = useState<Ruta>(() => leerRuta(location.hash));
  const [juego, setJuego] = useState<EstadoApp['juego']>(null);
  const [resultado, setResultado] = useState<EstadoApp['resultado']>(null);

  useEffect(() => {
    Datos.abrir()
      .then(setDatos)
      .catch(() => setErrorDatos(true));
    const almacen = almacenNavegador();
    const url = new URL('contenido.bin', document.baseURI);
    contenidoInicial(almacen, url.href)
      .then((inicial) => {
        setContenido(inicial);
        // Con internet, se busca una versión nueva (con otra dirección, para saltar la caché):
        // en Supabase Storage si se publicó desde el panel; si no, en el mismo sitio del juego.
        const busqueda = new URL(import.meta.env.VITE_URL_CONTENIDO || url.href, document.baseURI);
        busqueda.searchParams.set('buscar', String(Date.now()));
        return buscarContenidoNuevo(inicial, almacen, busqueda.href);
      })
      .then((nuevo) => {
        if (nuevo) setContenidoNuevo(nuevo);
      })
      .catch((e) => setErrorContenido(e instanceof ErrorContenido && e.motivo === 'alterado' ? 'alterado' : 'red'));
  }, []);

  // El contenido nuevo se aplica fuera de una partida, para no cambiar preguntas a mitad.
  useEffect(() => {
    if (contenidoNuevo && !juego) {
      setContenido(contenidoNuevo);
      setContenidoNuevo(null);
    }
  }, [contenidoNuevo, juego]);

  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta(location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  // Cada entrada del historial guarda cuántas pantallas del juego hay detrás de ella.
  const profundidad = () => (history.state as { n?: number } | null)?.n ?? 0;

  const ir = useCallback((destino: Ruta, opciones?: { reemplazar?: boolean }) => {
    const hash = escribirRuta(destino);
    if (opciones?.reemplazar) history.replaceState({ n: profundidad() }, '', hash);
    else if (location.hash !== hash) history.pushState({ n: profundidad() + 1 }, '', hash);
    setRuta(destino);
    window.scrollTo(0, 0);
  }, []);

  /** Vuelve a la pantalla anterior del juego; si se entró directo a esta, va a `siNoHay`. */
  const volver = useCallback(
    (siNoHay: Ruta) => {
      if (profundidad() > 0) history.back();
      else ir(siNoHay, { reemplazar: true });
    },
    [ir],
  );

  // Sin perfil elegido (por ejemplo, al recargar la página) se vuelve a elegir quién juega.
  useEffect(() => {
    if (!perfil && necesitaPerfil(ruta)) ir({ pantalla: 'perfiles' }, { reemplazar: true });
  }, [perfil, ruta, ir]);

  const elegirPerfil = useCallback(
    async (elegido: Perfil) => {
      aplicarTema(tema, elegido.ajustes.letra);
      setPerfil(elegido);
      // Un intento que quedó a medias (se cerró el juego) ya se contó: se descarta.
      if (datos) for (const libro of SERIE) await descartarIntentoInterrumpido(datos, elegido.id, libro.id);
    },
    [datos, tema],
  );

  const actualizarPerfil = useCallback(
    (cambiado: Perfil) => {
      aplicarTema(tema, cambiado.ajustes.letra);
      setPerfil(cambiado);
    },
    [tema],
  );

  const cambiarSilencio = useCallback((valor: boolean) => {
    setSilenciado(valor);
    try {
      localStorage.setItem(GUARDADO_SILENCIO, valor ? '1' : '0');
    } catch {
      // Sin almacenamiento: dura hasta cerrar el juego.
    }
  }, []);

  const sonidos = !silenciado && perfil?.ajustes.sonidos !== false;

  const estado = useMemo<EstadoApp>(
    () => ({
      datos, errorDatos, contenido, errorContenido, perfil, elegirPerfil, actualizarPerfil, silenciado, cambiarSilencio, sonidos,
      juego, setJuego, resultado, setResultado, ruta, ir, volver,
    }),
    [datos, errorDatos, contenido, errorContenido, perfil, elegirPerfil, actualizarPerfil, silenciado, cambiarSilencio, sonidos, juego, resultado, ruta, ir, volver],
  );
  return <ContextoApp.Provider value={estado}>{children}</ContextoApp.Provider>;
}
