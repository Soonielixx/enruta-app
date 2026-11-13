import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-brand-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './brand-screen.component.html',
})
export class BrandScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
