import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-parameters-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './parameters-screen.component.html',
})
export class ParametersScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  readonly scopes = ['Empresa', 'Centro', 'Zona', 'Ruta', 'Usuario'];
  inherited(key: string): string { return this.app.parameterScope === 'Empresa' ? '—' : (this.app.companyParameters[key] || '—'); }
}
