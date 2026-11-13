import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-plan-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './plan-screen.component.html',
})
export class PlanScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
