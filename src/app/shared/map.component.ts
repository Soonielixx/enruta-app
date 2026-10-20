// src/app/shared/map.component.ts
import { Component, Input } from '@angular/core';
import { MapPath, Pin } from '../data';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div class="map" [class.map--full]="full" role="img" [attr.aria-label]="label">
      <svg class="map__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 58 Q26 46 46 60 T100 52 L100 60 Q70 70 46 68 T0 66 Z" fill="#C9DCE9" />
        @for (s of streets; track $index) {
          <path class="map__street" [attr.d]="d(s)" [attr.stroke-width]="$index < 3 ? 7 : 5" />
        }
        @for (p of paths; track $index) {
          <path class="map__path" [class.map__path--blue]="p.tone === 'blue'" [class.map__path--green]="p.tone === 'green'" [attr.d]="d(p.points)" />
        }
      </svg>
      @for (p of pins; track p.id) {
        <span
          class="map__pin"
          [class.map__pin--done]="p.status === 'done'"
          [class.map__pin--alert]="p.status === 'alert'"
          [class.map__pin--next]="p.status === 'next'"
          [style.left.%]="p.x"
          [style.top.%]="p.y"
          [attr.title]="p.title ?? 'Parada ' + p.label"
          >{{ p.label }}</span
        >
      }
      @if (legend) {
        <div class="map__legend">
          <span><i style="background: var(--ok)"></i>Entregado</span>
          <span><i style="background: var(--signal)"></i>Pendiente</span>
          <span><i style="background: var(--bad)"></i>Incidencia</span>
        </div>
      }
      @if (attribution) {
        <span class="map__attr">{{ attribution }}</span>
      }
    </div>
  `,
})
export class MapComponent {
  @Input() pins: Pin[] = [];
  @Input() paths: MapPath[] = [];
  @Input() legend = false;
  @Input() full = false;
  @Input() attribution = '';
  @Input() label = 'Mapa';

  readonly streets: [number, number][][] = [
    [[0, 20], [100, 14]], [[0, 48], [100, 44]], [[0, 76], [100, 80]],
    [[16, 0], [20, 100]], [[42, 0], [38, 100]], [[68, 0], [72, 100]], [[92, 0], [88, 100]],
    [[0, 34], [42, 30], [100, 62]], [[10, 100], [42, 62], [74, 0]],
  ];

  d(pts: [number, number][]): string {
    return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  }
}