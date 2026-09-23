import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label">
      <button type="button" [attr.aria-label]="'Restar ' + label" [disabled]="value <= min" (click)="valueChange.emit(value - 1)">
        <lucide-icon [img]="MinusIcon" [size]="16" />
      </button>
      <output aria-live="polite">{{ value }}</output>
      <button type="button" [attr.aria-label]="'Sumar ' + label" [disabled]="value >= max" (click)="valueChange.emit(value + 1)">
        <lucide-icon [img]="PlusIcon" [size]="16" />
      </button>
    </div>
  `,
})
export class StepperComponent {
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 99;
  @Input() label = 'cantidad';
  @Output() valueChange = new EventEmitter<number>();
  readonly MinusIcon = Minus;
  readonly PlusIcon = Plus;
}