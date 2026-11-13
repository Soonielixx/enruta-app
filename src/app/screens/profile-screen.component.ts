import { ValidateFormDirective } from '../core/validate-form.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-profile-screen',
  standalone: true,
  imports: [FormsModule, DatePipe, ValidateFormDirective],
  templateUrl: './profile-screen.component.html',
})
export class ProfileScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  readonly tabs = [{ id: 'general', label: 'General' }, { id: 'seguridad', label: 'Seguridad' }, { id: 'preferencias', label: 'Preferencias' }, { id: 'sesiones', label: 'Sesiones' }];
}
