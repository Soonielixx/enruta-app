import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-users-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-screen.component.html',
})
export class UsersScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
}
