import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PacienteCitasComponent } from './paciente-citas.component';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { IndexedDbService } from '../../services/indexed-db.service';
import { PacienteService } from '../../services/paciente.service';
import { PrediccionService } from '../../services/prediccion.service';
import { SyncQueueService } from '../../services/sync-queue.service';

describe('PacienteCitasComponent - CP017', () => {
  let component: PacienteCitasComponent;
  let db: IndexedDbService;
  let citas: CitaOfflineService;
  let http: jasmine.SpyObj<HttpClient>;
  let nombreDb: string;

  beforeEach(() => {
    // Base aislada: las pruebas no modifican los datos del dispositivo.
    nombreDb = `cp017-${crypto.randomUUID()}`;
    const abrir = indexedDB.open.bind(indexedDB);
    spyOn(indexedDB, 'open').and.callFake((_nombre, version) => abrir(nombreDb, version));
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'put', 'post']);
    http.get.and.returnValue(throwError(() => ({ status: 0 })));
    http.put.and.returnValue(throwError(() => ({ status: 0 })));
    spyOn(console, 'warn');
    TestBed.configureTestingModule({ providers: [
      IndexedDbService, CitaOfflineService, { provide: HttpClient, useValue: http }
    ] });
    db = TestBed.inject(IndexedDbService);
    citas = TestBed.inject(CitaOfflineService);
    component = new PacienteCitasComponent(
      { snapshot: { queryParamMap: { get: () => null } } } as unknown as ActivatedRoute,
      {} as PacienteService, citas, {} as PrediccionService
    );
    component.pacienteId = 1;
  });

  afterEach(async () => {
    await db.obtenerTodos('citas');
    // Cerrar la conexión antes de eliminar únicamente la base creada por la prueba.
    (db as unknown as { db: IDBDatabase }).db.close();
    await new Promise<void>((resolve, reject) => {
      const eliminar = indexedDB.deleteDatabase(nombreDb);
      eliminar.onsuccess = () => resolve();
      eliminar.onerror = () => reject(eliminar.error);
    });
  });

  for (const id of [undefined, 17]) {
    for (const orden of [1, -1]) {
    it(`cancela y sincroniza sin duplicar una cita ${id ? 'del servidor' : 'creada offline'} (orden ${orden})`, async () => {
      const original = {
        id, uuidLocal: 'cita-original', estado: 'PROGRAMADA', estadoSync: 'PENDIENTE',
        pacienteId: 1, medicoId: 2, tipoCita: 'CONSULTA', fecha: '2026-11-05',
        hora: '10:00', especialidad: 'Medicina General', motivoConsulta: 'Control',
        fechaCreacionLocal: '2026-11-04T10:00:00'
      };
      await db.guardar('citas', original);
      if (!id) await db.agregarPendiente('CITA', 'CREAR', original);
      component.abrirDetalle(original);
      expect(component.citaEditando.uuidLocal).toBe(original.uuidLocal);

      // Esperar también la recarga del historial que se inicia al terminar el guardado.
      let recargado!: () => void;
      const fin = new Promise<void>(resolve => recargado = resolve);
      spyOn(component, 'cargarCitasPaciente').and.callFake(() => {
        citas.listarPorPaciente(1).subscribe(data => {
          component.citas = data;
          component.aplicarFiltros();
          recargado();
        });
      });
      component.confirmarCancelacion();
      await fin;

      const guardadas = await db.obtenerTodos('citas');
      expect(guardadas.length).toBe(1);
      expect(guardadas[0]).toEqual(jasmine.objectContaining({
        uuidLocal: original.uuidLocal, id, estado: 'CANCELADA', estadoSync: 'PENDIENTE',
        fechaCreacionLocal: original.fechaCreacionLocal
      }));
      expect(component.citasFiltradas.length).toBe(1);
      expect(component.citasFiltradas[0].estado).toBe('CANCELADA');
      const pendientes = await db.obtenerPendientes();
      const actualizacion = pendientes.find(p => p.accion === 'ACTUALIZAR');
      expect(actualizacion.data.uuidLocal).toBe(original.uuidLocal);
      expect(actualizacion.data.estado).toBe('CANCELADA');
      expect(http.put.calls.count()).toBe(id ? 1 : 0);
      expect((await firstValueFrom(citas.listarPorPaciente(1))).length).toBe(1);

      // Restablecer la conexión y sincronizar con respuestas remotas simuladas.
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
      const remotas = new Map<string, any>();
      if (id) remotas.set(original.uuidLocal, { ...original });
      http.post.and.callFake((_url: string, payload: any) => {
        const remoto = { ...payload, id: remotas.get(payload.uuidLocal)?.id || 99 };
        remotas.set(payload.uuidLocal, remoto);
        return of(remoto);
      });
      http.put.and.callFake((_url: string, payload: any) => {
        const remoto = { ...payload, id: id || 99, uuidLocal: original.uuidLocal };
        remotas.set(original.uuidLocal, remoto);
        return of(remoto);
      });
      // getAll ordena por UUID de la operación, no por fecha. Forzar ambos órdenes.
      const obtenerPendientes = db.obtenerPendientes.bind(db);
      spyOn(db, 'obtenerPendientes').and.callFake(async () =>
        (await obtenerPendientes()).sort((a, b) => orden * a.accion.localeCompare(b.accion))
      );
      await new SyncQueueService(http, db).sincronizarPendientes();

      expect(remotas.size).toBe(1);
      expect(remotas.get(original.uuidLocal).estado).toBe('CANCELADA');
      expect((await db.obtenerTodos('citas')).length).toBe(1);
      expect((await db.obtenerTodos('citas'))[0]).toEqual(jasmine.objectContaining({
        uuidLocal: original.uuidLocal, estado: 'CANCELADA', estadoSync: 'SINCRONIZADO'
      }));
      expect(await db.obtenerPendientes()).toEqual([]);
      http.get.and.returnValue(of([...remotas.values()]));
      const historial = await firstValueFrom(citas.listarPorPaciente(1));
      expect(historial.length).toBe(1);
      expect(historial[0].estado).toBe('CANCELADA');
    });
    }
  }
});
