import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, GripVertical, Plus } from 'lucide-angular';
import { CONFIG_CAMPOS, CONFIG_MODULOS, ConfigModulo } from '../data-extra';
import { WEB_NAV } from './nav';

const TABS = ['Módulos', 'Formularios', 'Catálogos', 'Reglas', 'Marca'];

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, RouterLinkActive],
  template: `
    <div class="shell shell--config">
      <aside class="side">
        <p class="side__brand">EnRuta</p>
        <nav aria-label="Principal">
          @for (n of nav; track n.label) {
            @if (n.to) {
              <a class="side__item" [routerLink]="n.to" routerLinkActive="on">
                <lucide-icon [img]="$any(n.icon)" [size]="17" />{{ n.label }}
              </a>
            } @else {
              <span class="side__item" aria-disabled="true">
                <lucide-icon [img]="$any(n.icon)" [size]="17" />{{ n.label }}
              </span>
            }
          }
        </nav>
      </aside>

      <main class="main">
        <h1 class="main__title">Configuración de la empresa</h1>

        <div class="row">
          @for (t of tabs; track t) {
            <button type="button" class="chip" [class.chip--on]="tab() === t" (click)="tab.set(t)">{{ t }}</button>
          }
        </div>

        <p class="section-label">Módulos activos</p>
        <div class="row" style="align-items: stretch">
          @for (m of modulos(); track m.id) {
            <div class="card" style="flex: 1">
              <div class="row">
                <span class="v sp">{{ m.name }}</span>
                <button type="button" class="switch" [class.on]="m.on" role="switch" [attr.aria-checked]="m.on" [attr.aria-label]="m.name" (click)="toggle(m.id)">
                  <span></span>
                </button>
              </div>
              <p class="k">{{ m.desc }}</p>
            </div>
          }
        </div>

        <p class="section-label">Campos de la pantalla de entrega</p>
        @for (c of campos; track c.id) {
          <div class="card">
            <div class="row">
              <span class="sp">{{ c.label }}</span>
              <span class="chip chip--on">{{ c.required ? 'Obligatorio' : 'Opcional' }}</span>
              <lucide-icon [img]="GripIcon" [size]="16" style="color: var(--ink-3)" />
            </div>
          </div>
        }
        <button type="button" class="card" style="display: flex; align-items: center; gap: 8px; justify-content: center; border-style: dashed; color: var(--ink-3)">
          <lucide-icon [img]="PlusIcon" [size]="16" />Agregar campo personalizado
        </button>

        <div class="row" style="margin-top: 8px">
          <p class="k sp">Los cambios llegan a las apps en la siguiente sincronización, sin publicar una versión nueva.</p>
          <button type="button" class="btn" style="width: 120px" (click)="saved.set(true)">{{ saved() ? 'Guardado' : 'Guardar' }}</button>
        </div>
      </main>
    </div>
  `,
})
export class ConfigComponent {
  nav = WEB_NAV;
  tabs = TABS;
  tab = signal('Módulos');
  modulos = signal<ConfigModulo[]>(CONFIG_MODULOS.map((m) => ({ ...m })));
  campos = CONFIG_CAMPOS;
  saved = signal(false);
  readonly GripIcon = GripVertical;
  readonly PlusIcon = Plus;

  toggle(id: string) {
    this.modulos.update((ms) => ms.map((m) => (m.id === id ? { ...m, on: !m.on } : m)));
  }
}