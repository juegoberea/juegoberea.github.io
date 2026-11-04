// Pantalla 13 · ¡Terminaste el libro!: confeti, gran insignia y el certificado con el
// nombre, los puntos sobre 146.000, las estrellas sobre 219 y la fecha. Se puede guardar
// como imagen o imprimir (el certificado y, a continuación, el diario completo).

import { descargar, fechaLarga, nombreSeguro } from '../../app/archivos';
import { useApp } from '../../app/estado';
import { useProgreso } from '../../app/useProgreso';
import { Boton, Confeti, IconoLibro, Insignia, Logo } from '../../componentes';
import { libroDeLaSerie } from '../../contenido/libros';
import { entradasDiario } from '../../datos/diario';
import { capitulosAprobados, totalEstrellas, totalPuntos } from '../../datos/progreso';
import { libroEnIdioma } from '../../motor/cargar-contenido';
import { estrellasMaximasLibro, puntosMaximosLibro } from '../../motor/reglas';
import { useTema } from '../../temas/contexto';
import { numero as formatoNumero, t } from '../../textos';
import { DiarioImpreso } from '../11-progreso-y-diario/diario-acciones';
import { certificadoComoImagen } from './certificado-imagen';
import './terminado.css';

interface DatosVista {
  nombre: string;
  libro: string;
  puntos: number;
  estrellas: number;
  totalCapitulos: number;
  fecha: string;
}

function Certificado({ d }: { d: DatosVista }) {
  return (
    <div class="certificado">
      <Logo tamano={68} />
      <p class="certificado__etiqueta">{t('terminado.certificado')}</p>
      <p class="certificado__reconoce">{t('terminado.reconoce')}</p>
      <p class="certificado__nombre">{d.nombre}</p>
      <p class="certificado__motivo">
        {t('terminado.porCompletar')} <strong>{d.libro}</strong>, {t('terminado.capituloPorCapitulo')}
      </p>
      <div class="certificado__datos">
        <div>
          <strong>{formatoNumero(d.puntos)}</strong>
          <span>{t('terminado.dePuntos', { total: formatoNumero(puntosMaximosLibro(d.totalCapitulos)) })}</span>
        </div>
        <div>
          <strong class="certificado__estrellas">★ {d.estrellas}</strong>
          <span>{t('terminado.deEstrellas', { total: estrellasMaximasLibro(d.totalCapitulos) })}</span>
        </div>
      </div>
      <p class="certificado__fecha">{d.fecha}</p>
    </div>
  );
}

export function LibroTerminado({ libroId }: { libroId: string }) {
  const { contenido, perfil, ir, volver } = useApp();
  const tema = useTema();
  const progreso = useProgreso(libroId);
  const libro = contenido ? libroEnIdioma(contenido, libroId) : undefined;
  const serie = libroDeLaSerie(libroId);
  if (!progreso || !perfil || !serie) return null;

  const aprobados = capitulosAprobados(progreso);
  const aMapa = () => volver({ pantalla: 'capitulos', libro: libroId });

  if (aprobados.length < serie.capitulos) {
    return (
      <main class="contenedor pantalla">
        <p class="aviso-carga">{t('terminado.noTerminado')}</p>
        <Boton ancho variante="secundario" onClick={aMapa}>
          {t('provisional.volver')}
        </Boton>
      </main>
    );
  }

  const tituloLibro = libro?.titulo ?? t(`libros.${libroId}`);
  const terminoEl = aprobados.reduce((ultima, a) => (a.fecha > ultima ? a.fecha : ultima), aprobados[0].fecha);
  const d: DatosVista = {
    nombre: perfil.nombre,
    libro: tituloLibro,
    puntos: totalPuntos(progreso),
    estrellas: totalEstrellas(progreso),
    totalCapitulos: serie.capitulos,
    fecha: fechaLarga(terminoEl),
  };

  async function guardarImagen() {
    const imagen = await certificadoComoImagen(tema, {
      etiqueta: t('terminado.certificado'),
      reconoce: t('terminado.reconoce'),
      nombre: d.nombre,
      porCompletar: t('terminado.porCompletar'),
      libro: d.libro,
      capituloPorCapitulo: t('terminado.capituloPorCapitulo'),
      puntos: formatoNumero(d.puntos),
      dePuntos: t('terminado.dePuntos', { total: formatoNumero(puntosMaximosLibro(d.totalCapitulos)) }),
      estrellas: String(d.estrellas),
      deEstrellas: t('terminado.deEstrellas', { total: estrellasMaximasLibro(d.totalCapitulos) }),
      fecha: d.fecha,
    });
    descargar(imagen, t('terminado.nombreArchivo', { nombre: nombreSeguro(d.nombre) }));
  }

  return (
    <>
      <main class="contenedor pantalla terminado no-imprimir">
        <Confeti />
        <Insignia tamano={140} brillar>
          <IconoLibro tamano={52} />
        </Insignia>
        <h1 class="terminado__titulo">{t('terminado.titulo')}</h1>
        <p class="terminado__subtitulo">{t('terminado.subtitulo', { n: serie.capitulos })}</p>

        <Certificado d={d} />

        <div class="pantalla__relleno" />
        <div class="pantalla__pie">
          <div class="terminado__par">
            <Boton onClick={guardarImagen}>{t('terminado.guardar')}</Boton>
            <Boton onClick={() => window.print()}>{t('terminado.imprimir')}</Boton>
          </div>
          <Boton ancho variante="secundario" class="boton--diario-completo" onClick={() => ir({ pantalla: 'diario', libro: libroId })}>
            {t('terminado.verDiario')}
          </Boton>
        </div>
      </main>

      <div class="impresion impresion-terminado">
        <Certificado d={d} />
      </div>
      <div class="impresion-salto">
        <DiarioImpreso entradas={entradasDiario(progreso, libro)} nombre={perfil.nombre} libro={tituloLibro} />
      </div>
    </>
  );
}
