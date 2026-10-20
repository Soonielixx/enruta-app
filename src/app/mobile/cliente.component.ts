import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CLIENTE } from '../data-extra';
import { MoneyPipe } from '../shared/money.pipe';
import { PillComponent } from '../shared/pill.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [ScreenComponent, PillComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen [title]="c.name" back="/m/ruta" [actions]="true" [actionsColumn]="true">
      <div class="card">
        <p class="k">{{ c.address }}</p>
        <p class="k">{{ c.canal }}</p>
        <p class="k">Contacto: {{ c.contacto }}</p>
      </div>

      <div class="row" style="align-items: stretch">
        <div class="card" style="flex: 1">
          <p class="k">Saldo</p>
          <p class="v" style="font-size: 17px">{{ c.saldo | money }}</p>
          <p class="k">{{ c.vencidos }} doc. vencido</p>
        </div>
        <div class="card" style="flex: 1">
          <p class="k">Límite</p>
          <p class="v" style="font-size: 17px">{{ c.limite | money }}</p>
          <p class="k">Disponible {{ c.disponible | money }}</p>
        </div>
      </div>

      <h2 class="section-label">Pedido programado</h2>
      <div class="card">
        <p class="v">{{ c.pedido.boxes }} cajas · {{ c.pedido.sku }} SKU · {{ c.pedido.total | money }}</p>
        <p class="k">{{ c.pedido.nota }}</p>
      </div>

      <h2 class="section-label">Últimas visitas</h2>
      <div class="row">
        @for (v of c.visitas; track v.date) {
          <app-pill [tone]="v.tone">{{ v.date }} · {{ v.label }}</app-pill>
        }
      </div>

      <div data-actions class="contents">
        <button type="button" class="btn" style="width: 100%" (click)="router.navigateByUrl('/m/entrega')">Entregar pedido</button>
        <div class="row" style="width: 100%">
          <button type="button" class="btn btn--ghost" style="flex: 1" (click)="router.navigateByUrl('/m/cobro')">Cobrar</button>
          <button type="button" class="btn btn--ghost" style="flex: 1" (click)="router.navigateByUrl('/m/no-entrega')">No entregar</button>
        </div>
      </div>
    </app-screen>
  `,
})
export class ClienteComponent {
  router = inject(Router);
  c = CLIENTE;
}