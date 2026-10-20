import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Fingerprint, WifiOff } from 'lucide-angular';
import { COMPANY, SYNC_LOGIN } from '../data-extra';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LogoComponent, LucideAngularModule],
  host: { class: 'route-host' },
  template: `
    <div class="screen">
      <div class="login">
        <div class="login__top">
          <app-logo size="lg" />
          <p>Distribución y entrega directa</p>
        </div>

        <form class="login__form" (submit)="enter($event)">
          <div class="seg" role="radiogroup" aria-label="Tipo de acceso">
            <button type="button" role="radio" [attr.aria-checked]="role() === 'repartidor'" (click)="role.set('repartidor')">Repartidor</button>
            <button type="button" role="radio" [attr.aria-checked]="role() === 'negocio'" (click)="role.set('negocio')">Negocio</button>
          </div>

          <div class="field">
            <label for="empresa">Código de empresa</label>
            <input id="empresa" class="input" [value]="company.code" autocapitalize="none" autocorrect="off" />
            <span class="hint">Con este código se descarga tu catálogo y la marca de tu empresa.</span>
          </div>
          <div class="field">
            <label for="usuario">Usuario</label>
            <input id="usuario" class="input" [value]="role() === 'repartidor' ? 'operador@empresa' : 'dona.mari@correo.mx'" autocapitalize="none" autocomplete="username" />
          </div>
          <div class="field">
            <label for="pin">PIN de 4 dígitos</label>
            <input id="pin" class="input input--pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" autocomplete="current-password" [value]="pin()" (input)="setPin($any($event.target).value)" />
          </div>

          <button type="submit" class="btn" style="display: block; width: 50%; margin: 6px auto 0;">Entrar
          </button>
          <button type="button" class="btn btn--ghost" style="width: 50%">
            <lucide-icon [img]="FingerprintIcon" [size]="20" />Usar huella
          </button>

          <p class="login__offline">
            <lucide-icon [img]="WifiOffIcon" [size]="14" />
            Modo sin conexión disponible · último dato: {{ sync.lastData }}
          </p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private router = inject(Router);
  role = signal<'repartidor' | 'negocio'>('repartidor');
  pin = signal('');
  company = COMPANY;
  sync = SYNC_LOGIN;
  readonly FingerprintIcon = Fingerprint;
  readonly WifiOffIcon = WifiOff;

  setPin(value: string) {
    this.pin.set(value.replace(/\D/g, '').slice(0, 4));
  }

  enter(e: Event) {
    e.preventDefault();
    this.router.navigateByUrl(this.role() === 'repartidor' ? '/m/jornada' : '/m/negocio');
  }
}