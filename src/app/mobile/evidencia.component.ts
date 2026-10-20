// src/app/mobile/evidencia.component.ts  (M-04 · Prueba de entrega)
import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, Check, LucideAngularModule, X } from 'lucide-angular';
import { MoneyPipe } from '../shared/money.pipe';
import { PillComponent } from '../shared/pill.component';
import { SignaturePadComponent } from '../shared/signature-pad.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-evidencia',
  standalone: true,
  imports: [ScreenComponent, PillComponent, SignaturePadComponent, LucideAngularModule, MoneyPipe],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Evidencia de entrega" [sub]="'Folio F-8842 · ' + (total | money)" back="/m/entrega" [actions]="true">
      <div class="card">
        <p class="k" style="margin-bottom: 8px">Firma de quien recibe</p>
        <app-signature-pad #pad (inkedChange)="signed.set($event)" />
        <div class="row" style="margin-top: 10px">
          <input class="input sp" aria-label="Nombre de quien recibe" [value]="name()" (input)="name.set($any($event.target).value)" />
          <button type="button" class="link" (click)="pad.clear()">Borrar</button>
        </div>
      </div>

      <div class="card">
        <p class="k" style="margin-bottom: 8px">Fotografía · {{ photos().length }} de 3</p>
        <div class="photos">
          @for (p of photos(); track p.id; let i = $index) {
            <div class="photo" [style.backgroundImage]="p.src ? 'url(' + p.src + ')' : null">
              <span class="pill pill--ok photo__tag"><lucide-icon [img]="CheckIcon" [size]="12" />Lista</span>
              <button type="button" class="photo__x" [attr.aria-label]="'Quitar foto ' + (i + 1)" (click)="remove(p.id)">
                <lucide-icon [img]="XIcon" [size]="14" />
              </button>
            </div>
          }
          @if (photos().length < 3) {
            <button type="button" class="photo photo--add" (click)="file.click()">
              <lucide-icon [img]="CameraIcon" [size]="22" /><span>Agregar</span>
            </button>
          }
          <input #file type="file" accept="image/*" capture="environment" hidden (change)="add($event)" />
        </div>
      </div>

      <div class="card card--ok">
        <div class="row">
          <span class="k sp">Ubicación verificada</span>
          <app-pill tone="ok">12 m</app-pill>
        </div>
        <p class="k" style="margin-top: 4px">16 sep 2026 · 10:18:44 · dispositivo TEC-0442</p>
        <p class="k">Se guardará y enviará al recuperar señal</p>
      </div>

      @if (!ready()) {
        <p class="k">Para confirmar falta: {{ !signed() ? 'la firma' : 'un dato obligatorio' }}.</p>
      }

      <div data-actions class="contents">
        <button type="button" class="btn btn--ghost" style="flex: 1" (click)="router.navigateByUrl('/m/entrega')">Atrás</button>
        <button type="button" class="btn" style="flex: 2" [disabled]="!ready()" (click)="router.navigateByUrl('/m/ruta')">Confirmar entrega</button>
      </div>
    </app-screen>
  `,
})
export class EvidenciaComponent {
  router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  @ViewChild('file') file!: ElementRef<HTMLInputElement>;

  total = 2946.5;
  signed = signal(false);
  name = signal('María Rodríguez');
  photos = signal<{ id: string; src: string | null }[]>([{ id: 'p1', src: null }]);
  ready = computed(() => this.signed() && this.photos().length > 0 && this.name().trim().length > 2);

  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly CameraIcon = Camera;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.total = history.state?.total ?? this.total;
    }
  }

  add(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.photos.update((p) => [...p, { id: String(Date.now()), src: URL.createObjectURL(f) }]);
    input.value = '';
  }
  remove(id: string) {
    this.photos.update((p) => p.filter((x) => x.id !== id));
  }
}