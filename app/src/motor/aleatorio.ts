// Mezclas al azar. Las pruebas usan una semilla para que el resultado sea repetible.

/** Devuelve un número en [0, 1), como Math.random. */
export type Aleatorio = () => number;

/** Mezcla de Fisher-Yates: devuelve una copia en orden al azar. */
export function mezclar<T>(lista: readonly T[], aleatorio: Aleatorio = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Generador repetible (mulberry32) para las pruebas. */
export function aleatorioConSemilla(semilla: number): Aleatorio {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
