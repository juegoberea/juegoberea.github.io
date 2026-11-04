// Elige la pantalla según la ruta y maneja la música de los menús.

import { lazy, Suspense } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { Bienvenida } from '../pantallas/01-bienvenida/Bienvenida';
import { CrearPerfil } from '../pantallas/02-perfil/CrearPerfil';
import { Perfiles } from '../pantallas/02-perfil/Perfiles';
import { Biblioteca } from '../pantallas/03-biblioteca/Biblioteca';
import { Capitulos } from '../pantallas/04-capitulos/Capitulos';
import { AntesDeEmpezar } from '../pantallas/05-antes-de-empezar/AntesDeEmpezar';
import { Jugar } from '../pantallas/06-pregunta/Jugar';
import { Resultado } from '../pantallas/08-resultado/Resultado';
import { Resumen } from '../pantallas/09-resumen/Resumen';
import { Reflexion } from '../pantallas/10-reflexion/Reflexion';
import { Diario } from '../pantallas/11-progreso-y-diario/Diario';
import { Progreso } from '../pantallas/11-progreso-y-diario/Progreso';
import { Ajustes } from '../pantallas/12-ajustes/Ajustes';
import { LibroTerminado } from '../pantallas/13-libro-terminado/LibroTerminado';
import '../pantallas/comun.css';
import { musicaDelMenu } from '../sonido/musica';
import { t } from '../textos';
import { useApp } from './estado';
import { esMenu } from './rutas';

// El catálogo de componentes solo existe mientras se programa; no va en la versión publicada.
const Catalogo = import.meta.env.DEV ? lazy(() => import('../catalogo/Catalogo').then((m) => ({ default: m.Catalogo }))) : null;

function Pantalla() {
  const { ruta, errorDatos } = useApp();

  if (errorDatos) {
    return (
      <main class="contenedor pantalla">
        <h1 class="t-titulo pantalla__titulo">{t('errores.titulo')}</h1>
        <p>{t('errores.datos')}</p>
      </main>
    );
  }

  switch (ruta.pantalla) {
    case 'bienvenida':
      return <Bienvenida />;
    case 'perfiles':
      return <Perfiles />;
    case 'perfil-nuevo':
      return <CrearPerfil />;
    case 'biblioteca':
      return <Biblioteca />;
    case 'capitulos':
      return <Capitulos key={ruta.libro} libroId={ruta.libro} />;
    case 'capitulo':
      return <AntesDeEmpezar key={`${ruta.libro}-${ruta.numero}`} libroId={ruta.libro} numero={ruta.numero} />;
    case 'jugar':
      return <Jugar key={`${ruta.libro}-${ruta.numero}`} libroId={ruta.libro} numero={ruta.numero} />;
    case 'resultado':
      return <Resultado key={`${ruta.libro}-${ruta.numero}`} libroId={ruta.libro} numero={ruta.numero} />;
    case 'resumen':
      return <Resumen key={`${ruta.libro}-${ruta.numero}`} libroId={ruta.libro} numero={ruta.numero} />;
    case 'reflexion':
      return <Reflexion key={`${ruta.libro}-${ruta.numero}`} libroId={ruta.libro} numero={ruta.numero} />;
    case 'terminado':
      return <LibroTerminado key={ruta.libro} libroId={ruta.libro} />;
    case 'diario':
      return <Diario key={ruta.libro} libroId={ruta.libro} />;
    case 'progreso':
      return <Progreso key={ruta.libro} libroId={ruta.libro} />;
    case 'ajustes':
      return <Ajustes />;
    case 'catalogo':
      return Catalogo ? (
        <Suspense fallback={null}>
          <Catalogo />
        </Suspense>
      ) : (
        <Bienvenida />
      );
  }
}

export function App() {
  const { ruta, perfil, silenciado } = useApp();

  // Música opcional solo en los menús, si el perfil la activó y no está todo silenciado.
  const sonar = esMenu(ruta) && Boolean(perfil?.ajustes.musica) && !silenciado;
  useEffect(() => musicaDelMenu(sonar), [sonar]);

  return <Pantalla />;
}
