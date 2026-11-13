import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { EnrutaState } from './enruta-state.service';

@Directive({ selector: 'form', standalone: true, host: { novalidate: '' } })
export class ValidateFormDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  private readonly state = inject(EnrutaState);
  private readonly handler = (event: Event) => {
    this.el.classList.add('submitted');
    if (this.el.checkValidity()) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const bad = this.el.querySelector(':invalid') as (HTMLInputElement | HTMLSelectElement | null);
    if (!bad) return;
    const label = (bad.closest('label')?.childNodes[0]?.textContent ?? bad.getAttribute('aria-label') ?? bad.name ?? 'campo').trim();
    const v = bad.validity;
    const message = v.valueMissing ? `Completa el campo «${label}».`
      : v.typeMismatch ? `Escribe un valor válido en «${label}».`
      : v.tooShort ? `«${label}» es demasiado corto.`
      : `El formato de «${label}» no es válido.`;
    this.state.fail(message);
    bad.focus();
  };
  ngOnInit(): void { this.el.addEventListener('submit', this.handler, true); }
  ngOnDestroy(): void { this.el.removeEventListener('submit', this.handler, true); }
}
