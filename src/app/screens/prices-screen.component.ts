import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-prices-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './prices-screen.component.html',
})
export class PricesScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
