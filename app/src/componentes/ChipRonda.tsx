import type { NumeroRonda } from '../contenido/tipos';
import { t } from '../textos';

/** «Ronda 2 · Intermedia» sobre el color de la ronda. */
export function ChipRonda({ ronda }: { ronda: NumeroRonda }) {
  return <span class={`chip-ronda ronda-${ronda} t-etiqueta`}>{t('componentes.ronda', { n: ronda, nombre: t(`rondas.${ronda}`) })}</span>;
}
