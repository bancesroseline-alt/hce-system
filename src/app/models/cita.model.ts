export interface Cita {

  id?: number;

  paciente: {
    id: number;
    nombres?: string;
    apellidos?: string;
  };

  medico: {
    id: number;
    username?: string;
  };

  tipoCita: 'CONSULTA' | 'CONTROL' | 'EMERGENCIA';

  fecha: string; // LocalDate -> string
  hora: string;  // LocalTime -> string

  especialidad: string;

  motivoConsulta: string;

  estado: 'PROGRAMADA' | 'ATENDIDA' | 'CANCELADA';

  sincronizado?: boolean;
}
