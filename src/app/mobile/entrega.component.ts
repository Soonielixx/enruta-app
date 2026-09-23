// src/app/mobile/entrega.component.ts  (M-03 · Captura de entrega)
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ORDER, OrderLine, SHORTAGE_REASONS } from '../data';
import { MoneyPipe } from '../shared/money.pipe';
import { PillComponent } from '../shared/pill.component';
import { StepperComponent } from '../shared/stepper.component';
import { ScreenComponent } from './screen.component';

type Line = OrderLine & { reason: string };

@Component({
  selector: 'app-entrega',
  standalone: true,
  imports: [ScreenComponent, PillComponent, StepperComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Entrega" [sub]="'Abarrotes Doña Mari · ' + lines().length + ' productos'" back="/m/mapa" [actions]="true">
      <app-pill data-right tone="blue">Escanear</app-pill>

      @for (l of lines(); track l.id) {
        <div class="card" [class.card--bad]="l.ordered - l.delivered > 0">
          <div class="row">
            <span class="v sp">{{ l.name }}</span>
            <span class="k">{{ l.price | money }} / caja</span>
          </div>
          <div class="row" style="margin-top: 8px">
            <span class="k sp">Pedido {{ l.ordered }} {{ l.ordered === 1 ? 'caja' : 'cajas' }}</span>
            <app-stepper [value]="l.delivered" [max]="l.ordered" [label]="'cajas de ' + l.name" (valueChange)="setDelivered(l.id, $event)" />
          </div>
          @if (l.ordered - l.delivered > 0) {
            <hr class="divider" />
            <div class="row">
              <span class="k">Falta {{ l.ordered - l.delivered }} {{ l.ordered - l.delivered === 1 ? 'caja' : 'cajas' }}</span>
              <select
                class="select sp"
                [class.select--req]="!l.reason"
                [attr.aria-label]="'Motivo del faltante de ' + l.name"
                (change)="setReason(l.id, $any($event.target).value)"
              >
                <option value="" [selected]="!l.reason">Elegir motivo</option>
                @for (r of reasons; track r) {
                  <option [value]="r" [selected]="l.reason === r">{{ r }}</option>
                }
              </select>
            </div>
          }
        </div>
      }

      <div class="row">
        <button type="button" class="btn btn--ghost" style="flex: 1; min-height: 44px; font-size: 14px">Agregar producto</button>
        <button type="button" class="btn btn--ghost" style="flex: 1; min-height: 44px; font-size: 14px">Devolución</button>
      </div>

      <div data-actions class="contents">
        <div class="sp">
          <p class="k">Total a entregar</p>
          <p class="big">{{ total() | money }}</p>
        </div>
        <button type="button" class="btn" style="width: 130px" [disabled]="blocked()" (click)="next()">Continuar</button>
      </div>
    </app-screen>
  `,
})
export class EntregaComponent {
  private router = inject(Router);
  reasons = SHORTAGE_REASONS;
  lines = signal<Line[]>(ORDER.map((l) => ({ ...l, reason: '' })));
  total = computed(() => this.lines().reduce((s, l) => s + l.delivered * l.price, 0));
  blocked = computed(() => this.lines().some((l) => l.delivered < l.ordered && !l.reason));

  setDelivered(id: string, n: number) {
    this.lines.update((ls) => ls.map((l) => (l.id === id ? { ...l, delivered: n, reason: n >= l.ordered ? '' : l.reason } : l)));
  }
  setReason(id: string, reason: string) {
    this.lines.update((ls) => ls.map((l) => (l.id === id ? { ...l, reason } : l)));
  }
  next() {
    this.router.navigate(['/m/evidencia'], { state: { total: this.total() } });
  }
}