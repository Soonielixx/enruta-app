import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-configuration-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuration-screen.component.html',
})
export class ConfigurationScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
