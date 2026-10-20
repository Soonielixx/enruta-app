// src/app/mobile/corte.component.ts  (M-05 · Liquidación)
import { Component, computed, signal } from '@angular/core';
import { CORTE, ROUTE } from '../data';
import { MoneyPipe } from '../shared/money.pipe';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-corte',
  standalone: true,
  imports: [ScreenComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Corte de jornada" [sub]="route.code + ' · 16 sep · ' + c.operador" tabs="repartidor" [actions]="true">
      <div class="row" style="align-items: stretch">
        <div class="card" style="flex: 1"><p class="k">Paradas</p><p class="big">{{ c.paradas[0] }}/{{ c.paradas[1] }}</p></div>
        <div class="card" style="flex: 1"><p class="k">Venta</p><p class="big">{{ c.venta | money }}</p></div>
      </div>

      <div class="card">
        <p class="v" style="margin-bottom: 6px">Inventario de la unidad</p>
        <div class="row"><span class="k sp">Cargado</span><span class="v">{{ c.inventario.cargado }} cajas</span></div>
        <div class="row"><span class="k sp">Vendido</span><span class="v">{{ c.inventario.vendido }}</span></div>
        <div class="row"><span class="k sp">Devuelto</span><span class="v">{{ c.inventario.devuelto }}</span></div>
        <hr class="divider" />
        <div class="row"><span class="k sp">Diferencia</span><span class="v neg">{{ diffBoxes }} cajas</span></div>
      </div>

      <div class="card card--bad">
        <p class="v" style="margin-bottom: 6px">Efectivo</p>
        <div class="row"><span class="k sp">Cobrado en sistema</span><span class="v">{{ c.efectivo.sistema | money }}</span></div>
        <div class="row"><span class="k sp">Declarado</span><span class="v">{{ c.efectivo.declarado | money }}</span></div>
        <hr class="divider" />
        <div class="row"><span class="k sp">Faltante</span><span class="v neg">{{ faltante | money }}.00</span></div>
        <p class="k" style="margin-top: 8px">
          Supera la tolerancia de {{ c.efectivo.tolerancia | money }}. Escribe una justificación para enviar a aprobación.
        </p>
        <textarea
          class="input input--area"
          placeholder="Escribe qué ocurrió…"
          aria-label="Justificación"
          [disabled]="sent()"
          [value]="text()"
          (input)="text.set($any($event.target).value)"
        ></textarea>
      </div>

      <div data-actions class="contents">
        <button type="button" class="btn" style="flex: 1" [disabled]="!canSend()" (click)="sent.set(true)">
          {{ sent() ? 'Enviado a aprobación' : 'Enviar a aprobación' }}
        </button>
      </div>
    </app-screen>
  `,
})
export class CorteComponent {
  c = CORTE;
  route = ROUTE;
  diffBoxes = CORTE.inventario.cargado - CORTE.inventario.vendido - CORTE.inventario.devuelto;
  faltante = CORTE.efectivo.sistema - CORTE.efectivo.declarado;
  text = signal('');
  sent = signal(false);
  canSend = computed(() => !this.sent() && this.text().trim().length >= 10);
}