export interface Paciente {

  id?: number;

  tipoDocumento: string;
  numeroDocumento: string;

  nombres: string;
  apellidos: string;

  fechaNacimiento: string;
  edad: number;

  sexo: string;
  estadoCivil: string;

  telefono: string;
  direccion: string;

  antecedentes: string;

  estado: boolean;
}