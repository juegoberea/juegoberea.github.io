// Acciones muy delicadas: además de la sesión con el código de 6 números, exigen un desafío nuevo
// (de un solo uso, vence a los 5 minutos) firmado con el SELLO de la autora, que vive en su pendrive.
// El archivo del sello nunca sale de su computadora: aquí solo llega la firma.
//   { accion, desafio, firma, datos? }

import * as ed from 'npm:@noble/ed25519@2.3.0';
import { crearArchivoClave } from '../_shared/generado/clave-firma.ts';
import { deHex } from '../_shared/generado/codificacion.ts';
import { ACCIONES_DELICADAS, textoDelDesafio, type AccionDelicada } from '../_shared/generado/sello.ts';
import { anotar, comprobarAutora, json, LIBRO, Rechazo, servir, type Llamada } from '../_shared/servidor.ts';

const NOMBRE: Record<AccionDelicada, string> = {
  crear_llave: 'Crear una llave de firma nueva',
  descargar_llave: 'Descargar la llave de firma',
  descargar_copia: 'Descargar una copia de todo',
  pasar_proyecto: 'Pasar el proyecto a otra persona',
  retirar: 'Retirar el contenido publicado',
  borrar_libro: 'Borrar un libro',
  borrar_banco: 'Borrar todo el banco',
  cambiar_usuario: 'Cambiar el usuario',
  cambiar_contrasena: 'Cambiar la contraseña',
  ver_codigos: 'Ver los códigos de recuperación',
};

interface Resultado {
  mensaje: string;
  archivo?: { nombre: string; texto: string };
  codigos?: string[];
}

async function ejecutar(accion: AccionDelicada, datos: Record<string, unknown>, l: Llamada): Promise<Resultado> {
  const { admin } = l;
  switch (accion) {
    case 'retirar': {
      await admin.storage.from('contenido').remove(['contenido.bin']);
      await admin.from('versiones').update({ retirada_en: new Date().toISOString() }).is('retirada_en', null);
      return { mensaje: 'Se retiró el contenido publicado. Los jugadores conservan lo que ya tienen y no recibirán cambios hasta que vuelvas a publicar.' };
    }
    case 'borrar_libro':
    case 'borrar_banco': {
      const consulta = admin.from('capitulos').delete();
      const { error } = await (accion === 'borrar_libro' ? consulta.eq('libro_id', LIBRO) : consulta.gte('numero', 0));
      if (error) throw new Error(error.message);
      return { mensaje: accion === 'borrar_libro' ? 'Se borró Patriarcas y Profetas del banco. Lo publicado no cambia.' : 'Se borró todo el banco. Lo publicado no cambia.' };
    }
    case 'descargar_copia': {
      const tablas = ['libros', 'capitulos', 'preguntas', 'versiones', 'registro'];
      const copia: Record<string, unknown> = { tipo: 'berea-copia-del-banco', creada: new Date().toISOString() };
      for (const t of tablas) copia[t] = (await admin.from(t).select('*').limit(100000)).data;
      return { mensaje: 'Copia lista. Guárdala en tu pendrive.', archivo: { nombre: `Berea-copia-${new Date().toISOString().slice(0, 10)}.json`, texto: JSON.stringify(copia, null, 1) } };
    }
    case 'descargar_llave':
      return { mensaje: 'Esta es la llave que firma al publicar. Guárdala solo en tu pendrive.', archivo: { nombre: 'berea-clave-de-firma.json', texto: Deno.env.get('BEREA_CLAVE_FIRMA') ?? '' } };
    case 'crear_llave': {
      const privada = ed.utils.randomPrivateKey();
      const archivo = crearArchivoClave(privada, await ed.getPublicKeyAsync(privada));
      return {
        mensaje: 'Se creó una llave nueva y se descargó. Todavía NO reemplaza a la actual: para que el juego la acepte, el programador debe ponerla en el servidor y publicar una versión del juego con su parte pública. Hasta entonces se sigue firmando con la llave de siempre.',
        archivo: { nombre: 'berea-clave-de-firma-NUEVA.json', texto: JSON.stringify(archivo, null, 2) },
      };
    }
    case 'pasar_proyecto':
      return { mensaje: 'Quedó anotado. Para pasar el proyecto: en supabase.com, invita a la nueva persona como dueña (Owner) de la organización «Berea»; en GitHub, transfiere el repositorio «berea» desde Settings. Entrégale también el sobre y el pendrive.' };
    case 'cambiar_usuario': {
      const usuario = String(datos.usuario ?? '').trim().toLowerCase();
      if (!/^[a-z][a-z0-9._-]{2,30}$/.test(usuario)) throw new Rechazo('El usuario debe tener entre 3 y 31 letras o números, sin espacios.');
      const { error } = await admin.auth.admin.updateUserById(l.autora, { email: `${usuario}@berea.invalid`, email_confirm: true });
      if (error) throw new Rechazo(error.message);
      return { mensaje: `Listo. Desde ahora entras con el usuario «${usuario}».` };
    }
    case 'cambiar_contrasena': {
      const contrasena = String(datos.contrasena ?? '');
      if (contrasena.length < 8) throw new Rechazo('La contraseña debe tener al menos 8 letras.');
      const { error } = await admin.auth.admin.updateUserById(l.autora, { password: contrasena });
      if (error) throw new Rechazo(error.message);
      return { mensaje: 'Listo. Anota la contraseña nueva en tu sobre.' };
    }
    case 'ver_codigos': {
      const { data, error } = await admin.rpc('servidor_nuevos_codigos');
      if (error) throw new Error(error.message);
      return { mensaje: 'Estos son tus códigos nuevos. Los anteriores ya no sirven: reemplázalos en tu sobre.', codigos: data as string[] };
    }
  }
}

servir(async (pedido) => {
  const l = await comprobarAutora(pedido);
  const { accion, desafio, firma, datos } = (await pedido.json().catch(() => ({}))) as { accion?: string; desafio?: string; firma?: string; datos?: Record<string, unknown> };
  if (!ACCIONES_DELICADAS.includes(accion as AccionDelicada)) throw new Rechazo('Acción desconocida.');
  const a = accion as AccionDelicada;

  const { data: publica, error } = await l.admin.rpc('servidor_usar_desafio', { p_id: desafio ?? '', p_accion: a });
  if (error || typeof publica !== 'string') {
    await anotar(l, 'accion_delicada', `${NOMBRE[a]} · desafío vencido, usado o inexistente`, 'rechazado');
    throw new Rechazo('El sello no se pudo comprobar: vuelve a intentarlo (cada intento sirve una sola vez y vence a los 5 minutos).', 403);
  }
  let valida = false;
  try {
    valida = await ed.verifyAsync(deHex(firma ?? ''), textoDelDesafio(desafio!, a), deHex(publica));
  } catch {
    valida = false;
  }
  if (!valida) {
    await anotar(l, 'accion_delicada', `${NOMBRE[a]} · el sello no es el de la autora`, 'rechazado');
    throw new Rechazo('Ese archivo no es tu sello. Usa el sello de tu pendrive.', 403);
  }

  const resultado = await ejecutar(a, datos ?? {}, l);
  await anotar(l, 'accion_delicada', NOMBRE[a]);
  return json(resultado);
});
