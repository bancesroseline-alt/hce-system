import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SoporteService } from '../../services/soporte.service';

@Component({ selector: 'app-monitoreo', standalone: true, imports: [CommonModule], templateUrl: './monitoreo.component.html', styleUrl: './monitoreo.component.css' })
export class MonitoreoComponent implements OnInit {
  metricas: any = {}; logs: any[] = []; errores: any[] = []; feedback: any[] = []; cargando = true; mensaje = '';
  constructor(private soporte: SoporteService) {}
  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando = true;
    forkJoin({ metricas: this.soporte.metricas(), logs: this.soporte.logs(), errores: this.soporte.errores(), feedback: this.soporte.feedback() }).subscribe({
      next: r => { this.metricas=r.metricas; this.logs=r.logs.slice().reverse().slice(0,50); this.errores=r.errores.slice().reverse(); this.feedback=r.feedback.slice().reverse(); this.cargando=false; },
      error: () => { this.mensaje='No se pudieron cargar las metricas.'; this.cargando=false; }
    });
  }
  uptime(): string { const s=Number(this.metricas.uptimeSegundos||0); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; }
  exportar(): void {
    const filas:any[][]=[['Metrica','Valor'],['Usuarios',this.metricas.totalUsuarios],['Logs',this.metricas.totalLogs],['Errores',this.metricas.totalErrores],['Feedback',this.metricas.totalFeedback],['Memoria usada MB',this.metricas.memoriaUsadaMb],['Memoria disponible MB',this.metricas.memoriaDisponibleMb],['Uptime segundos',this.metricas.uptimeSegundos],['Tasa de errores %',this.metricas.tasaErrores]];
    const csv=filas.map(f=>f.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download=`reporte-desempeno-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
  }
}
