// Pantalla 1 · Bienvenida: logo, nombre, eslogan, Hechos 17:11 y «Entrar».

import { useApp } from '../../app/estado';
import { Boton, BotonSilencio, Logo } from '../../componentes';
import { t } from '../../textos';
import './bienvenida.css';

export function Bienvenida() {
  const { silenciado, cambiarSilencio, ir, datos, contenido } = useApp();
  const mensaje = contenido?.mensaje?.trim();

  async function entrar() {
    // Sin jugadores todavía: directo a crear el primero.
    const hayPerfiles = datos ? (await datos.listarPerfiles()).length > 0 : true;
    ir({ pantalla: hayPerfiles ? 'perfiles' : 'perfil-nuevo' });
  }

  return (
    <div class="bienvenida">
      <span class="bienvenida__burbuja bienvenida__burbuja--1" />
      <span class="bienvenida__burbuja bienvenida__burbuja--2" />
      <span class="bienvenida__burbuja bienvenida__burbuja--3" />
      <span class="bienvenida__burbuja bienvenida__burbuja--4" />

      <main class="contenedor pantalla bienvenida__contenido">
        <div class="pantalla__barra bienvenida__barra">
          <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
        </div>

        <div class="bienvenida__centro">
          <Logo tamano={132} />
          <h1 class="bienvenida__nombre">{t('app.nombre')}</h1>
          <p class="bienvenida__eslogan">{t('app.eslogan')}</p>

          <figure class="tarjeta bienvenida__cita">
            <blockquote class="t-texto">{t('bienvenida.cita')}</blockquote>
            <figcaption class="t-etiqueta">{t('bienvenida.referencia')}</figcaption>
          </figure>

          {/* Mensaje opcional de la autora, publicado desde el panel con el contenido. */}
          {mensaje && (
            <aside class="bienvenida__mensaje">
              <span class="t-etiqueta">{t('bienvenida.mensaje')}</span>
              <p class="t-texto">{mensaje}</p>
            </aside>
          )}
        </div>

        <div class="pantalla__pie">
          <Boton ancho late onClick={entrar}>
            {t('bienvenida.entrar')}
          </Boton>
        </div>
      </main>
    </div>
  );
}
