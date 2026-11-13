import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-forms-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './forms-screen.component.html',
})
export class FormsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  preview = false;
}
