// Pantalla 2b · Nuevo jugador: nombre o apodo y uno de 6 colores. No se piden otros datos.

import { useState } from 'preact/hooks';
import { useApp } from '../../app/estado';
import { Avatar, Boton, BotonIcono, BotonSilencio, IconoAtras } from '../../componentes';
import { COLORES_AVATAR, LARGO_MAXIMO_NOMBRE, type ColorAvatar } from '../../datos/tipos';
import { t } from '../../textos';
import './perfil.css';

export function CrearPerfil() {
  const { datos, silenciado, cambiarSilencio, ir, volver, elegirPerfil } = useApp();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<ColorAvatar>('azul');
  const [guardando, setGuardando] = useState(false);
  const valido = nombre.trim().length > 0;

  async function crear(e: Event) {
    e.preventDefault();
    if (!datos || !valido || guardando) return;
    setGuardando(true);
    try {
      const perfil = await datos.crearPerfil(nombre, color);
      await elegirPerfil(perfil);
      // «Crear y empezar»: reemplaza esta pantalla para que «Atrás» no vuelva al formulario.
      ir({ pantalla: 'biblioteca' }, { reemplazar: true });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form class="contenedor pantalla" onSubmit={crear}>
      <div class="pantalla__barra">
        <BotonIcono etiqueta={t('componentes.atras')} onClick={() => volver({ pantalla: 'perfiles' })}>
          <IconoAtras />
        </BotonIcono>
        <BotonSilencio silenciado={silenciado} onCambiar={cambiarSilencio} />
      </div>

      <h1 class="t-titulo pantalla__titulo">{t('crearPerfil.titulo')}</h1>

      <div class="crear-perfil__avatar">
        <Avatar nombre={nombre.trim() || '?'} color={color} tamano="grande" />
      </div>

      <label class="crear-perfil__etiqueta" for="nombre-perfil">
        {t('crearPerfil.nombre')}
      </label>
      <input
        id="nombre-perfil"
        class="campo"
        type="text"
        value={nombre}
        maxLength={LARGO_MAXIMO_NOMBRE}
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="done"
        onInput={(e) => setNombre(e.currentTarget.value)}
      />
      <p class="crear-perfil__ayuda t-etiqueta">{t('crearPerfil.ayuda')}</p>

      <fieldset class="crear-perfil__colores">
        <legend class="crear-perfil__etiqueta">{t('crearPerfil.color')}</legend>
        <div class="selector-color">
          {COLORES_AVATAR.map((c) => (
            <label key={c} class="selector-color__opcion" style={{ '--avatar': `var(--avatar-${c})` }}>
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} />
              <span class="selector-color__muestra" />
              <span class="solo-lectores">{t(`colores.${c}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div class="pantalla__relleno" />
      <div class="pantalla__pie">
        <Boton ancho type="submit" disabled={!valido || guardando || !datos}>
          {t('crearPerfil.crear')}
        </Boton>
      </div>
    </form>
  );
}
