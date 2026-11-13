import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-register-screen',
  standalone: true,
  imports: [FormsModule, ValidateFormDirective],
  templateUrl: './register-screen.component.html',
})
export class RegisterScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
