import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-permission-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './permission-screen.component.html',
})
export class PermissionScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
