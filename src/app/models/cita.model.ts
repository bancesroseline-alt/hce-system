export interface Cita {

  id?: number;

  paciente?: {
    id?: number;
    nombres?: string;
    apellidos?: string;
  };

  medico?: {
    id?: number;
    username?: string;
  };

  tipoCita?: string;

  fecha?: string;
  hora?: string;

  especialidad?: string;

  motivoConsulta?: string;

  estado?: 'PROGRAMADA' | 'ATENDIDA' | 'CANCELADA';
}
