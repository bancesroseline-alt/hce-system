import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';

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

  constructor(private indexedDb: IndexedDbService) {}

  ngOnInit(): void {
    this.generarReporteLocal();
  }

  async generarReporteLocal(): Promise<void> {
    this.cargando = true;

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

    this.resumen = {
      pacientes: pacientes.length,
      pacientesActivos: pacientes.filter((p: any) => p.estado !== false).length,
      citas: citas.length,
      citasHoy: citas.filter((c: any) => c.fecha === hoy).length,
      atenciones: atenciones.length,
      inasistencias: citas.filter((c: any) => c.estado === 'NO_ASISTIO').length,
      pendientes: pendientes.filter((p: any) => p.estado === 'PENDIENTE').length,
      errores: errores.length
    };

    this.citasPorEstado = this.agruparConPorcentaje(citas, 'estado');
    this.citasPorEspecialidad = this.agrupar(citas, 'especialidad')
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    this.prediccionesPorRiesgo = this.agruparRiesgo(predicciones);
    this.actividadReciente = this.obtenerActividadReciente(pacientes, citas, atenciones);

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
      const clave = item[campo] || 'SIN_DATO';
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
        descripcion: `${c.especialidad || 'Sin especialidad'} - ${c.estado || 'SIN_ESTADO'}`,
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
}
