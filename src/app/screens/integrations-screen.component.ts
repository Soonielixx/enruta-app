import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-integrations-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './integrations-screen.component.html',
})
export class IntegrationsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
