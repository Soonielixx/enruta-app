import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--lg]="size === 'lg'">
      <svg class="logo__mark" viewBox="0 0 56 56" aria-hidden="true">
        <rect width="56" height="56" rx="14" fill="#E8B000" />
        <path d="M14 42 L14 30 Q14 24 20 24 L34 24 Q40 24 40 18" fill="none" stroke="#0B2F52" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="14" cy="42" r="4.5" fill="#0B2F52" />
        <circle cx="40" cy="14" r="5.5" fill="none" stroke="#0B2F52" stroke-width="4" />
      </svg>
      <span>{{ label }}</span>
    </span>
  `,
})
export class LogoComponent {
  @Input() size: '' | 'lg' = '';
  @Input() label = 'EnRuta';
}