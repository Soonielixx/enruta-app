// src/app/mobile/mobile-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="mobile-root">
      <div class="device"><router-outlet /></div>
    </div>
  `,
})
export class MobileLayoutComponent {}