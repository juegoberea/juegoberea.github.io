// Acciones del banco que se usan desde varias pantallas.

import * as XLSX from 'xlsx';
import { leerBanco, type Libro } from './datos';
import { filasParaExcel } from './revision';
import { anotar } from './sesion';
import { t } from './textos';

/** «Descargar el banco como Excel»: las mismas columnas del Excel de la autora. */
export async function descargarExcel(libro: Libro): Promise<void> {
  const banco = await leerBanco();
  const { banco: filas, reflexiones } = filasParaExcel(banco, libro.titulo);
  const archivo = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(archivo, XLSX.utils.aoa_to_sheet(filas), 'Banco');
  XLSX.utils.book_append_sheet(archivo, XLSX.utils.aoa_to_sheet(reflexiones), 'Reflexiones');
  const hoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(archivo, `Banco_Preguntas_${libro.titulo.replace(/\s+/g, '_')}_${hoy}.xlsx`);
  await anotar('banco_descargado', t('registro.capitulos', { n: banco.length }));
}

export function anotarBanco(archivo: string, capitulos: number): Promise<void> {
  return anotar('banco_subido', `${archivo} · ${t('registro.capitulos', { n: capitulos })}`);
}
