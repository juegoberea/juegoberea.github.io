// Pantalla 8 · Resultado del capítulo.
//  Aprobado: confeti, insignia que brilla, estrellas una por una, puntos · correctas ·
//  intento y el mensaje de bono (siempre como bono, nunca como descuento).
//  No aprobado: «¡Casi!», correctas sobre 20 con la meta de 14 y el aviso de que el nuevo
//  intento cambia el orden. Nunca muestra las respuestas correctas.

import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Boton, Confeti, Estrellas, IconoLibro, IconoReintentar, Insignia } from '../../componentes';
import { libroDeLaSerie } from '../../contenido/libros';
import { capitulosAprobados } from '../../datos/progreso';
import type { ProgresoLibro } from '../../datos/tipos';
import type { ResultadoCapitulo } from '../../motor/capitulo';
import { buscarCapitulo } from '../../motor/cargar-contenido';
import { bonoPorRespuesta, CORRECTAS_PARA_APROBAR } from '../../motor/reglas';
import { sonar } from '../../sonido/efectos';
import { numero as formatoNumero, ordinalIntento, t } from '../../textos';
import './resultado.css';

function mensajeBono(intento: number): string {
  if (intento === 1) return t('resultado.bono1', { bono: bonoPorRespuesta(1) });
  if (intento === 2) return t('resultado.bono2', { bono: bonoPorRespuesta(2) });
  return t('resultado.bono3');
}

function mensajeFaltaron(faltaron: number): string {
  if (faltaron === 1) return t('resultado.faltoUna');
  if (faltaron <= 3) return t('resultado.faltaronPocas', { n: faltaron });
  return t('resultado.faltaron', { n: faltaron });
}

export function Resultado({ libroId, numero }: { libroId: string; numero: number }) {
  const { resultado, contenido, datos, perfil, sonidos, ir, volver } = useApp();
  const [progreso, setProgreso] = useState<ProgresoLibro | null>(null);
  const datosResultado: ResultadoCapitulo | null = resultado && resultado.libro === libroId && resultado.numero === numero ? resultado.datos : null;
  const capitulo = contenido ? buscarCapitulo(contenido, libroId, numero) : undefined;

  // Sin resultado (por ejemplo, al recargar la página): vuelve al mapa.
  useEffect(() => {
    if (!datosResultado) ir({ pantalla: 'capitulos', libro: libroId }, { reemplazar: true });
  }, [datosResultado]);

  useEffect(() => {
    if (datosResultado) sonar(datosResultado.aprobado ? 'aprobado' : 'casi', sonidos);
  }, []);

  useEffect(() => {
    if (!datos || !perfil) return;
    let vigente = true;
    datos.obtenerProgreso(perfil.id, libroId).then((p) => vigente && setProgreso(p));
    return () => {
      vigente = false;
    };
  }, [datos, perfil, libroId]);

  if (!datosResultado || !capitulo) return null;
  const r = datosResultado;
  const titulo = capitulo.titulo;
  const aCapitulos = () => volver({ pantalla: 'capitulos', libro: libroId });
  const verResumen = () => ir({ pantalla: 'resumen', libro: libroId, numero });

  if (!r.aprobado) {
    return (
      <main class="contenedor pantalla resultado">
        <span class="resultado__icono-libro" aria-hidden="true">
          <IconoLibro tamano={56} />
        </span>
        <h1 class="resultado__titulo">{t(r.faltaron <= 4 ? 'resultado.casi' : 'resultado.sigue')}</h1>
        <p class="resultado__mensaje">{mensajeFaltaron(r.faltaron)}</p>
        <p class="resultado__detalle t-etiqueta">
          {r.practica
            ? t('resultado.detallePractica', { n: numero, titulo })
            : t('resultado.detalleIntento', { n: numero, titulo, intento: ordinalIntento(r.numeroIntento) })}
        </p>

        <div class="tarjeta resultado__meta">
          <div class="resultado__meta-fila">
            <p>
              <strong>{r.correctas}</strong> {t('resultado.deCorrectas', { total: r.resumen.preguntas.length })}
            </p>
            <p class="resultado__meta-objetivo t-etiqueta">{t('resultado.meta', { n: CORRECTAS_PARA_APROBAR })}</p>
          </div>
          <div class="resultado__barra" role="img" aria-label={`${r.correctas} / ${r.resumen.preguntas.length}`}>
            <span class="resultado__barra-relleno" style={{ width: `${(r.correctas / r.resumen.preguntas.length) * 100}%` }} />
            <span class="resultado__barra-meta" style={{ left: `${(CORRECTAS_PARA_APROBAR / r.resumen.preguntas.length) * 100}%` }} />
          </div>
        </div>

        <div class="resultado__aviso">
          <IconoReintentar tamano={28} />
          <p>{r.practica ? t('resultado.practicaNoAprobada') : t('resultado.reintentar')}</p>
        </div>

        <div class="pantalla__relleno" />
        <div class="pantalla__pie">
          <Boton ancho onClick={aCapitulos}>
            {t('resultado.volverCapitulos')}
          </Boton>
          <Boton ancho variante="secundario" onClick={verResumen}>
            {t('resultado.verResumen')}
          </Boton>
        </div>
      </main>
    );
  }

  // Aprobado.
  const serie = libroDeLaSerie(libroId);
  const libroTerminado = Boolean(progreso && serie && capitulosAprobados(progreso).length >= serie.capitulos);
  const tieneReflexion = capitulo.reflexion.trim().length > 0;
  const yaReflexiono = Boolean(progreso?.diario[numero]);

  // Pedido de la autora: «Salir» (vuelve al mapa de capítulos) en lugar de «Siguiente capítulo».
  // Solo al completar el libro el botón lleva al certificado.
  function continuar() {
    if (libroTerminado && !r.practica) ir({ pantalla: 'terminado', libro: libroId }, { reemplazar: true });
    else aCapitulos();
  }

  return (
    <main class="contenedor pantalla resultado">
      {!r.practica && <Confeti />}
      <Insignia numero={numero} tamano={128} brillar={!r.practica} />
      <h1 class="resultado__titulo">{t('resultado.aprobaste')}</h1>
      <p class="resultado__capitulo">{t('resultado.capitulo', { n: numero, titulo })}</p>

      {r.practica ? (
        <p class="resultado__bono">{t('resultado.practica')}</p>
      ) : (
        <>
          <div class="resultado__estrellas">
            <Estrellas ganadas={r.estrellas} tamano="grande" animar />
          </div>
          <div class="resultado__datos">
            <div class="tarjeta resultado__dato">
              <strong>{formatoNumero(r.puntos)}</strong>
              <span>{t('resultado.puntos')}</span>
            </div>
            <div class="tarjeta resultado__dato">
              <strong>{t('resultado.correctasValor', { n: r.correctas, total: r.resumen.preguntas.length })}</strong>
              <span>{t('resultado.correctas')}</span>
            </div>
            <div class="tarjeta resultado__dato">
              <strong>{t('resultado.intentoValor', { n: r.numeroIntento })}</strong>
              <span>{t('resultado.intento')}</span>
            </div>
          </div>
          <p class="resultado__bono">{mensajeBono(r.numeroIntento)}</p>
        </>
      )}

      <div class="pantalla__relleno" />
      <div class="pantalla__pie">
        <Boton ancho onClick={continuar}>
          {libroTerminado && !r.practica ? t('resultado.verCertificado') : t('resultado.salir')}
        </Boton>
        <div class="resultado__par">
          {tieneReflexion && (
            <Boton variante="secundario" onClick={() => ir({ pantalla: 'reflexion', libro: libroId, numero })}>
              {yaReflexiono ? t('resultado.verReflexion') : t('resultado.escribirReflexion')}
            </Boton>
          )}
          <Boton variante="secundario" onClick={verResumen}>
            {t('resultado.verResumen')}
          </Boton>
        </div>
      </div>
    </main>
  );
}
