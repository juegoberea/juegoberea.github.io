// Pantalla 10 · Mi reflexión: la pregunta de reflexión del capítulo y una libreta con
// renglones. Es opcional, no da puntos y se guarda en «Mi diario» del perfil.

import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Boton } from '../../componentes';
import { buscarCapitulo } from '../../motor/cargar-contenido';
import { sonar } from '../../sonido/efectos';
import { t } from '../../textos';
import '../comun.css';
import './reflexion.css';

function Lapiz() {
  return (
    <svg class="reflexion__lapiz" viewBox="0 0 48 48" aria-hidden="true">
      <path class="reflexion__lapiz-cuerpo" d="M33 6l9 9-23 23-9-9z" />
      <path class="reflexion__lapiz-goma" d="M33 6l4-4 9 9-4 4z" />
      <path class="reflexion__lapiz-madera" d="M10 29l9 9-12 4z" />
      <path class="reflexion__lapiz-punta" d="M5.5 38.5l4 4-6 2z" />
    </svg>
  );
}

export function Reflexion({ libroId, numero }: { libroId: string; numero: number }) {
  const { datos, perfil, contenido, sonidos, volver } = useApp();
  const [texto, setTexto] = useState('');
  const [cargada, setCargada] = useState(false);
  const [aprobado, setAprobado] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const capitulo = contenido ? buscarCapitulo(contenido, libroId, numero) : undefined;
  const salir = () => volver({ pantalla: 'capitulos', libro: libroId });

  // Si ya había escrito algo para este capítulo, aparece para seguir.
  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    datos.obtenerProgreso(perfil.id, libroId).then((p) => {
      if (!vigente) return;
      setAprobado(Boolean(p.capitulos[numero]?.aprobado));
      setTexto(p.diario[numero]?.texto ?? '');
      setCargada(true);
    });
    return () => {
      vigente = false;
    };
  }, [datos, perfil, libroId, numero]);

  async function guardar() {
    if (!datos || !perfil || guardando) return;
    setGuardando(true);
    try {
      await datos.guardarReflexion(perfil.id, libroId, numero, texto);
      sonar('correcto', sonidos);
      salir();
    } finally {
      setGuardando(false);
    }
  }

  if (!capitulo || !cargada) return <div class="reflexion" />;

  if (!aprobado || !capitulo.reflexion) {
    return (
      <div class="reflexion">
        <main class="contenedor pantalla">
          <p class="aviso-carga">{t('reflexion.noDisponible')}</p>
          <Boton ancho variante="blanco" onClick={salir}>
            {t('reflexion.saltar')}
          </Boton>
        </main>
      </div>
    );
  }

  return (
    <div class="reflexion">
      <main class="contenedor pantalla">
        <div class="reflexion__cabecera">
          <span class="t-etiqueta">{t('reflexion.encabezado', { n: numero })}</span>
          <Lapiz />
        </div>
        <h1 class="t-pregunta reflexion__pregunta">{capitulo.reflexion}</h1>

        <div class="reflexion__libreta">
          <span class="reflexion__agujeros" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} />
            ))}
          </span>
          <label class="reflexion__etiqueta t-etiqueta" for="texto-reflexion">
            {t('reflexion.etiqueta')}
          </label>
          <textarea id="texto-reflexion" ref={campo} class="reflexion__texto" value={texto} rows={9} onInput={(e) => setTexto(e.currentTarget.value)} />
        </div>

        <p class="reflexion__nota t-etiqueta">{t('reflexion.nota')}</p>

        <div class="pantalla__relleno" />
        <div class="reflexion__botones">
          <Boton variante="blanco" onClick={salir}>
            {t('reflexion.saltar')}
          </Boton>
          <Boton onClick={guardar} disabled={guardando || texto.trim().length === 0}>
            {t('reflexion.guardar')}
          </Boton>
        </div>
      </main>
    </div>
  );
}
