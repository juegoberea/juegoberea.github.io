import { render } from 'preact';
import { aplicarTema } from '../../app/src/temas/aplicar';
import '../../app/src/temas/base.css';
import { temaVibrante } from '../../app/src/temas/vibrante';
import { Panel } from './Panel';
import './panel.css';

aplicarTema(temaVibrante, 'normal');

render(<Panel />, document.getElementById('panel')!);
