// Base de datos del aparato (IndexedDB): perfiles y avance por perfil y por libro.

import { progresoVacio } from './progreso';
import {
  AJUSTES_INICIALES,
  COLORES_AVATAR,
  LARGO_MAXIMO_NOMBRE,
  type Ajustes,
  type ColorAvatar,
  type Perfil,
  type ProgresoLibro,
} from './tipos';

const VERSION_BASE = 1;
const PERFILES = 'perfiles';
const PROGRESO = 'progreso';

function pedido<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rechazar) => {
    req.onsuccess = () => resolver(req.result);
    req.onerror = () => rechazar(req.error);
  });
}

function transaccionTerminada(tx: IDBTransaction): Promise<void> {
  return new Promise((resolver, rechazar) => {
    tx.oncomplete = () => resolver();
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error ?? new Error('Transacción cancelada'));
  });
}

function nuevoId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Navegadores antiguos sin randomUUID.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Quita espacios de más y limita el largo. Lanza un error si queda vacío. */
export function limpiarNombre(nombre: string): string {
  const limpio = nombre.replace(/\s+/g, ' ').trim().slice(0, LARGO_MAXIMO_NOMBRE);
  if (!limpio) throw new Error('Escribe tu nombre o apodo.');
  return limpio;
}

export class Datos {
  private constructor(private readonly db: IDBDatabase) {}

  /** Abre (o crea) la base de datos y pide al navegador que no la borre por falta de espacio. */
  static async abrir(nombre = 'berea'): Promise<Datos> {
    const req = indexedDB.open(nombre, VERSION_BASE);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PERFILES)) db.createObjectStore(PERFILES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PROGRESO)) db.createObjectStore(PROGRESO, { keyPath: ['perfilId', 'libroId'] });
    };
    const db = await pedido(req);
    await pedirAlmacenamientoPersistente();
    return new Datos(db);
  }

  cerrar(): void {
    this.db.close();
  }

  // ---------- Perfiles ----------

  async listarPerfiles(): Promise<Perfil[]> {
    const perfiles = await pedido(this.db.transaction(PERFILES).objectStore(PERFILES).getAll() as IDBRequest<Perfil[]>);
    return perfiles.sort((a, b) => a.creado.localeCompare(b.creado));
  }

  async obtenerPerfil(id: string): Promise<Perfil | undefined> {
    return pedido(this.db.transaction(PERFILES).objectStore(PERFILES).get(id) as IDBRequest<Perfil | undefined>);
  }

  async crearPerfil(nombre: string, color: ColorAvatar): Promise<Perfil> {
    if (!COLORES_AVATAR.includes(color)) throw new Error(`Color de avatar desconocido: ${color}`);
    const perfil: Perfil = { id: nuevoId(), nombre: limpiarNombre(nombre), color, creado: new Date().toISOString(), ajustes: { ...AJUSTES_INICIALES } };
    await this.guardarPerfil(perfil);
    return perfil;
  }

  async guardarPerfil(perfil: Perfil): Promise<void> {
    const tx = this.db.transaction(PERFILES, 'readwrite');
    tx.objectStore(PERFILES).put(perfil);
    await transaccionTerminada(tx);
  }

  async guardarAjustes(perfilId: string, ajustes: Ajustes): Promise<Perfil> {
    const perfil = await this.obtenerPerfil(perfilId);
    if (!perfil) throw new Error('El perfil no existe.');
    const actualizado = { ...perfil, ajustes: { ...ajustes } };
    await this.guardarPerfil(actualizado);
    return actualizado;
  }

  // ---------- Avance por libro ----------

  async obtenerProgreso(perfilId: string, libroId: string): Promise<ProgresoLibro> {
    const guardado = await pedido(
      this.db.transaction(PROGRESO).objectStore(PROGRESO).get([perfilId, libroId]) as IDBRequest<ProgresoLibro | undefined>,
    );
    return guardado ?? progresoVacio(perfilId, libroId);
  }

  async listarProgresos(perfilId: string): Promise<ProgresoLibro[]> {
    const rango = IDBKeyRange.bound([perfilId, ''], [perfilId, '￿']);
    return pedido(this.db.transaction(PROGRESO).objectStore(PROGRESO).getAll(rango) as IDBRequest<ProgresoLibro[]>);
  }

  async guardarProgreso(progreso: ProgresoLibro): Promise<void> {
    const tx = this.db.transaction(PROGRESO, 'readwrite');
    tx.objectStore(PROGRESO).put(progreso);
    await transaccionTerminada(tx);
  }

  /** Guarda la reflexión de un capítulo en «Mi diario». Un texto vacío no se guarda. */
  async guardarReflexion(perfilId: string, libroId: string, capitulo: number, texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    const progreso = await this.obtenerProgreso(perfilId, libroId);
    progreso.diario[capitulo] = { texto: limpio, fecha: new Date().toISOString() };
    await this.guardarProgreso(progreso);
  }

  /** Reemplaza un perfil completo y su avance (al recuperar una copia de respaldo). */
  async reemplazarPerfil(perfil: Perfil, progresos: ProgresoLibro[]): Promise<void> {
    const tx = this.db.transaction([PERFILES, PROGRESO], 'readwrite');
    tx.objectStore(PERFILES).put(perfil);
    const almacen = tx.objectStore(PROGRESO);
    const anteriores = await pedido(almacen.getAllKeys(IDBKeyRange.bound([perfil.id, ''], [perfil.id, '￿'])));
    for (const clave of anteriores) almacen.delete(clave);
    for (const p of progresos) almacen.put(p);
    await transaccionTerminada(tx);
  }
}

async function pedirAlmacenamientoPersistente(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      if (!(await navigator.storage.persisted())) await navigator.storage.persist();
    }
  } catch {
    // Si el navegador no lo permite, los datos se guardan igual.
  }
}
