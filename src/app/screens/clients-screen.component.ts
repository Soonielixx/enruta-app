import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouteMapComponent } from '../core/route-map.component';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-clients-screen',
  standalone: true,
  imports: [FormsModule, RouteMapComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './clients-screen.component.html',
})
export class ClientsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  get clientMarker() { const c = this.app.activeClient; return c && c.lat !== undefined && c.lng !== undefined ? [{ id: c.id, label: c.name, lat: c.lat, lng: c.lng }] : []; }
}
