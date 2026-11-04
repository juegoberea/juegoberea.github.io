// Pantalla 2 · ¿Quién va a jugar?: los perfiles del aparato y «Nuevo jugador».

import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Avatar, Boton, BotonSilencio, IconoMas, Logo } from '../../componentes';
import { SERIE } from '../../contenido/libros';
import { capituloActual, totalEstrellas, totalPuntos } from '../../datos/progreso';
import type { Perfil } from '../../datos/tipos';
import { numero, t } from '../../textos';
import './perfil.css';

interface FichaPerfil {
  perfil: Perfil;
  capitulo: number;
  puntos: number;
  estrellas: number;
}

export function Perfiles() {
  const { datos, silenciado, cambiarSilencio, ir, elegirPerfil } = useApp();
  const [fichas, setFichas] = useState<FichaPerfil[] | null>(null);

  useEffect(() => {
    if (!datos) return;
    let vigente = true;
    (async () => {
      const perfiles = await datos.listarPerfiles();
      const lista = await Promise.all(
        perfiles.map(async (perfil) => {
          // El primer libro de la serie es el que se juega en esta versión.
          const progreso = await datos.obtenerProgreso(perfil.id, SERIE[0].id);
          return { perfil, capitulo: capituloActual(progreso, SERIE[0].capitulos), puntos: totalPuntos(progreso), estrellas: totalEstrellas(progreso) };
        }),
      );
      if (vigente) setFichas(lista);
    })();
    return () => {
      vigente = false;
    };
  }, [datos]);

  async function elegir(perfil: Perfil) {
    await elegirPerfil(perfil);
    ir({ pantalla: 'biblioteca' });
  }

  return (
    <main class="contenedor pantalla">
      <div class="pantalla__barra">
        <div class="pantalla__barra-grupo marca">
          <Logo tamano={44} />
          <span class="marca__nombre">{t('app.nombre')}</span>
        </div>
        <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
      </div>

      <h1 class="t-titulo pantalla__titulo">{t('perfiles.titulo')}</h1>
      <p class="pantalla__subtitulo">{t('perfiles.subtitulo')}</p>

      <div class="perfiles">
        {fichas?.length === 0 && <p class="aviso-carga">{t('perfiles.vacio')}</p>}
        {fichas?.map(({ perfil, capitulo, puntos, estrellas }) => (
          <button key={perfil.id} type="button" class="ficha-perfil" onClick={() => elegir(perfil)}>
            <Avatar nombre={perfil.nombre} color={perfil.color} />
            <span class="ficha-perfil__texto">
              <span class="ficha-perfil__nombre">{perfil.nombre}</span>
              <span class="ficha-perfil__detalle t-etiqueta">
                {puntos > 0 ? t('perfiles.detalle', { n: capitulo, puntos: numero(puntos) }) : t('perfiles.sinPuntos', { n: capitulo })}
              </span>
            </span>
            {estrellas > 0 && (
              <span class="ficha-perfil__estrellas" aria-label={t('perfiles.estrellas', { n: estrellas })}>
                <span aria-hidden="true">★ {estrellas}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <div class="pantalla__relleno" />
      <div class="pantalla__pie">
        <Boton ancho variante="secundario" icono={<IconoMas />} onClick={() => ir({ pantalla: 'perfil-nuevo' })}>
          {t('perfiles.nuevo')}
        </Boton>
      </div>
    </main>
  );
}
