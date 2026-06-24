import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {

  private dbName = 'hce_offline_db';
  private dbVersion = 3;
  private db!: IDBDatabase;
  private dbReady!: Promise<IDBDatabase>;

  private stores = [
    'pacientes',
    'citas',
    'atenciones',
    'predicciones',
    'usuarios',
    'dashboard',
    'reportes',
    'syncErrors',
    'conflicts',
    'syncQueue'
  ];

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;

        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: 'uuidLocal'
            });
          }
        });
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbReady;
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async guardar(storeName: string, data: any): Promise<any> {
    if (!data.uuidLocal) {
      data.uuidLocal = crypto.randomUUID();
    }

    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerTodos(storeName: string): Promise<any[]> {
    const store = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerPorUuid(storeName: string, uuidLocal: string): Promise<any> {
    const store = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(uuidLocal);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async eliminar(storeName: string, uuidLocal: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.delete(uuidLocal);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async eliminarErrorSync(uuidLocal: string): Promise<void> {
    return this.eliminar('syncErrors', uuidLocal);
  }

  async agregarPendiente(entidad: string, accion: string, data: any): Promise<any> {
    const pendiente = {
      uuidLocal: crypto.randomUUID(),
      entidad,
      accion,
      data,
      estado: 'PENDIENTE',
      fechaCreacionLocal: new Date().toISOString()
    };

    return this.guardar('syncQueue', pendiente);
  }

  async obtenerPendientes(): Promise<any[]> {
    const pendientes = await this.obtenerTodos('syncQueue');
    return pendientes.filter(p => p.estado === 'PENDIENTE');
  }

  async marcarSincronizado(uuidLocal: string): Promise<any> {
    const pendiente = await this.obtenerPorUuid('syncQueue', uuidLocal);

    if (!pendiente) {
      throw new Error('Pendiente no encontrado');
    }

    pendiente.estado = 'SINCRONIZADO';
    pendiente.fechaSincronizacion = new Date().toISOString();

    return this.guardar('syncQueue', pendiente);
  }

  async marcarErrorSync(uuidLocal: string, error: any): Promise<any> {
    const pendiente = await this.obtenerPorUuid('syncQueue', uuidLocal);

    if (!pendiente) {
      throw new Error('Pendiente no encontrado');
    }

    pendiente.estado = 'ERROR_SYNC';
    pendiente.fechaError = new Date().toISOString();
    pendiente.error = this.normalizarError(error);

    await this.guardar('syncErrors', {
      uuidLocal,
      entidad: pendiente.entidad,
      accion: pendiente.accion,
      data: pendiente.data,
      error: pendiente.error,
      fechaError: pendiente.fechaError,
      estado: 'ERROR_SYNC'
    });

    return this.guardar('syncQueue', pendiente);
  }

  async registrarConflicto(pendiente: any, remoto: any, motivo: string): Promise<any> {
    const conflicto = {
      uuidLocal: pendiente.uuidLocal,
      entidad: pendiente.entidad,
      accion: pendiente.accion,
      local: pendiente.data,
      remoto,
      motivo,
      estado: 'PENDIENTE',
      fechaRegistro: new Date().toISOString()
    };

    return this.guardar('conflicts', conflicto);
  }

  private normalizarError(error: any): string {
    return error?.error?.message ||
      error?.message ||
      error?.statusText ||
      'Error desconocido durante la sincronizacion';
  }
}
