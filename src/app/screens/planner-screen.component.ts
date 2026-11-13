import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouteMapComponent } from '../core/route-map.component';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-planner-screen',
  standalone: true,
  imports: [FormsModule, RouteMapComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './planner-screen.component.html',
})
export class PlannerScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
