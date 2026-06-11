import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IndexedDbService } from '../../services/indexed-db.service';
import { SyncQueueService } from '../../services/sync-queue.service';

@Component({
  selector: 'app-sincronizacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sincronizacion.component.html',
  styleUrl: './sincronizacion.component.css'
})
export class SincronizacionComponent implements OnInit {

  pendientes: any[] = [];
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
    this.cargarPendientes();

    window.addEventListener('online', () => {
      this.sincronizar();
    });
  }

  cargarPendientes(): void {
    this.indexedDb.obtenerPendientes()
      .then(data => this.pendientes = data)
      .catch(err => console.error(err));
  }

  sincronizar(): void {
    if (!navigator.onLine) {
      this.mensaje = 'No hay conexión a internet';
      return;
    }

    this.sincronizando = true;
    this.mensaje = 'Sincronizando...';

    this.syncQueue.sincronizarPendientes()
      .then(() => {
        this.mensaje = 'Sincronización finalizada';
        this.cargarPendientes();
      })
      .catch(err => {
        console.error(err);
        this.mensaje = 'Error durante la sincronización';
      })
      .finally(() => {
        this.sincronizando = false;
      });
  }
}