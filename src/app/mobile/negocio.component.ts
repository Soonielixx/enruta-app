// src/app/mobile/negocio.component.ts  (M-06 · App del negocio receptor)
import { Component } from '@angular/core';
import { NEGOCIO } from '../data';
import { MapComponent } from '../shared/map.component';
import { MoneyPipe } from '../shared/money.pipe';
import { PillComponent } from '../shared/pill.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-negocio',
  standalone: true,
  imports: [ScreenComponent, MapComponent, PillComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Mis entregas" [sub]="n.name" tone="client" tabs="negocio" [actions]="true">
      <div class="card card--hl">
        <div class="row">
          <span class="v sp" style="font-size: 16px">Llega hoy a las {{ n.eta }}</span>
          <app-pill tone="wait">En camino</app-pill>
        </div>
        <p class="k" style="margin-top: 4px">Ruta {{ n.ruta }} · reparte {{ n.repartidor }}</p>
        <app-map style="height: 120px; margin-top: 10px" [pins]="n.pins" [paths]="n.paths" label="Unidad acercándose al negocio" />
        <hr class="divider" />
        <div class="row">
          <span class="k sp">{{ n.boxes }} cajas · {{ n.products }} productos</span>
          <span class="v">{{ n.total | money }}</span>
        </div>
      </div>

      <h2 class="k" style="font-weight: 600; margin-top: 4px">Historial</h2>
      @for (h of n.historial; track h.date) {
        <div class="card" [class.card--ok]="h.tone === 'ok'" [class.card--bad]="h.tone === 'bad'">
          <div class="row">
            <span class="v sp">{{ h.date }}</span>
            <app-pill [tone]="h.tone">{{ h.tag }}</app-pill>
          </div>
          <div class="row" style="margin-top: 4px">
            <span class="k sp">{{ h.line }}</span>
            @if (h.amount) {
              <span class="v">{{ h.amount | money }}</span>
            }
          </div>
        </div>
      }

      <div class="card">
        <div class="row">
          <span class="k sp">Saldo de mi cuenta</span>
          <span class="v neg">{{ n.saldo | money }}</span>
        </div>
      </div>

      <div data-actions class="contents">
        <button type="button" class="btn btn--ghost" style="flex: 1">Reportar problema</button>
        <button type="button" class="btn" style="flex: 1">Pedir más</button>
      </div>
    </app-screen>
  `,
})
export class NegocioComponent {
  n = NEGOCIO;
}