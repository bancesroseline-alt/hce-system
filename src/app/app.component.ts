import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'hce-frontend';

  private readonly swUpdate = inject(SwUpdate, { optional: true });

  constructor() {
    if (!this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate?.activateUpdate().then(() => document.location.reload());
      });

    this.swUpdate.checkForUpdate().catch(error => {
      console.warn('No se pudo comprobar una nueva version de la aplicacion.', error);
    });
  }
}
