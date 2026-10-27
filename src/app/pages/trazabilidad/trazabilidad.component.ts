import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  tipo = 'ATENCION';
  busqueda = '';

  estadoLedger: any = null;
  registros: any[] = [];
  visibles = REGISTROS_POR_PAGINA;
  cargandoRegistros = false;

  seleccionado: any = null;
  bloques: any[] = [];
  resultado: any = null;
  cargandoDetalle = false;
  verificando = false;

  mensaje = '';

  private temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  constructor(private trazabilidadService: TrazabilidadService) {}

  ngOnInit(): void {
    this.cargarEstado();
    this.cargarRegistros();
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
    this.limpiarSeleccion();
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

  seleccionar(registro: any): void {
    this.seleccionado = registro;
    this.bloques = [];
    this.resultado = null;
    this.mensaje = '';
    this.cargandoDetalle = true;

    this.trazabilidadService.historialLedger(registro.entityType, registro.entityId).subscribe({
      next: data => {
        this.bloques = data || [];
        this.cargandoDetalle = false;
        this.verificar();
      },
      error: err => {
        console.error('Error consultando el ledger', err);
        this.mensaje = 'No se pudo consultar el historial del ledger.';
        this.cargandoDetalle = false;
      }
    });
  }

  verificar(): void {
    if (!this.seleccionado) {
      return;
    }

    this.verificando = true;
    this.mensaje = '';

    this.trazabilidadService
      .verificarIntegridad(this.seleccionado.entityType, this.seleccionado.entityId)
      .subscribe({
        next: data => {
          this.resultado = data;
          this.verificando = false;
          this.cargarEstado();
        },
        error: err => {
          console.error('Error verificando integridad', err);
          this.mensaje = 'No se pudo verificar la integridad.';
          this.verificando = false;
        }
      });
  }

  limpiarSeleccion(): void {
    this.seleccionado = null;
    this.bloques = [];
    this.resultado = null;
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).catch(() => {});
  }

  corto(hash: string | null | undefined): string {
    return hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '-';
  }

  etiquetaEstado(estado: string | undefined): string {
    switch (estado) {
      case 'VERIFICADO': return 'Verificado';
      case 'DISCREPANCIA': return 'Discrepancia';
      case 'SIN_REGISTRO': return 'Sin evidencia';
      case 'LEDGER_ALTERADO': return 'Ledger inconsistente';
      default: return estado || '-';
    }
  }

  claseEstado(estado: string | undefined): string {
    if (estado === 'VERIFICADO') return 'ok';
    if (estado === 'SIN_REGISTRO') return 'warn';
    return 'bad';
  }
}
