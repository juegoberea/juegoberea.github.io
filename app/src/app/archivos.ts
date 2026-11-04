// Guardar archivos en el aparato (copia de respaldo, diario, certificado) y fechas legibles.

/** Descarga un archivo a la carpeta de Descargas del aparato. */
export function descargar(contenido: Blob | Uint8Array | string, nombre: string, tipo = 'application/octet-stream'): void {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido as BlobPart], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** «2026-11-03T…» → «3 de noviembre de 2026». */
export function fechaLarga(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  try {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Quita lo que no sirve en un nombre de archivo: «María José» → «Maria Jose». */
export function nombreSeguro(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ._-]+/g, '').trim() || 'Berea';
}
