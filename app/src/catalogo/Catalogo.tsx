// Catálogo de componentes (Fase 4): vista de prueba para revisar el tema y los
// componentes antes de que existan las pantallas. Se quitará cuando lleguen.

import { useEffect, useState } from 'preact/hooks';
import type { NumeroRonda } from '../contenido/tipos';
import { COLORES_AVATAR, TAMANOS_LETRA, type TamanoLetra } from '../datos/tipos';
import {
  Avatar,
  Boton,
  BotonIcono,
  BotonSilencio,
  ChipRonda,
  Confeti,
  Estrellas,
  IconoAjustes,
  IconoAtras,
  IconoLibro,
  IconoMas,
  Insignia,
  Opcion,
  ParadaMapa,
  Reloj,
  type EstadoOpcion,
} from '../componentes';
import { aplicarTema } from '../temas/aplicar';
import { useTema } from '../temas/contexto';
import { t } from '../textos';
import './catalogo.css';

const NOMBRES_LETRA: Record<TamanoLetra, string> = {
  normal: 'catalogo.letraNormal',
  grande: 'catalogo.letraGrande',
  muyGrande: 'catalogo.letraMuyGrande',
};

function Seccion({ titulo, children }: { titulo: string; children: preact.ComponentChildren }) {
  return (
    <section class="cat-seccion">
      <h2 class="t-etiqueta cat-seccion__titulo">{titulo}</h2>
      {children}
    </section>
  );
}

function RelojEnVivo() {
  const [inicio, setInicio] = useState(() => performance.now());
  const [ahora, setAhora] = useState(inicio);
  useEffect(() => {
    const id = setInterval(() => setAhora(performance.now()), 200);
    return () => clearInterval(id);
  }, []);
  const segundos = Math.max(0, Math.ceil(30 - (ahora - inicio) / 1000));
  return (
    <div class="cat-fila">
      <Reloj segundos={segundos} />
      <Boton variante="secundario" onClick={() => setInicio(performance.now())}>
        {t('catalogo.relojReiniciar')}
      </Boton>
    </div>
  );
}

const ESTADOS_DEMO: { titulo: string; estados: [EstadoOpcion, EstadoOpcion, EstadoOpcion] }[] = [
  { titulo: 'catalogo.estadoEsperando', estados: ['esperando', 'esperando', 'esperando'] },
  { titulo: 'catalogo.estadoCorrecta', estados: ['atenuada', 'correcta', 'atenuada'] },
  { titulo: 'catalogo.estadoIncorrecta', estados: ['atenuada', 'incorrecta', 'atenuada'] },
  { titulo: 'catalogo.estadoTiempo', estados: ['atenuada', 'atenuada', 'atenuada'] },
];

export function Catalogo() {
  const tema = useTema();
  const [letra, setLetra] = useState<TamanoLetra>('normal');
  const [silenciado, setSilenciado] = useState(false);
  const [ronda, setRonda] = useState<NumeroRonda>(2);
  const [confeti, setConfeti] = useState(0);
  const [animarEstrellas, setAnimarEstrellas] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);

  useEffect(() => aplicarTema(tema, letra), [tema, letra]);

  return (
    <main class="contenedor cat">
      {confeti > 0 && <Confeti key={confeti} />}

      <header class="cat-cabecera">
        <div>
          <h1 class="t-titulo">{t('catalogo.titulo')}</h1>
          <p class="t-apagado">{t('catalogo.descripcion')}</p>
        </div>
        <BotonSilencio silenciado={silenciado} onCambiar={setSilenciado} />
      </header>

      <Seccion titulo={t('catalogo.letra')}>
        <div class="cat-fila">
          {TAMANOS_LETRA.map((nivel) => (
            <Boton key={nivel} variante={letra === nivel ? 'primario' : 'secundario'} onClick={() => setLetra(nivel)}>
              {t(NOMBRES_LETRA[nivel])}
            </Boton>
          ))}
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.colores')}>
        <div class="cat-colores">
          {Object.entries(tema.color).map(([nombre, valor]) => (
            <div key={nombre} class="cat-color">
              <span class="cat-color__muestra" style={{ background: `var(--color-${nombre.replace(/[A-Z]/g, (l) => '-' + l.toLowerCase())})` }} />
              <span class="t-etiqueta">{nombre}</span>
              <span class="cat-color__valor">{valor}</span>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.botones')}>
        <div class="cat-pila">
          <Boton ancho late>
            {t('catalogo.botonLate')}
          </Boton>
          <Boton ancho>{t('catalogo.botonPrimario')}</Boton>
          <Boton ancho variante="secundario">
            {t('catalogo.botonSecundario')}
          </Boton>
          <div class="cat-fila">
            <Boton variante="blanco">{t('catalogo.botonBlanco')}</Boton>
            <Boton variante="secundario" icono={<IconoMas />}>
              {t('catalogo.botonIcono')}
            </Boton>
            <BotonIcono etiqueta={t('componentes.atras')}>
              <IconoAtras />
            </BotonIcono>
            <BotonIcono etiqueta={t('componentes.ajustes')}>
              <IconoAjustes />
            </BotonIcono>
          </div>
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.chips')}>
        <div class="cat-fila">
          {([1, 2, 3, 4] as NumeroRonda[]).map((n) => (
            <button key={n} type="button" class="cat-sin-boton" onClick={() => setRonda(n)}>
              <ChipRonda ronda={n} />
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.opciones')}>
        <div class={`cat-pregunta ronda-${ronda} fondo-ronda`}>
          <div class="cat-fila cat-fila--espaciada">
            <ChipRonda ronda={ronda} />
            <div class="cat-fila">
              <BotonSilencio silenciado={silenciado} onCambiar={setSilenciado} />
              <Reloj segundos={19} />
            </div>
          </div>
          <p class="t-pregunta">{t('catalogo.preguntaEjemplo')}</p>
          <div class="cat-pila">
            {(['A', 'B', 'C'] as const).map((letraOpcion, i) => (
              <Opcion
                key={letraOpcion}
                letra={letraOpcion}
                texto={t(`catalogo.opcion${letraOpcion}`)}
                estado={elegida === null ? 'esperando' : elegida === i ? (i === 1 ? 'correcta' : 'incorrecta') : 'atenuada'}
                puntos={100}
                onElegir={() => setElegida(i)}
              />
            ))}
          </div>
          {elegida !== null && (
            <Boton variante="secundario" onClick={() => setElegida(null)}>
              {t('catalogo.relojReiniciar')}
            </Boton>
          )}
        </div>

        {ESTADOS_DEMO.slice(1).map((demo) => (
          <div key={demo.titulo} class={`cat-pregunta ronda-${ronda} fondo-ronda`}>
            <p class="t-etiqueta t-apagado">{t(demo.titulo)}</p>
            <div class="cat-pila">
              {(['A', 'B', 'C'] as const).map((letraOpcion, i) => (
                <Opcion key={letraOpcion} letra={letraOpcion} texto={t(`catalogo.opcion${letraOpcion}`)} estado={demo.estados[i]} puntos={80} />
              ))}
            </div>
          </div>
        ))}
      </Seccion>

      <Seccion titulo={t('catalogo.relojes')}>
        <div class={`cat-fila ronda-${ronda}`}>
          <Reloj segundos={30} />
          <Reloj segundos={19} />
          <Reloj segundos={4} />
          <Reloj segundos={14} detenido />
          <Reloj segundos={0} />
        </div>
        <p class="t-etiqueta t-apagado">{t('catalogo.relojEnVivo')}</p>
        <div class={`ronda-${ronda}`}>
          <RelojEnVivo />
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.estrellas')}>
        <div class="cat-fila">
          <Estrellas ganadas={3} />
          <Estrellas ganadas={2} />
          <Estrellas ganadas={1} />
        </div>
        <div class="cat-fila">
          <Estrellas key={animarEstrellas} ganadas={3} tamano="grande" animar={animarEstrellas > 0} />
          <Boton variante="secundario" onClick={() => setAnimarEstrellas((n) => n + 1)}>
            {t('catalogo.estrellasAnimar')}
          </Boton>
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.insignias')}>
        <div class="cat-fila">
          <Insignia numero={4} tamano={112} brillar />
          {[1, 2, 3, 4].map((n) => (
            <Insignia key={n} numero={n} tamano={48} />
          ))}
          {[5, 6].map((n) => (
            <Insignia key={n} numero={n} tamano={48} ganada={false} />
          ))}
          <Insignia tamano={112}>
            <IconoLibro tamano={44} />
          </Insignia>
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.avatares')}>
        <div class="cat-fila">
          {COLORES_AVATAR.map((color, i) => (
            <Avatar key={color} nombre={['Joshua', 'Sofi', 'María', 'Papá', 'Rut', 'Ana'][i]} color={color} />
          ))}
        </div>
        <div class="cat-fila">
          <Avatar nombre="Sofi" color="azul" tamano="grande" />
          <Avatar nombre="Joshua" color="turquesa" tamano="chico" />
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.paradas')}>
        <div class="cat-fila cat-fila--paradas">
          <ParadaMapa numero={3} estado="aprobada" />
          <ParadaMapa numero={4} estado="disponible" />
          <ParadaMapa numero={5} estado="bloqueada" />
        </div>
      </Seccion>

      <Seccion titulo={t('catalogo.confeti')}>
        <Boton onClick={() => setConfeti((n) => n + 1)}>{t('catalogo.confetiLanzar')}</Boton>
      </Seccion>
    </main>
  );
}
