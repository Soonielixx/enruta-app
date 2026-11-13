import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-settlements-screen',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './settlements-screen.component.html',
})
export class SettlementsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  get withDifference(): number { return this.app.settlements.filter((r) => r.status === 'Con diferencia').length; }
  exportSettlements(): void {
    this.app.downloadCsv('liquidaciones.csv', [['Ruta', 'Fecha', 'Cobrado', 'Depositado', 'Diferencia', 'Estado'], ...this.app.settlements.map((r) => [r.name, r.date, r.collected, r.deposited, this.app.settlementDiff(r), r.status])]);
  }
}
