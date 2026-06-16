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

  estadosPrincipales(): Array<{ estado: string; total: number; porcentaje: number }> {
    const estados = ['PROGRAMADA', 'ATENDIDA', 'NO_ASISTIO'];

    return estados.map(estado => {
      const encontrado = this.citasPorEstado.find(item => item.estado === estado);

      return encontrado || { estado, total: 0, porcentaje: 0 };
    });
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      PROGRAMADA: 'Programada',
      ATENDIDA: 'Atendida',
      NO_ASISTIO: 'No asistio',
      CANCELADA: 'Cancelada',
      REPROGRAMADA: 'Reprogramada',
      SIN_DATO: 'Sin dato'
    };

    return etiquetas[estado] || estado;
  }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      PROGRAMADA: '#2563EB',
      ATENDIDA: '#10B981',
      NO_ASISTIO: '#F59E0B',
      CANCELADA: '#EF4444',
      REPROGRAMADA: '#8B5CF6',
      SIN_DATO: '#64748B'
    };

    return colores[estado] || '#64748B';
  }

  donutEstadosGradient(): string {
    return this.crearDonutGradient(
      this.estadosPrincipales().map(item => ({
        porcentaje: item.porcentaje,
        color: this.colorEstado(item.estado)
      }))
    );
  }

  porcentajeEspecialidad(total: number): number {
    const mayor = Math.max(...this.citasPorEspecialidad.map(item => item.total), 1);
    return Math.round((total / mayor) * 100);
  }

  totalPredicciones(): number {
    return this.prediccionesPorRiesgo.reduce((total, item) => total + item.total, 0);
  }

  riesgosOrdenados(): Array<{ riesgo: string; total: number }> {
    const riesgos = ['Bajo', 'Medio', 'Alto'];

    return riesgos.map(riesgo => {
      const encontrado = this.prediccionesPorRiesgo.find(item =>
        this.normalizarRiesgo(item.riesgo) === riesgo.toUpperCase()
      );

      return encontrado || { riesgo, total: 0 };
    });
  }

  etiquetaRiesgo(riesgo: string): string {
    const normalizado = this.normalizarRiesgo(riesgo);

    if (normalizado === 'BAJO') return 'Bajo';
    if (normalizado === 'MEDIO') return 'Medio';
    if (normalizado === 'ALTO') return 'Alto';
    return riesgo || 'Sin dato';
  }

  colorRiesgo(riesgo: string): string {
    const normalizado = this.normalizarRiesgo(riesgo);

    if (normalizado === 'BAJO') return '#10B981';
    if (normalizado === 'MEDIO') return '#F59E0B';
    if (normalizado === 'ALTO') return '#EF4444';
    return '#64748B';
  }

  porcentajeRiesgo(total: number): number {
    const totalPredicciones = this.totalPredicciones();
    return totalPredicciones > 0 ? Math.round((total / totalPredicciones) * 100) : 0;
  }

  donutRiesgosGradient(): string {
    return this.crearDonutGradient(
      this.riesgosOrdenados().map(item => ({
        porcentaje: this.porcentajeRiesgo(item.total),
        color: this.colorRiesgo(item.riesgo)
      }))
    );
  }

  fechaActividad(fecha: string): string {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return fecha || '-';

    return valor.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  horaActividad(fecha: string): string {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return '--:--';

    return valor.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  private normalizarRiesgo(valor: any): string {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('RIESGO_', '')
      .trim()
      .toUpperCase();
  }

  private crearDonutGradient(segmentos: Array<{ porcentaje: number; color: string }>): string {
    let acumulado = 0;
    const partes = segmentos
      .filter(segmento => segmento.porcentaje > 0)
      .map(segmento => {
        const inicio = acumulado;
        acumulado += segmento.porcentaje;
        return `${segmento.color} ${inicio}% ${acumulado}%`;
      });

    if (partes.length === 0) {
      return 'conic-gradient(#E2E8F0 0% 100%)';
    }

    if (acumulado < 100) {
      partes.push(`#E2E8F0 ${acumulado}% 100%`);
    }

    return `conic-gradient(${partes.join(', ')})`;
  }
}
