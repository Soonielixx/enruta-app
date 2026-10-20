import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-option-list',
  standalone: true,
  template: `
    <div class="options" role="radiogroup" [attr.aria-label]="label">
      @for (opt of options; track opt) {
        <button type="button" role="radio" [attr.aria-checked]="value === opt" class="option" (click)="valueChange.emit(opt)">
          <span class="option__dot" aria-hidden="true"></span>{{ opt }}
        </button>
      }
    </div>
  `,
})
export class OptionListComponent {
  @Input() options: string[] = [];
  @Input() value: string | null = null;
  @Input() label = '';
  @Output() valueChange = new EventEmitter<string>();
}