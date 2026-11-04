// Logo provisional de Berea (libro abierto con una estrella), dibujado como en los diseños.
// Usa los colores del tema: tapas turquesa y azul, páginas morada y naranja, estrella dorada.

export function Logo({ tamano = 120 }: { tamano?: number }) {
  return (
    <svg class="logo" width={tamano} height={tamano * 0.8} viewBox="0 0 100 80" aria-hidden="true" focusable="false">
      <path class="logo__tapa-izq" d="M5 24 Q28 18 50 26 L50 77 Q28 69 5 74 Z" />
      <path class="logo__tapa-der" d="M95 24 Q72 18 50 26 L50 77 Q72 69 95 74 Z" />
      <path class="logo__hoja-izq" d="M13 30 Q32 26 49 32 L49 69 Q32 63 13 66 Z" />
      <path class="logo__hoja-der" d="M87 30 Q68 26 51 32 L51 69 Q68 63 87 66 Z" />
      <polygon
        class="logo__estrella"
        points="50,1.5 53.3,9.4 61.8,10.1 55.4,15.7 57.3,24 50,19.6 42.7,24 44.6,15.7 38.2,10.1 46.7,9.4"
      />
    </svg>
  );
}
