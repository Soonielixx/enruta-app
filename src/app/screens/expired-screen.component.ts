import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-expired-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './expired-screen.component.html',
})
export class ExpiredScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
