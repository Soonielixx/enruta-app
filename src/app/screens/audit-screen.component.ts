import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-audit-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './audit-screen.component.html',
})
export class AuditScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
