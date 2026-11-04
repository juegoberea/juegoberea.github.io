// Diseño general: menú lateral (Inicio, Subir, Capítulos, Publicar con los cambios pendientes, Seguridad;
// abajo la autora y «Salir») y el contenido a la derecha.

import type { ComponentChildren } from 'preact';
import { Logo } from '../../app/src/componentes/Logo';
import { IconoEscudo, IconoInicio, IconoLibro, IconoPublicar, IconoSalir, IconoSubir } from './iconos';
import type { Autora } from './sesion';
import { t } from './textos';

export type Seccion = 'inicio' | 'subir' | 'capitulos' | 'publicar' | 'seguridad';

const SECCIONES: { id: Seccion; Icono: () => preact.JSX.Element }[] = [
  { id: 'inicio', Icono: IconoInicio },
  { id: 'subir', Icono: IconoSubir },
  { id: 'capitulos', Icono: IconoLibro },
  { id: 'publicar', Icono: IconoPublicar },
  { id: 'seguridad', Icono: IconoEscudo },
];

export function Marco({ seccion, autora, cambios, alSalir, children }: { seccion: Seccion; autora: Autora; cambios: number; alSalir: () => void; children: ComponentChildren }) {
  return (
    <div class="app">
      <nav class="side" aria-label={t('menu.nombre')}>
        <div class="brand">
          <Logo tamano={40} />
          <div><b>{t('marca.nombre')}</b><span>{t('marca.panel')}</span></div>
        </div>
        {SECCIONES.map(({ id, Icono }) => (
          <a key={id} class={`nav${seccion === id ? ' on' : ''}`} href={`#/${id}`} aria-current={seccion === id ? 'page' : undefined}>
            <Icono />
            {t(`menu.${id}`)}
            {id === 'publicar' && cambios > 0 && <span class="n">{cambios}</span>}
          </a>
        ))}
        <div class="grow" />
        <div class="who">
          <span class="av" aria-hidden="true">{autora.nombre.slice(0, 1).toUpperCase()}</span>
          <div><b>{autora.nombre}</b><span>{autora.correo}</span></div>
        </div>
        <button class="nav" onClick={alSalir}><IconoSalir />{t('menu.salir')}</button>
      </nav>
      <main class="main">
        <div class="wrap">{children}</div>
      </main>
    </div>
  );
}
