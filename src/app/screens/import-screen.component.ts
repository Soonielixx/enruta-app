import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-import-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './import-screen.component.html',
})
export class ImportScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  drag = false;
}
