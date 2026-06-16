import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IndexedDbService } from '../../services/indexed-db.service';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

  cargando = true;

  resumen = {
    pacientes: 0,
    pacientesActivos: 0,
    citas: 0,
    citasHoy: 0,
    atenciones: 0,
    inasistencias: 0,
    pendientes: 0,
    errores: 0
  };

  citasPorEstado: Array<{ estado: string; total: number; porcentaje: number }> = [];
  citasPorEspecialidad: Array<{ especialidad: string; total: number }> = [];
  prediccionesPorRiesgo: Array<{ riesgo: string; total: number }> = [];
  actividadReciente: Array<{ tipo: string; descripcion: string; fecha: string }> = [];

  constructor(
    private indexedDb: IndexedDbService,
    private citaOfflineService: CitaOfflineService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    this.generarReporteLocal();
  }

  async generarReporteLocal(): Promise<void> {
    this.cargando = true;
    await this.sincronizarBaseLocal();

    const [
      pacientes,
      citas,
      atenciones,
      predicciones,
      pendientes,
      errores
    ] = await Promise.all([
      this.indexedDb.obtenerTodos('pacientes'),
      this.indexedDb.obtenerTodos('citas'),
      this.indexedDb.obtenerTodos('atenciones'),
      this.indexedDb.obtenerTodos('predicciones'),
      this.indexedDb.obtenerTodos('syncQueue'),
      this.indexedDb.obtenerTodos('syncErrors')
    ]);

    const hoy = new Date().toISOString().split('T')[0];
    const pacientesActualesIds = new Set(
      pacientes
        .map((p: any) => p.id || p.pacienteId)
        .filter(Boolean)
        .map((id: any) => String(id))
    );
    const citasVigentes = citas.filter((c: any) => {
      const pacienteId = c.pacienteId || c.paciente?.id;
      return pacienteId && pacientesActualesIds.has(String(pacienteId));
    });
    const atencionesVigentes = atenciones.filter((a: any) => {
      const pacienteId = a.pacienteId || a.paciente?.id;
      return !pacienteId || pacientesActualesIds.has(String(pacienteId));
    });
    const prediccionesVigentes = predicciones.filter((p: any) => {
      const pacienteId = p.pacienteId || p.paciente?.id;
      return !pacienteId || pacientesActualesIds.has(String(pacienteId));
    });

    this.resumen = {
      pacientes: pacientes.length,
      pacientesActivos: pacientes.filter((p: any) => p.estado !== false).length,
      citas: citasVigentes.length,
      citasHoy: citasVigentes.filter((c: any) => c.fecha === hoy).length,
      atenciones: atencionesVigentes.length,
      inasistencias: citasVigentes.filter((c: any) => c.estado === 'NO_ASISTIO').length,
      pendientes: pendientes.filter((p: any) => p.estado === 'PENDIENTE').length,
      errores: errores.length
    };

    this.citasPorEstado = this.agruparConPorcentaje(citasVigentes, 'estado');
    this.citasPorEspecialidad = this.agrupar(citasVigentes, 'especialidad')
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    this.prediccionesPorRiesgo = this.agruparRiesgo(prediccionesVigentes);
    this.actividadReciente = this.obtenerActividadReciente(pacientes, citasVigentes, atencionesVigentes);

    await this.indexedDb.guardar('reportes', {
      uuidLocal: 'reporte-local-general',
      fechaGeneracion: new Date().toISOString(),
      resumen: this.resumen,
      citasPorEstado: this.citasPorEstado,
      citasPorEspecialidad: this.citasPorEspecialidad,
      prediccionesPorRiesgo: this.prediccionesPorRiesgo
    });

    this.cargando = false;
  }

  porcentajeInasistencia(): number {
    return this.resumen.citas > 0
      ? Math.round((this.resumen.inasistencias / this.resumen.citas) * 100)
      : 0;
  }

  private agrupar(items: any[], campo: string): Array<{ especialidad: string; total: number }> {
    const mapa = new Map<string, number>();

    items.forEach(item => {
      const clave = campo === 'especialidad'
        ? this.normalizarEspecialidad(item[campo]) || 'SIN_DATO'
        : item[campo] || 'SIN_DATO';
      mapa.set(clave, (mapa.get(clave) || 0) + 1);
    });

    return Array.from(mapa.entries()).map(([especialidad, total]) => ({ especialidad, total }));
  }

  private agruparConPorcentaje(items: any[], campo: string): Array<{ estado: string; total: number; porcentaje: number }> {
    const mapa = new Map<string, number>();

    items.forEach(item => {
      const clave = item[campo] || 'SIN_DATO';
      mapa.set(clave, (mapa.get(clave) || 0) + 1);
    });

    return Array.from(mapa.entries()).map(([estado, total]) => ({
      estado,
      total,
      porcentaje: items.length > 0 ? Math.round((total / items.length) * 100) : 0
    }));
  }

  private agruparRiesgo(items: any[]): Array<{ riesgo: string; total: number }> {
    const mapa = new Map<string, number>();

    items.forEach(item => {
      const clave = item.nivelRiesgo || 'SIN_DATO';
      mapa.set(clave, (mapa.get(clave) || 0) + 1);
    });

    return Array.from(mapa.entries()).map(([riesgo, total]) => ({ riesgo, total }));
  }

  private obtenerActividadReciente(pacientes: any[], citas: any[], atenciones: any[]): Array<{ tipo: string; descripcion: string; fecha: string }> {
    return [
      ...pacientes.map((p: any) => ({
        tipo: 'Paciente',
        descripcion: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.numeroDocumento || 'Paciente',
        fecha: p.fechaActualizacionLocal || p.fechaCreacionLocal || ''
      })),
      ...citas.map((c: any) => ({
        tipo: 'Cita',
        descripcion: `${this.normalizarEspecialidad(c.especialidad) || 'Sin especialidad'} - ${c.estado || 'SIN_ESTADO'}`,
        fecha: c.fechaActualizacionLocal || c.fechaCreacionLocal || c.fecha || ''
      })),
      ...atenciones.map((a: any) => ({
        tipo: 'Atencion',
        descripcion: a.diagnostico || a.motivoConsulta || 'Atencion medica',
        fecha: a.fechaCreacionLocal || a.fechaHora || ''
      }))
    ]
      .filter(item => item.fecha)
      .sort((a, b) => `${b.fecha}`.localeCompare(`${a.fecha}`))
      .slice(0, 8);
  }

  private async sincronizarBaseLocal(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      await Promise.all([
        firstValueFrom(this.pacienteService.listar()),
        firstValueFrom(this.citaOfflineService.listar())
      ]);
    } catch (error) {
      console.warn('No se pudo refrescar IndexedDB antes de generar reportes.', error);
    }
  }

  private normalizarEspecialidad(valor: any): string {
    const texto = String(valor || '').trim().replace(/\s+/g, ' ');

    if (!texto) return '';

    return texto
      .toLocaleLowerCase('es-PE')
      .split(' ')
      .map(palabra => palabra.charAt(0).toLocaleUpperCase('es-PE') + palabra.slice(1))
      .join(' ');
  }
}
