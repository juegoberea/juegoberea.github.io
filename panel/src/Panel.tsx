// El panel: primero los pasos para entrar; adentro, el marco con la pantalla de la dirección (#/inicio…).

import { useCallback, useEffect, useState } from 'preact/hooks';
import { leerDatos, type DatosPanel } from './datos';
import { resumenLibro } from './estados';
import { Marco } from './Marco';
import { Activar, Codigo, CodigosNuevos, Entrar, Recuperar } from './pantallas/Acceso';
import { Capitulos } from './pantallas/Capitulos';
import { EditarPregunta } from './pantallas/EditarPregunta';
import { Inicio } from './pantallas/Inicio';
import { Publicar } from './pantallas/Publicar';
import { Seguridad } from './pantallas/Seguridad';
import { SubirBanco } from './pantallas/SubirBanco';
import { VistaPrevia } from './pantallas/VistaPrevia';
import { leerRutaPanel, seccionDe, type RutaPanel } from './rutas';
import { faseActual, mensajeDeError, salir, type Autora, type Fase } from './sesion';
import { configurado } from './supabase';
import { t } from './textos';

function Pantalla({ ruta, autora, datos, recargar }: { ruta: RutaPanel; autora: Autora; datos: DatosPanel; recargar: () => void }) {
  const ir = (hash: string) => (location.hash = hash);
  switch (ruta.pantalla) {
    case 'inicio':
      return <Inicio autora={autora} datos={datos} />;
    case 'subir':
      return <SubirBanco libro={datos.libro} alGuardar={() => { recargar(); ir('#/capitulos'); }} />;
    case 'capitulos':
      return <Capitulos libro={datos.libro} />;
    case 'vista':
      return <VistaPrevia key={ruta.capitulo} libro={datos.libro} numero={ruta.capitulo} posicion={ruta.posicion} />;
    case 'editar':
      return <EditarPregunta key={`${ruta.capitulo}-${ruta.orden}`} libro={datos.libro} numero={ruta.capitulo} orden={ruta.orden} alGuardar={(p) => { recargar(); ir(`#/capitulo/${ruta.capitulo}/pregunta/${p}`); }} />;
    case 'publicar':
      return <Publicar libro={datos.libro} alPublicar={recargar} />;
    case 'seguridad':
      return <Seguridad autora={autora} />;
  }
}

export function Panel() {
  const [fase, setFase] = useState<Fase>(configurado ? { fase: 'cargando' } : { fase: 'fuera', error: t('errores.configuracion') });
  const [ruta, setRuta] = useState<RutaPanel>(() => leerRutaPanel(location.hash));
  const [datos, setDatos] = useState<DatosPanel | null>(null);
  const [errorDatos, setErrorDatos] = useState('');

  const seguir = useCallback(async (paso: () => Promise<Fase>) => {
    try {
      setFase(await paso());
    } catch (e) {
      setFase({ fase: 'fuera', error: mensajeDeError(e) });
    }
  }, []);

  useEffect(() => {
    if (configurado) seguir(faseActual);
  }, [seguir]);

  useEffect(() => {
    const alCambiar = () => {
      setRuta(leerRutaPanel(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const recargar = useCallback(() => {
    leerDatos().then(setDatos, (e) => setErrorDatos(mensajeDeError(e)));
  }, []);

  // Adentro: los datos del resumen (menú e Inicio) se leen al entrar y al volver a Inicio.
  const adentro = fase.fase === 'dentro';
  useEffect(() => {
    if (adentro && (!datos || ruta.pantalla === 'inicio')) recargar();
  }, [adentro, ruta.pantalla]);

  switch (fase.fase) {
    case 'cargando':
      return <main class="acceso"><p class="aviso-carga">{t('inicio.cargando')}</p></main>;
    case 'fuera':
      return <Entrar fase={fase} seguir={seguir} />;
    case 'codigo':
      return <Codigo fase={fase} seguir={seguir} alRecuperar={() => setFase({ fase: 'recuperar' })} />;
    case 'activar':
      return <Activar fase={fase} seguir={seguir} />;
    case 'recuperar':
      return <Recuperar fase={fase} seguir={seguir} alVolver={() => seguir(faseActual)} />;
    case 'codigos':
      return <CodigosNuevos codigos={fase.codigos} alTerminar={() => setFase({ fase: 'dentro', autora: fase.autora })} />;
    case 'dentro': {
      const cambios = datos ? resumenLibro(datos.capitulos, datos.libro.total_capitulos).cambios : 0;
      return (
        <Marco seccion={seccionDe(ruta)} autora={fase.autora} cambios={cambios} alSalir={() => seguir(salir)}>
          {errorDatos ? <p class="note err" role="alert">{errorDatos}</p>
            : !datos ? <p class="aviso-carga">{t('inicio.cargando')}</p>
            : <Pantalla ruta={ruta} autora={fase.autora} datos={datos} recargar={recargar} />}
        </Marco>
      );
    }
  }
}
