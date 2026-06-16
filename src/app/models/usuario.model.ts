export interface Usuario {
  id?: number;
  nombres: string;
  apellidos: string;
  username: string;
  password?: string;
  rol: 'ADMIN' | 'MEDICO' | 'ENFERMERO';
  estado: boolean;
}
