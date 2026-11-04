import { render } from 'preact-render-to-string';
import { describe, expect, it } from 'vitest';
import { Avatar, ChipRonda, Estrellas, Insignia, Opcion, ParadaMapa, Reloj } from '../app/src/componentes';
import { ContextoTema } from '../app/src/temas/contexto';
import { temaVibrante } from '../app/src/temas/vibrante';

describe('componentes', () => {
  it('el reloj cambia de forma según el tema (círculo en Vibrante, línea en Solemne)', () => {
    expect(render(<Reloj segundos={19} />)).toContain('reloj--circular');
    const solemne = { ...temaVibrante, nombre: 'Solemne', reloj: 'linea' as const };
    expect(
      render(
        <ContextoTema.Provider value={solemne}>
          <Reloj segundos={19} />
        </ContextoTema.Provider>,
      ),
    ).toContain('reloj--linea');
  });

  it('el reloj: corre, se pone rojo en los últimos 5 s, se detiene y se agota', () => {
    expect(render(<Reloj segundos={6} />)).toContain('reloj--corriendo');
    expect(render(<Reloj segundos={5} />)).toContain('reloj--urgente');
    expect(render(<Reloj segundos={14} detenido />)).toContain('reloj--detenido');
    expect(render(<Reloj segundos={0} />)).toContain('reloj--agotado');
  });

  it('la opción correcta muestra los puntos; la incorrecta solo «Incorrecto»', () => {
    const correcta = render(<Opcion letra="B" texto="Que la pena cayera sobre ellos" estado="correcta" puntos={80} />);
    expect(correcta).toContain('+80');
    expect(correcta).toContain('opcion--correcta');
    const incorrecta = render(<Opcion letra="A" texto="Volver al Edén" estado="incorrecta" puntos={100} />);
    expect(incorrecta).toContain('Incorrecto');
    expect(incorrecta).not.toContain('+100');
    expect(render(<Opcion letra="C" texto="Un ángel" estado="atenuada" />)).toContain('disabled');
  });

  it('chip de ronda, estrellas, insignia, avatar y parada', () => {
    expect(render(<ChipRonda ronda={4} />)).toContain('Ronda 4 · Aplicación');
    expect(render(<ChipRonda ronda={4} />)).toContain('ronda-4');
    expect(render(<Estrellas ganadas={2} />).match(/estrella--ganada/g)).toHaveLength(2);
    expect(render(<Estrellas ganadas={2} />)).toContain('2 de 3 estrellas');
    expect(render(<Insignia numero={5} ganada={false} />)).toContain('por ganar');
    expect(render(<Avatar nombre="sofi" color="azul" />)).toContain('>S<');
    expect(render(<ParadaMapa numero={5} estado="bloqueada" />)).toContain('disabled');
    expect(render(<ParadaMapa numero={4} estado="disponible" />)).toContain('Capítulo 4, disponible');
  });
});
