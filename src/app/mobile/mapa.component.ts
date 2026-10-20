// src/app/mobile/mapa.component.ts  (M-02 · Mapa y llegada)
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Navigation } from 'lucide-angular';
import { MAP_PATH, MAP_PINS, ROUTE } from '../data';
import { MapComponent } from '../shared/map.component';
import { PillComponent } from '../shared/pill.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [ScreenComponent, MapComponent, PillComponent, LucideAngularModule],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Mapa de la ruta" [sub]="'Quedan ' + (route.total - route.done) + ' paradas · 18.4 km'" tabs="repartidor">
      <div class="map-wrap">
        <app-map [full]="true" [pins]="pins" [paths]="paths" attribution="Mapa base · datos de la red vial" label="Mapa de la ruta con paradas" />
        <section class="sheet-card" aria-label="Siguiente parada">
          <div class="row">
            <div class="sp">
              <p class="k">Parada 9</p>
              <p class="v" style="font-size: 17px">Abarrotes Doña Mari</p>
            </div>
            <app-pill tone="wait">4 min</app-pill>
          </div>
          <p class="k">Av. Juárez 210, Col. Centro · atiende hasta las 20:00</p>
          <div class="row" style="margin-top: 6px">
            <a
              class="btn btn--ghost"
              style="flex: 1"
              href="https://www.google.com/maps/dir/?api=1&destination=Av.+Ju%C3%A1rez+210"
              target="_blank"
              rel="noreferrer"
            >
              <lucide-icon [img]="NavIcon" [size]="18" />Navegar
            </a>
            <button type="button" class="btn" style="flex: 1.3" (click)="router.navigateByUrl('/m/cliente')">Registrar llegada</button>
          </div>
        </section>
      </div>
    </app-screen>
  `,
})
export class MapaComponent {
  router = inject(Router);
  route = ROUTE;
  pins = MAP_PINS;
  paths = MAP_PATH;
  readonly NavIcon = Navigation;
}