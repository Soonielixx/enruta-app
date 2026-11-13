import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-submitted-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './submitted-screen.component.html',
})
export class SubmittedScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
