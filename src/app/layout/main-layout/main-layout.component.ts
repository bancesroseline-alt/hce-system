import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}