import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-recover-screen',
  standalone: true,
  imports: [FormsModule, ValidateFormDirective],
  templateUrl: './recover-screen.component.html',
})
export class RecoverScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
