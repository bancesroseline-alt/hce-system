import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrazabilidadService } from '../../services/trazabilidad.service';

const REGISTROS_POR_PAGINA = 8;

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.css'
})
export class TrazabilidadComponent implements OnInit {

  readonly tiposEntidad = [
    { value: 'ATENCION', label: 'Atenciones' },
    { value: 'PACIENTE', label: 'Pacientes' },
    { value: 'CITA', label: 'Citas' }
  ];

  /** El administrador ve la vista tecnica; el personal de salud, los datos clinicos. */
  readonly esAdmin = this.leerEsAdmin();

  tipo = 'ATENCION';
  busqueda = '';

  estadoLedger: any = null;
  registros: any[] = [];
  visibles = REGISTROS_POR_PAGINA;
  cargandoRegistros = false;

  seleccionado: any = null;
  bloques: any[] = [];
  resumen: { etiqueta: string; valor: string }[] = [];
  resultado: any = null;
  cargandoDetalle = false;
  verificando = false;
  recienVerificado = false;
  ultimaVerificacion: Date | null = null;

  mensaje = '';
  mensajeDetalle = '';

  private temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;
  private temporizadorAviso: ReturnType<typeof setTimeout> | null = null;

  constructor(private trazabilidadService: TrazabilidadService) {}

  ngOnInit(): void {
    this.cargarEstado();
    this.cargarRegistros();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrar();
  }

  cargarEstado(): void {
    this.trazabilidadService.estadoLedger().subscribe({
      next: estado => this.estadoLedger = estado,
      error: () => this.estadoLedger = null
    });
  }

  cambiarTipo(tipo: string): void {
    this.tipo = tipo;
    this.busqueda = '';
    this.cerrar();
    this.cargarRegistros();
  }

  buscar(): void {
    if (this.temporizadorBusqueda) {
      clearTimeout(this.temporizadorBusqueda);
    }

    this.temporizadorBusqueda = setTimeout(() => this.cargarRegistros(), 300);
  }

  cargarRegistros(): void {
    this.cargandoRegistros = true;
    this.mensaje = '';
    this.visibles = REGISTROS_POR_PAGINA;

    this.trazabilidadService.registros(this.tipo, this.busqueda).subscribe({
      next: data => {
        this.registros = data || [];
        this.cargandoRegistros = false;
      },
      error: err => {
        console.error('Error cargando registros', err);
        this.registros = [];
        this.mensaje = 'No se pudieron cargar los registros. Intenta nuevamente en unos segundos.';
        this.cargandoRegistros = false;
      }
    });
  }

  verMas(): void {
    this.visibles += REGISTROS_POR_PAGINA;
  }

  /** Abre el panel lateral del registro y carga su historial, sus datos y la verificacion. */
  seleccionar(registro: any): void {
    this.seleccionado = registro;
    this.bloques = [];
    this.resumen = [];
    this.resultado = null;
    this.ultimaVerificacion = null;
    this.mensajeDetalle = '';
    this.cargandoDetalle = true;

    this.trazabilidadService.historialLedger(registro.entityType, registro.entityId).subscribe({
      next: data => {
        this.bloques = data || [];
        this.cargandoDetalle = false;
      },
      error: err => {
        console.error('Error consultando la trazabilidad', err);
        this.mensajeDetalle = 'No se pudo consultar el historial de este registro.';
        this.cargandoDetalle = false;
      }
    });

    if (!this.esAdmin) {
      this.trazabilidadService.resumen(registro.entityType, registro.entityId).subscribe({
        next: data => this.resumen = data || [],
        error: () => this.resumen = []
      });
    }

    this.verificar(false);
  }

  /** Verifica la integridad. Con `avisar` se muestra una confirmacion visible en el boton. */
  verificar(avisar = true): void {
    if (!this.seleccionado || this.verificando) {
      return;
    }

    this.verificando = true;
    this.recienVerificado = false;
    this.mensajeDetalle = '';

    this.trazabilidadService
      .verificarIntegridad(this.seleccionado.entityType, this.seleccionado.entityId)
      .subscribe({
        next: data => {
          this.resultado = data;
          this.ultimaVerificacion = new Date();
          this.verificando = false;

          if (avisar) {
            this.recienVerificado = true;

            if (this.temporizadorAviso) {
              clearTimeout(this.temporizadorAviso);
            }

            this.temporizadorAviso = setTimeout(() => this.recienVerificado = false, 2500);
          }
        },
        error: err => {
          console.error('Error verificando integridad', err);
          this.mensajeDetalle = 'No se pudo verificar la integridad. Intenta nuevamente.';
          this.verificando = false;
        }
      });
  }

  get primeraVersion(): any {
    return this.bloques[0] || null;
  }

  get ultimaVersion(): any {
    return this.bloques.length ? this.bloques[this.bloques.length - 1] : null;
  }

  /** Cantidad de modificaciones posteriores a la creacion. */
  get modificaciones(): number {
    return Math.max(this.bloques.length - 1, 0);
  }

  cerrar(): void {
    this.seleccionado = null;
    this.bloques = [];
    this.resumen = [];
    this.resultado = null;
    this.verificando = false;
    this.recienVerificado = false;
    this.mensajeDetalle = '';
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).catch(() => {});
  }

  corto(hash: string | null | undefined): string {
    return hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '-';
  }

  etiquetaEstado(estado: string | undefined): string {
    switch (estado) {
      case 'VERIFICADO': return 'Registro íntegro';
      case 'DISCREPANCIA': return 'Registro modificado';
      case 'SIN_REGISTRO': return 'Sin evidencia';
      case 'LEDGER_ALTERADO': return 'Evidencia inconsistente';
      default: return estado || '-';
    }
  }

  /** Mensaje claro para el usuario (el mensaje tecnico del servidor queda en los detalles). */
  mensajeEstado(estado: string | undefined): string {
    switch (estado) {
      case 'VERIFICADO':
        return 'Los datos actuales coinciden con la última evidencia registrada. No hay cambios sin registrar.';
      case 'DISCREPANCIA':
        return 'Los datos actuales no coinciden con la última evidencia registrada. Revisa si el registro fue modificado.';
      case 'SIN_REGISTRO':
        return 'Este registro aún no tiene evidencia, por lo que no se puede confirmar su integridad.';
      case 'LEDGER_ALTERADO':
        return 'La cadena de evidencias no es consistente. No se puede concluir sobre este registro.';
      default:
        return '';
    }
  }

  claseEstado(estado: string | undefined): string {
    if (estado === 'VERIFICADO') return 'ok';
    if (estado === 'SIN_REGISTRO') return 'warn';
    if (estado) return 'bad';
    return 'pending';
  }

  iconoEstado(estado: string | undefined): string {
    if (estado === 'VERIFICADO') return '✓';
    if (estado === 'SIN_REGISTRO') return '?';
    if (estado) return '!';
    return '…';
  }

  descripcionAccion(accion: string | undefined): string {
    switch ((accion || '').toUpperCase()) {
      case 'CREAR': return 'Registro creado';
      case 'ACTUALIZAR': return 'Registro actualizado';
      case 'SINCRONIZAR': return 'Registro sincronizado desde un dispositivo';
      case 'ELIMINAR_LOGICO': return 'Paciente dado de baja';
      default: return accion || 'Cambio registrado';
    }
  }

  private leerEsAdmin(): boolean {
    try {
      const rol = String(JSON.parse(localStorage.getItem('usuario') || '{}')?.rol || '')
        .replace('ROLE_', '')
        .toUpperCase();

      return rol === 'ADMIN' || rol === 'ADMINISTRADOR';
    } catch {
      return false;
    }
  }
}
