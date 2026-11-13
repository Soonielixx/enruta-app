import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [FormsModule, ValidateFormDirective],
  templateUrl: './login-screen.component.html',
})
export class LoginScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
