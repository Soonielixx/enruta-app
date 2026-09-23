// src/app/mobile/screen.component.ts
import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule, ChevronLeft, ClipboardCheck, Map as MapIcon, Package, Route as RouteIcon,
  ShoppingBasket, Truck, UserRound, WifiOff,
} from 'lucide-angular';

interface Tab { to?: string; label: string; icon: unknown }

const TABS: Record<'repartidor' | 'negocio', Tab[]> = {
  repartidor: [
    { to: '/m/ruta', label: 'Ruta', icon: RouteIcon },
    { to: '/m/mapa', label: 'Mapa', icon: MapIcon },
    { label: 'Inventario', icon: Package },
    { to: '/m/corte', label: 'Corte', icon: ClipboardCheck },
  ],
  negocio: [
    { to: '/m/negocio', label: 'Entregas', icon: Truck },
    { label: 'Pedir', icon: ShoppingBasket },
    { label: 'Mi cuenta', icon: UserRound },
  ],
};

/**
 * Marco de pantalla móvil: encabezado · franja de sincronización · contenido · barra de acción · pestañas.
 * Proyección: [data-right] → derecha del encabezado · [data-actions] → barra inferior.
 */
@Component({
  selector: 'app-screen',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="screen">
      <header class="hd" [class.hd--client]="tone === 'client'">
        @if (back) {
          <button type="button" class="hd__back" aria-label="Volver" (click)="router.navigateByUrl(back)">
            <lucide-icon [img]="BackIcon" [size]="26" />
          </button>
        }
        <div class="sp">
          <h1 class="hd__title">{{ title }}</h1>
          @if (sub) {
            <p class="hd__sub">{{ sub }}</p>
          }
        </div>
        <ng-content select="[data-right]" />
      </header>

      @if (sync) {
        <div class="sync" role="status">
          <lucide-icon [img]="WifiOffIcon" [size]="14" />
          {{ sync }}
        </div>
      }

      <main class="body"><ng-content /></main>

      @if (actions) {
        <footer class="bar"><ng-content select="[data-actions]" /></footer>
      }

      @if (tabs) {
        <nav class="tabs" aria-label="Secciones">
          @for (t of tabList; track t.label) {
            @if (t.to) {
              <a class="tab" [routerLink]="t.to" routerLinkActive="on">
                <lucide-icon [img]="$any(t.icon)" [size]="22" />{{ t.label }}
              </a>
            } @else {
              <span class="tab tab--off" aria-disabled="true">
                <lucide-icon [img]="$any(t.icon)" [size]="22" />{{ t.label }}
              </span>
            }
          }
        </nav>
      }
    </div>
  `,
})
export class ScreenComponent {
  @Input({ required: true }) title = '';
  @Input() sub = '';
  @Input() back = '';
  @Input() tone: '' | 'client' = '';
  @Input() sync = '';
  @Input() tabs: '' | 'repartidor' | 'negocio' = '';
  @Input() actions = false;

  router = inject(Router);
  readonly BackIcon = ChevronLeft;
  readonly WifiOffIcon = WifiOff;

  get tabList(): Tab[] {
    return this.tabs ? TABS[this.tabs] : [];
  }
}