export interface Cita {

  id?: number;

  paciente: {
    id: number;
  };

  medico: {
    id: number;
  };

  tipoCita: 'CONSULTA' | 'CONTROL' | 'EMERGENCIA';

  fecha: string;
  hora: string;

  especialidad: string;

  motivoConsulta: string;

  estado: 'PROGRAMADA' | 'ATENDIDA' | 'CANCELADA';
}
