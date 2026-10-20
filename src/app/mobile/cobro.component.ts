import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { COBRO } from '../data-extra';
import { MoneyPipe } from '../shared/money.pipe';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-cobro',
  standalone: true,
  imports: [ScreenComponent, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Cobro" back="/m/cliente" [actions]="true">
      <div class="card">
        <div class="row"><span class="sp">Entrega de hoy</span><span class="v">{{ c.hoy | money }}</span></div>
        <div class="row"><span class="k sp">Saldo anterior vencido</span><span class="k">{{ c.saldoVencido | money }}</span></div>
      </div>

      <p class="section-label">Forma de pago</p>
      <div class="row">
        @for (f of c.formas; track f) {
          <button type="button" class="card paybtn" [class.on]="forma() === f" style="flex: 1; text-align: center" (click)="forma.set(f)">{{ f }}</button>
        }
      </div>

      <div class="field">
        <label for="recibido">Importe recibido</label>
        <input id="recibido" class="input" style="height: 36px; font-size: 15px" type="number" [value]="recibido()" (input)="recibido.set(+$any($event.target).value)" />
      </div>

      <div class="card">
        <div class="row"><span class="sp">Se aplica a</span><span class="k">{{ c.aplicaA.length }} documentos</span></div>
        @for (a of c.aplicaA; track a.doc) {
          <p class="k">{{ a.doc }} · {{ a.importe | money }}{{ a.nota ? ' ' + a.nota : '' }}</p>
        }
      </div>

      <div class="row"><span class="v sp">Cambio</span><span class="v">{{ cambio() | money }}</span></div>

      <div data-actions class="contents">
        <button type="button" class="btn btn--ghost" style="flex: 1">Imprimir</button>
        <button type="button" class="btn" style="flex: 2" [disabled]="!ready()" (click)="router.navigateByUrl('/m/ruta')">Registrar cobro</button>
      </div>
    </app-screen>
  `,
})
export class CobroComponent {
  router = inject(Router);
  c = COBRO;
  forma = signal(COBRO.formas[0]);
  recibido = signal(3000);
  totalAplicado = COBRO.aplicaA.reduce((s, a) => s + a.importe, 0);
  cambio = computed(() => Math.max(0, this.recibido() - this.totalAplicado));
  ready = computed(() => this.recibido() >= this.totalAplicado);
}