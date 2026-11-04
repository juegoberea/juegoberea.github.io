// «Guardar como archivo» e «Imprimir» del diario, y la versión del diario para papel.

import { descargar, fechaLarga, nombreSeguro } from '../../app/archivos';
import { Logo } from '../../componentes';
import { diarioComoTexto, type EntradaDiario } from '../../datos/diario';
import { t } from '../../textos';

export function guardarDiario(entradas: EntradaDiario[], nombre: string, libro: string): void {
  const texto = diarioComoTexto(entradas, {
    encabezado: t('diario.archivoEncabezado'),
    subtitulo: t('diario.archivoSubtitulo', { nombre, libro }),
    guardadoEl: t('diario.guardadoEl', { fecha: fechaLarga(new Date()) }),
    capitulo: (n, titulo) => (titulo ? t('diario.capitulo', { n, titulo }) : t('diario.capituloSinTitulo', { n })),
    pregunta: t('diario.pregunta'),
    reflexion: t('diario.reflexion'),
  });
  // Con marca UTF-8 al principio, para que el Bloc de notas muestre bien las tildes.
  descargar('﻿' + texto, t('diario.nombreArchivo', { nombre: nombreSeguro(nombre) }), 'text/plain;charset=utf-8');
}

export function imprimir(): void {
  window.print();
}

/** El diario tal como sale en papel. Solo se ve al imprimir. */
export function DiarioImpreso({ entradas, nombre, libro }: { entradas: EntradaDiario[]; nombre: string; libro: string }) {
  return (
    <section class="impresion impresion-diario">
      <header class="impresion-diario__cabecera">
        <Logo tamano={56} />
        <div>
          <h1>{t('diario.titulo')}</h1>
          <p>{t('diario.archivoSubtitulo', { nombre, libro })}</p>
        </div>
      </header>
      {entradas.map((e) => (
        <article key={e.capitulo} class="impresion-diario__entrada">
          <h2>{e.titulo ? t('diario.capitulo', { n: e.capitulo, titulo: e.titulo }) : t('diario.capituloSinTitulo', { n: e.capitulo })}</h2>
          {e.pregunta && <p class="impresion-diario__pregunta">{e.pregunta}</p>}
          <p class="impresion-diario__texto">{e.texto}</p>
        </article>
      ))}
    </section>
  );
}
