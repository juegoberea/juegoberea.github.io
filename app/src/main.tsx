import { render } from 'preact';
import { App } from './app/App';
import { ProveedorApp } from './app/estado';
import { aplicarTema } from './temas/aplicar';
import './temas/base.css';
import { ContextoTema } from './temas/contexto';
import { temaVibrante } from './temas/vibrante';

aplicarTema(temaVibrante, 'normal');

render(
  <ContextoTema.Provider value={temaVibrante}>
    <ProveedorApp>
      <App />
    </ProveedorApp>
  </ContextoTema.Provider>,
  document.getElementById('app')!,
);
