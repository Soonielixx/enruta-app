import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pill',
  standalone: true,
  template: `<span class="pill" [class.pill--ok]="tone === 'ok'" [class.pill--wait]="tone === 'wait'" [class.pill--bad]="tone === 'bad'" [class.pill--blue]="tone === 'blue'"><ng-content /></span>`,
})
export class PillComponent {
  @Input() tone: '' | 'ok' | 'wait' | 'bad' | 'blue' = '';
}