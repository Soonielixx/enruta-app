import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-routes-screen',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './routes-screen.component.html',
})
export class RoutesScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
