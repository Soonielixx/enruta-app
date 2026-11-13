import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnrutaState } from './enruta-state.service';
import { ScreenBoundaryComponent } from './screen-boundary.component';

@Component({
  selector: 'app-faulty-test-screen',
  standalone: true,
  template: '<button type="button" (click)="fail()">Provocar fallo</button><p>La pantalla se recuperó.</p>',
})
class FaultyTestScreenComponent {
  static shouldFail = true;

  fail(): void {
    if (FaultyTestScreenComponent.shouldFail) throw new Error('Fallo de prueba');
  }
}

@Component({
  selector: 'app-healthy-test-screen',
  standalone: true,
  template: '<p>Esta pantalla sigue activa.</p>',
})
class HealthyTestScreenComponent {}

@Component({
  standalone: true,
  imports: [ScreenBoundaryComponent],
  template: `
    <app-screen-boundary [screen]="faultyScreen" [app]="state" />
    <app-screen-boundary [screen]="healthyScreen" [app]="state" />
  `,
})
class ScreenBoundaryTestHostComponent {
  readonly state = inject(EnrutaState);
  readonly faultyScreen = FaultyTestScreenComponent;
  readonly healthyScreen = HealthyTestScreenComponent;
}

describe('ScreenBoundaryComponent', () => {
  let fixture: ComponentFixture<ScreenBoundaryTestHostComponent>;

  beforeEach(async () => {
    FaultyTestScreenComponent.shouldFail = true;
    await TestBed.configureTestingModule({
      imports: [ScreenBoundaryTestHostComponent],
    }).compileComponents();
    spyOn(console, 'error');
    fixture = TestBed.createComponent(ScreenBoundaryTestHostComponent);
  });

  it('contains a screen interaction failure and retries without unmounting other screens', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-healthy-test-screen')).toBeTruthy();

    const failingButton = fixture.nativeElement.querySelector('app-faulty-test-screen button') as HTMLButtonElement;
    failingButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar esta pantalla');
    expect(fixture.nativeElement.querySelector('app-faulty-test-screen')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-healthy-test-screen')).toBeTruthy();

    FaultyTestScreenComponent.shouldFail = false;
    const retryButton = fixture.nativeElement.querySelector('.screen-failure button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La pantalla se recuperó.');
    expect(fixture.nativeElement.querySelector('app-healthy-test-screen')).toBeTruthy();
  });
});
