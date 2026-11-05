import { HttpClient } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { CitaOfflineService } from './cita-offline.service';
import { IndexedDbService } from './indexed-db.service';

describe('CitaOfflineService - CP024', () => {
  let service: CitaOfflineService;
  let db: jasmine.SpyObj<IndexedDbService>;
  const paciente = { id: 24, nombres: 'Joao David', apellidos: 'Jiménez Abarca' };
  let locales: any[];

  beforeEach(() => {
    locales = [];
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']);
    http.get.and.returnValue(throwError(() => ({ status: 0 })));
    http.post.and.returnValue(throwError(() => ({ status: 0 })));
    db = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', ['obtenerTodos', 'guardar', 'agregarPendiente']);
    db.obtenerTodos.and.callFake(async store => store === 'pacientes' ? [paciente] : locales.map(c => ({ ...c })));
    db.guardar.and.callFake(async (_store, cita) => { locales.push(structuredClone(cita)); return cita; });
    db.agregarPendiente.and.resolveTo({});
    spyOn(console, 'warn');
    service = new CitaOfflineService(http, db);
  });

  it('guarda el nombre completo offline y lo conserva al recargar agenda e historial', async () => {
    const cita = await firstValueFrom(service.registrar({
      pacienteId: 24, medicoId: 2, tipoCita: 'CONSULTA', fecha: '2026-11-09',
      hora: '19:14', especialidad: 'Medicina General', motivoConsulta: 'Control', estado: 'PROGRAMADA'
    }));
    expect(cita.pacienteNombre).toBe('Joao David Jiménez Abarca');
    expect(locales[0].pacienteNombre).toBe(cita.pacienteNombre);
    const agenda = await firstValueFrom(service.listar());
    const historial = await firstValueFrom(service.listarPorPaciente(24));
    expect(agenda.length).toBe(1);
    expect(agenda[0].pacienteNombre).toBe(historial[0].pacienteNombre);
    expect(agenda[0].uuidLocal).toBe(cita.uuidLocal);
    expect(agenda[0].estadoSync).toBe('PENDIENTE');
  });

  it('recupera el nombre de citas antiguas que solo guardaron el pacienteId', async () => {
    locales = [{ uuidLocal: 'existente', pacienteId: '24', estado: 'PROGRAMADA' }];
    const agenda = await firstValueFrom(service.listar());
    expect(agenda[0].paciente).toEqual(paciente);
    expect(agenda[0].pacienteNombre).toBe('Joao David Jiménez Abarca');
    expect(agenda[0].uuidLocal).toBe('existente');
    expect(db.guardar).not.toHaveBeenCalled();
  });

  it('conserva el nombre existente cuando el paciente no está en la caché', async () => {
    locales = [{ pacienteId: 99, pacienteNombre: 'Otro paciente' }];
    expect((await firstValueFrom(service.listar()))[0].pacienteNombre).toBe('Otro paciente');
  });
});
