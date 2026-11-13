import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-reset-screen',
  standalone: true,
  imports: [FormsModule, ValidateFormDirective],
  templateUrl: './reset-screen.component.html',
})
export class ResetScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
