import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-context-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './context-screen.component.html',
})
export class ContextScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
