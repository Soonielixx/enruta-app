import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-verify-screen',
  standalone: true,
  imports: [FormsModule, ValidateFormDirective],
  templateUrl: './verify-screen.component.html',
})
export class VerifyScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
