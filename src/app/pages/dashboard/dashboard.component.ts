export class DashboardComponent implements OnInit {

  totalPacientes = 0;
  citasHoy = 0;
  totalCitasMedico = 0;
  totalAtenciones = 0;

  nombreUsuario = 'Usuario';
  rolUsuario = 'Médico';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.nombreUsuario = usuario.nombre || usuario.nombres || 'Usuario';
    this.rolUsuario = usuario.rol || 'Médico';

    const medicoId = usuario.id || 2;

    this.http.get<any>(`https://hce-backend.onrender.com/api/dashboard/medico/${medicoId}`)
      .subscribe({
        next: (data) => {
          this.totalPacientes = data.totalPacientes || 0;
          this.citasHoy = data.citasHoy || 0;
          this.totalCitasMedico = data.totalCitasMedico || 0;
          this.totalAtenciones = data.totalAtenciones || 0;
        },
        error: (error) => {
          console.error('Error al cargar dashboard', error);
        }
      });
  }
}
