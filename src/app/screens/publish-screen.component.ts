import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-publish-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './publish-screen.component.html',
})
export class PublishScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
