// Página del convertidor: la autora arrastra la clave y el Excel, revisa los avisos y
// descarga contenido.bin. Todo ocurre en su PC; nada se envía a internet.

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { CLAVE_CIFRADO, CLAVE_PUBLICA } from '../../app/src/contenido/claves';
import { deBase64 } from '../../app/src/contenido/codificacion';
import { empaquetarContenido } from '../../app/src/contenido/formato';
import { armarContenido, type ResultadoConversion } from './armar-contenido';
import { describirAviso } from './avisos';
import { leerArchivoClave, NOMBRE_ARCHIVO_CLAVE } from './clave-firma';
import { leerExcel } from './leer-excel';

const GUARDADO_CLAVE = 'berea-convertidor-clave';

function leerGuardado(): string | null {
  try {
    return localStorage.getItem(GUARDADO_CLAVE);
  } catch {
    return null;
  }
}

function guardar(texto: string | null) {
  try {
    if (texto === null) localStorage.removeItem(GUARDADO_CLAVE);
    else localStorage.setItem(GUARDADO_CLAVE, texto);
  } catch {
    // Sin almacenamiento: la clave se pedirá cada vez.
  }
}

function descargar(bytes: Uint8Array, nombre: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Zona(props: { titulo: string; detalle: string; aceptar: string; alElegir: (archivos: File[]) => void }) {
  const [encima, setEncima] = useState(false);
  return (
    <label
      class={`zona${encima ? ' encima' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEncima(false);
        props.alElegir([...(e.dataTransfer?.files ?? [])]);
      }}
    >
      <strong>{props.titulo}</strong>
      <span>{props.detalle}</span>
      <input
        type="file"
        multiple
        accept={props.aceptar}
        onChange={(e) => {
          const input = e.currentTarget;
          props.alElegir([...(input.files ?? [])]);
          input.value = '';
        }}
      />
    </label>
  );
}

function Convertidor() {
  const [clave, setClave] = useState<Uint8Array | null>(null);
  const [errorClave, setErrorClave] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [nombresExcel, setNombresExcel] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoConversion | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [descargado, setDescargado] = useState(false);

  useEffect(() => {
    const guardada = leerGuardado();
    if (guardada) {
      leerArchivoClave(guardada, CLAVE_PUBLICA)
        .then(setClave)
        .catch(() => guardar(null));
    }
  }, []);

  async function cargarArchivos(archivos: File[]) {
    const claves = archivos.filter((f) => /\.json$/i.test(f.name));
    const excels = archivos.filter((f) => /\.xlsx?$/i.test(f.name));
    const otros = archivos.filter((f) => !claves.includes(f) && !excels.includes(f));

    for (const archivo of claves) {
      const texto = await archivo.text();
      try {
        setClave(await leerArchivoClave(texto, CLAVE_PUBLICA));
        setErrorClave('');
        guardar(recordar ? texto : null);
      } catch (e) {
        setErrorClave((e as Error).message);
      }
    }

    if (excels.length > 0) {
      setTrabajando(true);
      setDescargado(false);
      const lecturas = [];
      for (const archivo of excels) lecturas.push(leerExcel(await archivo.arrayBuffer(), archivo.name));
      setNombresExcel(excels.map((f) => f.name));
      setResultado(armarContenido(lecturas));
      setTrabajando(false);
    }

    if (otros.length > 0 && claves.length === 0 && excels.length === 0) {
      setErrorClave(`«${otros[0].name}» no es un Excel (.xlsx) ni la clave de firma (.json).`);
    }
  }

  async function generar() {
    if (!resultado || resultado.hayErrores || !clave) return;
    setTrabajando(true);
    try {
      // Versión y fecha del momento de la descarga.
      const ahora = new Date();
      const contenido = { ...resultado.contenido, version: ahora.getTime(), generado: ahora.toISOString() };
      descargar(await empaquetarContenido(contenido, { cifrado: deBase64(CLAVE_CIFRADO), firmaPrivada: clave }), 'contenido.bin');
      setDescargado(true);
    } finally {
      setTrabajando(false);
    }
  }

  // Soltar archivos en cualquier parte de la página también funciona.
  useEffect(() => {
    const evitar = (e: DragEvent) => e.preventDefault();
    const soltar = (e: DragEvent) => {
      e.preventDefault();
      cargarArchivos([...(e.dataTransfer?.files ?? [])]);
    };
    window.addEventListener('dragover', evitar);
    window.addEventListener('drop', soltar);
    return () => {
      window.removeEventListener('dragover', evitar);
      window.removeEventListener('drop', soltar);
    };
  });

  const errores = resultado?.avisos.filter((a) => a.tipo === 'error') ?? [];
  const advertencias = resultado?.avisos.filter((a) => a.tipo === 'advertencia') ?? [];
  const totalCapitulos = resultado?.resumen.reduce((s, l) => s + l.capitulos.length, 0) ?? 0;
  const totalPreguntas = resultado?.resumen.reduce((s, l) => s + l.capitulos.reduce((t, c) => t + c.preguntas, 0), 0) ?? 0;

  return (
    <main>
      <h1>Convertidor de Berea</h1>
      <p class="sub">
        Convierte el Excel del banco de preguntas en el archivo <b>contenido.bin</b> que usa el juego. Todo ocurre en esta PC: nada se envía a
        internet.
      </p>

      <section class={`paso${clave ? ' hecho' : ''}`}>
        <h2>
          <span class="num">{clave ? '✓' : '1'}</span> Tu clave de firma
        </h2>
        {clave ? (
          <div class="estado ok">
            <span>Clave cargada. Solo tú puedes crear contenido que el juego acepte.</span>
            <button
              class="enlace"
              onClick={() => {
                setClave(null);
                guardar(null);
              }}
            >
              Olvidar la clave en esta PC
            </button>
          </div>
        ) : (
          <>
            <Zona
              titulo={`Arrastra aquí ${NOMBRE_ARCHIVO_CLAVE}`}
              detalle="Está en la carpeta «claves» del proyecto. O haz clic para buscarlo."
              aceptar=".json"
              alElegir={cargarArchivos}
            />
            <label class="recordar">
              <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.currentTarget.checked)} />
              Recordar la clave en esta PC (así no tienes que cargarla cada vez)
            </label>
          </>
        )}
        {errorClave && (
          <div class="estado err" style={{ marginTop: 12 }}>
            {errorClave}
          </div>
        )}
      </section>

      <section class={`paso${resultado && !resultado.hayErrores ? ' hecho' : ''}`}>
        <h2>
          <span class="num">{resultado && !resultado.hayErrores ? '✓' : '2'}</span> El Excel de preguntas
        </h2>
        <Zona
          titulo="Arrastra aquí el Excel"
          detalle="Banco_Preguntas_….xlsx · O haz clic para buscarlo. Si lo corriges, vuelve a arrastrarlo."
          aceptar=".xlsx,.xls"
          alElegir={cargarArchivos}
        />
        {nombresExcel.length > 0 && <p class="archivos">Revisado: {nombresExcel.join(', ')}</p>}
      </section>

      {resultado && (
        <section class="paso">
          <h2>
            <span class="num">3</span> Revisión
          </h2>
          {resultado.hayErrores ? (
            <div class="estado err">
              Hay {errores.length} {errores.length === 1 ? 'error' : 'errores'}. Corrígelos en el Excel, guárdalo y vuelve a arrastrarlo.
            </div>
          ) : (
            <div class="estado ok">
              Todo en orden: {totalCapitulos} capítulos y {totalPreguntas} preguntas.
            </div>
          )}

          {resultado.resumen.map((libro) => (
            <div class="tabla" key={`${libro.id}-${libro.idioma}`}>
              <h3 style={{ margin: '16px 0 0', fontSize: 17 }}>
                {libro.titulo} <span class="chip ok">{libro.idioma}</span>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Cap.</th>
                    <th>Título</th>
                    <th>Preguntas</th>
                    <th>Reflexión</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {libro.capitulos.map((c) => (
                    <tr key={c.numero}>
                      <td class="n">{c.numero}</td>
                      <td>{c.titulo}</td>
                      <td class="n">{c.preguntas}</td>
                      <td>{c.tieneReflexion ? 'Sí' : <span class="chip warn">Falta</span>}</td>
                      <td>
                        {c.errores > 0 ? (
                          <span class="chip err">
                            {c.errores} {c.errores === 1 ? 'error' : 'errores'}
                          </span>
                        ) : c.advertencias > 0 ? (
                          <span class="chip warn">Revisar</span>
                        ) : (
                          <span class="chip ok">Bien</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {(errores.length > 0 || advertencias.length > 0) && (
            <ul class="avisos">
              {errores.map((a, i) => (
                <li class="error" key={`e${i}`}>
                  <b>Error · </b>
                  {describirAviso(a)}
                </li>
              ))}
              {advertencias.map((a, i) => (
                <li class="advertencia" key={`a${i}`}>
                  <b>Revisar · </b>
                  {describirAviso(a)}
                </li>
              ))}
            </ul>
          )}
          {advertencias.length > 0 && !resultado.hayErrores && (
            <p class="ayuda">Los avisos «Revisar» no impiden generar el archivo, pero conviene corregirlos.</p>
          )}
        </section>
      )}

      <section class={`paso${descargado ? ' hecho' : ''}`}>
        <h2>
          <span class="num">{descargado ? '✓' : resultado ? '4' : '3'}</span> Descargar el contenido
        </h2>
        <button class="primario" disabled={!clave || !resultado || resultado.hayErrores || trabajando} onClick={generar}>
          {trabajando ? 'Preparando…' : 'Descargar contenido.bin'}
        </button>
        <p class="ayuda">
          {!clave
            ? 'Primero carga tu clave de firma (paso 1).'
            : !resultado
              ? 'Arrastra el Excel para revisarlo.'
              : resultado.hayErrores
                ? 'Corrige los errores del Excel para poder descargar.'
                : descargado
                  ? 'Listo. Ahora sigue la guía «Cómo actualizar el contenido» para publicarlo.'
                  : 'El archivo se guardará en tu carpeta de Descargas.'}
        </p>
      </section>
    </main>
  );
}

render(<Convertidor />, document.getElementById('app')!);
