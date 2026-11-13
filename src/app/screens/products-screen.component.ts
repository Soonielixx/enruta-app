import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-products-screen',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './products-screen.component.html',
})
export class ProductsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
