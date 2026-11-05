import { render } from 'preact';
import { aplicarTema } from '../../app/src/temas/aplicar';
import '../../app/src/temas/base.css';
import { temaVibrante } from '../../app/src/temas/vibrante';
import { Panel } from './Panel';
import './panel.css';

aplicarTema(temaVibrante, 'normal');

// Ninguna otra página puede mostrar el panel dentro de la suya (para hacer clic sin que se note).
if (window.top === window.self) render(<Panel />, document.getElementById('panel')!);
else document.body.textContent = 'El panel de Berea solo se abre en su propia pestaña.';
