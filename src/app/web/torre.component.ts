// src/app/web/torre.component.ts  (M-07 · Torre de control)
import { Component, signal } from '@angular/core';
import {
  BarChart3, LayoutDashboard, LucideAngularModule, Package, Receipt, Route as RouteIcon, Settings, Users,
} from 'lucide-angular';
import { Alerta, TORRE } from '../data';
import { MapComponent } from '../shared/map.component';
import { PillComponent } from '../shared/pill.component';

@Component({
  selector: 'app-torre',
  standalone: true,
  imports: [MapComponent, PillComponent, LucideAngularModule],
  template: `
    <div class="shell">
      <aside class="side">
        <p class="side__brand">EnRuta</p>
        <nav aria-label="Principal">
          @for (n of nav; track n.label) {
            <a class="side__item" [class.on]="n.on" [attr.aria-current]="n.on ? 'page' : null" [attr.aria-disabled]="!n.on ? true : null">
              <lucide-icon [img]="n.icon" [size]="17" />{{ n.label }}
            </a>
          }
        </nav>
      </aside>

      <main class="main">
        <div class="row">
          <h1 class="main__title sp">{{ torre.fecha }}</h1>
          <app-pill tone="blue">En vivo</app-pill>
        </div>

        <section class="kpis" aria-label="Indicadores del día">
          <div class="kpi"><p class="k">Rutas activas</p><p class="big">{{ torre.kpis.rutas }}</p></div>
          <div class="kpi">
            <p class="k">Avance</p>
            <p class="big">{{ torre.kpis.avance }}%</p>
            <div class="prog" style="margin-top: 6px"><i [style.width.%]="torre.kpis.avance"></i></div>
          </div>
          <div class="kpi"><p class="k">Venta del día</p><p class="big">{{ torre.kpis.venta }}</p></div>
          <div class="kpi"><p class="k">Devolución</p><p class="big neg">{{ torre.kpis.devolucion }}</p></div>
        </section>

        <app-map class="main__map" [legend]="true" [pins]="torre.pins" [paths]="torre.paths" label="Mapa en vivo de unidades y paradas" />
      </main>

      <aside class="alerts" aria-label="Alertas">
        <div class="row">
          <h2 class="v sp">Alertas</h2>
          <app-pill tone="bad">{{ alertas().length }}</app-pill>
        </div>
        @if (alertas().length === 0) {
          <p class="k">Sin alertas pendientes.</p>
        }
        @for (a of alertas(); track a.id) {
          <article class="acard" [class.acard--bad]="a.tone === 'bad'" [class.acard--hl]="a.tone === 'hl'">
            <p class="v">{{ a.title }}</p>
            <p class="k">{{ a.detail }}</p>
            @if (a.actions) {
              <div class="row" style="margin-top: 8px">
                <button type="button" class="abtn abtn--ghost">Ver</button>
                <button type="button" class="abtn" (click)="resolver(a.id)">Aprobar</button>
              </div>
            }
          </article>
        }
      </aside>
    </div>
  `,
})
export class TorreComponent {
  torre = TORRE;
  alertas = signal<Alerta[]>(TORRE.alertas);

  nav = [
    { label: 'Torre de control', icon: LayoutDashboard, on: true },
    { label: 'Rutas', icon: RouteIcon, on: false },
    { label: 'Clientes', icon: Users, on: false },
    { label: 'Catálogo', icon: Package, on: false },
    { label: 'Liquidaciones', icon: Receipt, on: false },
    { label: 'Reportes', icon: BarChart3, on: false },
    { label: 'Configuración', icon: Settings, on: false },
  ];

  resolver(id: string) {
    this.alertas.update((list) => list.filter((a) => a.id !== id));
  }
}