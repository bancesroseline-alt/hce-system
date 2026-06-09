import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {

  usuario: any;
  mostrarMenuUsuario = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  }

  toggleUserMenu(): void {
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
