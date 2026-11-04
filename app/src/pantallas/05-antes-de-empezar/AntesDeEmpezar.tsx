// Pantalla 5 · ¡Prepárate!: el capítulo, las reglas, el aviso del bono y «Empezar».
// «Empezar» crea el intento en curso: desde ese momento el intento cuenta.

import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Boton, BotonIcono, BotonSilencio, IconoAtras, IconoCheck, IconoCronometro, IconoLibro } from '../../componentes';
import { capituloDisponible } from '../../datos/progreso';
import type { ProgresoLibro } from '../../datos/tipos';
import { empezarCapitulo } from '../../motor/capitulo';
import { buscarCapitulo } from '../../motor/cargar-contenido';
import { sonar } from '../../sonido/efectos';
import { t } from '../../textos';
import './antes.css';

function avisoDelIntento(progreso: ProgresoLibro, numero: number): string {
  const estado = progreso.capitulos[numero];
  if (estado?.aprobado) return t('antes.practica');
  const intento = (estado?.intentos ?? 0) + 1;
  if (intento === 1) return t('antes.bonoPrimero');
  if (intento === 2) return t('antes.bonoSegundo');
  return t('antes.bonoTercero');
}

export function AntesDeEmpezar({ libroId, numero }: { libroId: string; numero: number }) {
  const { datos, contenido, perfil, silenciado, cambiarSilencio, sonidos, ir, volver, setJuego } = useApp();
  const [progreso, setProgreso] = useState<ProgresoLibro | null>(null);
  const [empezando, setEmpezando] = useState(false);
  const capitulo = contenido ? buscarCapitulo(contenido, libroId, numero) : undefined;

  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    datos.obtenerProgreso(perfil.id, libroId).then((p) => vigente && setProgreso(p));
    return () => {
      vigente = false;
    };
  }, [datos, perfil, libroId]);

  const atras = () => volver({ pantalla: 'capitulos', libro: libroId });

  async function empezar() {
    if (!datos || !perfil || !capitulo || empezando) return;
    setEmpezando(true);
    sonar('toque', sonidos);
    try {
      const partida = await empezarCapitulo(datos, perfil.id, libroId, capitulo);
      setJuego({ libro: libroId, partida });
      // Reemplaza esta pantalla: «Atrás» desde las preguntas vuelve al mapa de capítulos.
      ir({ pantalla: 'jugar', libro: libroId, numero }, { reemplazar: true });
    } finally {
      setEmpezando(false);
    }
  }

  const disponible = capitulo && progreso && capituloDisponible(progreso, numero);

  return (
    <main class="contenedor pantalla antes">
      <div class="pantalla__barra">
        <BotonIcono etiqueta={t('componentes.atras')} onClick={atras}>
          <IconoAtras />
        </BotonIcono>
        <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
      </div>

      {contenido && progreso && !disponible && <p class="aviso-carga">{t('antes.noExiste')}</p>}

      {capitulo && progreso && disponible && (
        <>
          <div class="antes__encabezado">
            <span class="antes__preparate">{t('antes.preparate')}</span>
            <span class="antes__capitulo t-etiqueta">{t('antes.capitulo', { n: numero })}</span>
            <h1 class="antes__titulo">{capitulo.titulo}</h1>
          </div>

          <div class="tarjeta antes__leiste">
            <span class="antes__icono-libro" aria-hidden="true">
              <IconoLibro tamano={30} />
            </span>
            <p>{t('antes.leiste')}</p>
          </div>

          <ul class="antes__reglas">
            <li>
              <span class="antes__regla-icono antes__regla-icono--tiempo" aria-hidden="true">
                <IconoCronometro tamano={20} />
              </span>
              {t('antes.reglaTiempo')}
            </li>
            <li>
              <span class="antes__regla-icono antes__regla-icono--aprobar" aria-hidden="true">
                <IconoCheck tamano={20} />
              </span>
              {t('antes.reglaAprobar')}
            </li>
          </ul>

          <div class="antes__bono">
            <svg class="antes__estrella" viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="12,2.2 14.9,8.6 21.8,9.3 16.6,14 18.1,20.8 12,17.3 5.9,20.8 7.4,14 2.2,9.3 9.1,8.6" />
            </svg>
            <p>{avisoDelIntento(progreso, numero)}</p>
          </div>

          <div class="pantalla__relleno" />
          <div class="pantalla__pie">
            <Boton ancho onClick={empezar} disabled={empezando}>
              {t('antes.empezar')}
            </Boton>
            <Boton ancho variante="secundario" onClick={atras}>
              {t('antes.volver')}
            </Boton>
          </div>
        </>
      )}
    </main>
  );
}
