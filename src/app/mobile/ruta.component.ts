// src/app/mobile/ruta.component.ts  (M-01 · Ruta del día)
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE, STOPS, Stop } from '../data';
import { MoneyPipe } from '../shared/money.pipe';
import { PillComponent } from '../shared/pill.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [ScreenComponent, PillComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen
      [title]="'Ruta ' + route.code"
      [sub]="route.date"
      [sync]="'Sin conexión · ' + route.offlinePending + ' operaciones por enviar'"
      tabs="repartidor"
      [actions]="true"
    >
      <app-pill data-right tone="wait">{{ route.done }} / {{ route.total }}</app-pill>

      <div class="card">
        <div class="row">
          <span class="k sp">Avance de la jornada</span>
          <span class="v">{{ route.sales | money }}</span>
        </div>
        <div class="prog" style="margin-top: 10px"><i [style.width.%]="pct"></i></div>
      </div>

      @for (s of stops; track s.id) {
        @if (s.status === 'next') {
          <div class="card card--hl">
            <div class="row">
              <span class="v sp">{{ s.name }}</span>
              <app-pill tone="blue">Siguiente</app-pill>
            </div>
            <p class="k" style="margin-top: 4px">{{ s.line }}</p>
            <hr class="divider" />
            <div class="row">
              <span class="k sp">{{ s.boxes }} cajas · {{ s.products }} productos</span>
              <span class="v">{{ s.total | money }}</span>
            </div>
            <div class="row" style="margin-top: 4px">
              <span class="k sp">Saldo pendiente</span>
              <span class="v neg">{{ s.balance | money }}</span>
            </div>
          </div>
        } @else {
          <div class="card" [class.card--ok]="s.status === 'done'" [class.card--bad]="s.status === 'failed'">
            <div class="row">
              <span class="v sp">{{ s.name }}</span>
              <app-pill [tone]="pillTone(s)">{{ pillText(s) }}</app-pill>
            </div>
            <p class="k" style="margin-top: 4px">{{ s.line }}</p>
          </div>
        }
      }

      <div data-actions class="contents">
        <button type="button" class="btn" style="flex: 1" (click)="router.navigateByUrl('/m/mapa')">Ir a la siguiente parada</button>
      </div>
    </app-screen>
  `,
})
export class RutaComponent {
  router = inject(Router);
  route = ROUTE;
  stops = STOPS;
  pct = (ROUTE.done / ROUTE.total) * 100;

  pillTone(s: Stop): '' | 'ok' | 'bad' {
    return s.status === 'done' ? 'ok' : s.status === 'failed' ? 'bad' : '';
  }
  pillText(s: Stop): string {
    return s.status === 'done' ? 'Entregado' : s.status === 'failed' ? 'No entregado' : (s.time ?? '');
  }
}