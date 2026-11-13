import { CommonModule, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ErrorHandler, Injectable, Input, Type } from '@angular/core';
import { EnrutaState } from './enruta-state.service';

@Injectable()
class ScreenFailureState {
  failed = false;

  capture(): void {
    this.failed = true;
  }

  reset(): void {
    this.failed = false;
  }
}

class ScreenErrorHandler implements ErrorHandler {
  constructor(private readonly failure: ScreenFailureState) {}

  handleError(error: unknown): void {
    console.error('Error aislado en una pantalla de EnRuta:', error);
    this.failure.capture();
  }
}

@Component({
  selector: 'app-screen-boundary',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    ScreenFailureState,
    {
      provide: ErrorHandler,
      useFactory: (failure: ScreenFailureState) => new ScreenErrorHandler(failure),
      deps: [ScreenFailureState],
    },
  ],
  templateUrl: './screen-boundary.component.html',
  styleUrl: './screen-boundary.component.css',
})
export class ScreenBoundaryComponent {
  @Input({ required: true }) screen!: Type<unknown>;
  @Input({ required: true })
  set app(value: EnrutaState) {
    this.componentInputs = { app: value };
  }

  componentInputs!: { app: EnrutaState };

  constructor(readonly failure: ScreenFailureState) {}

  retry(): void {
    this.failure.reset();
  }
}
