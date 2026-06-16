import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IndexedDbService } from '../../services/indexed-db.service';
import { SyncQueueService } from '../../services/sync-queue.service';
import { claseEstadoSync, etiquetaEstadoSync } from '../../utils/sync-status.util';

@Component({
  selector: 'app-sincronizacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sincronizacion.component.html',
  styleUrl: './sincronizacion.component.css'
})
export class SincronizacionComponent implements OnInit {

  pendientes: any[] = [];
  errores: any[] = [];
  conflictos: any[] = [];
  detalleSeleccionado: any = null;

  mensaje = '';
  sincronizando = false;

  get online(): boolean {
    return navigator.onLine;
  }

  constructor(
    private indexedDb: IndexedDbService,
    private syncQueue: SyncQueueService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();

    window.addEventListener('online', () => {
      this.sincronizar();
    });
  }

  cargarDatos(): void {
    this.indexedDb.obtenerPendientes()
      .then(data => this.pendientes = data)
      .catch(err => console.error(err));

    this.indexedDb.obtenerTodos('syncErrors')
      .then(data => this.errores = data)
      .catch(err => console.error(err));

    this.indexedDb.obtenerTodos('conflicts')
      .then(data => this.conflictos = data)
      .catch(err => console.error(err));
  }

  sincronizar(): void {
    if (!navigator.onLine) {
      this.mensaje = 'No hay conexion a internet';
      return;
    }

    this.sincronizando = true;
    this.mensaje = 'Sincronizando...';

    this.syncQueue.sincronizarPendientes()
      .then(() => {
        this.mensaje = 'Sincronizacion finalizada';
        this.detalleSeleccionado = null;
        this.cargarDatos();
      })
      .catch(err => {
        console.error(err);
        this.mensaje = 'Error durante la sincronizacion';
      })
      .finally(() => {
        this.sincronizando = false;
      });
  }

  verDetalle(item: any): void {
    this.detalleSeleccionado = item;
  }

  async resolverConLocal(conflicto: any): Promise<void> {
    const pendiente = await this.indexedDb.obtenerPorUuid('syncQueue', conflicto.uuidLocal);

    if (pendiente) {
      pendiente.estado = 'PENDIENTE';
      pendiente.fechaResolucionConflicto = new Date().toISOString();
      await this.indexedDb.guardar('syncQueue', pendiente);
    }

    conflicto.estado = 'RESUELTO_LOCAL';
    conflicto.fechaResolucion = new Date().toISOString();
    await this.indexedDb.guardar('conflicts', conflicto);
    this.mensaje = 'Conflicto resuelto usando la version local';
    this.cargarDatos();
  }

  async resolverConRemoto(conflicto: any): Promise<void> {
    const pendiente = await this.indexedDb.obtenerPorUuid('syncQueue', conflicto.uuidLocal);

    if (pendiente) {
      pendiente.estado = 'SINCRONIZADO';
      pendiente.fechaResolucionConflicto = new Date().toISOString();
      await this.indexedDb.guardar('syncQueue', pendiente);
    }

    conflicto.estado = 'RESUELTO_REMOTO';
    conflicto.fechaResolucion = new Date().toISOString();
    await this.indexedDb.guardar('conflicts', conflicto);
    this.mensaje = 'Conflicto resuelto usando la version remota';
    this.detalleSeleccionado = null;
    this.cargarDatos();
  }

  cerrarDetalle(): void {
    this.detalleSeleccionado = null;
  }

  etiquetaSync(valor: any): string {
    return etiquetaEstadoSync(valor);
  }

  claseSync(valor: any): string {
    return claseEstadoSync(valor);
  }

  detalleJson(valor: any): string {
    return JSON.stringify(valor, null, 2);
  }
}
