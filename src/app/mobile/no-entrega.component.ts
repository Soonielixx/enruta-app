import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Camera, Check, X } from 'lucide-angular';
import { NO_ENTREGA_REASONS } from '../data-extra';
import { OptionListComponent } from '../shared/option-list.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-no-entrega',
  standalone: true,
  imports: [ScreenComponent, OptionListComponent, LucideAngularModule],
  host: { class: 'route-host' },
  template: `
    <app-screen title="No se entregó" back="/m/cliente" [actions]="true">
      <p class="section-label">Motivo · obligatorio</p>
      <app-option-list [options]="reasons" [value]="motivo()" label="Motivo de no entrega" (valueChange)="motivo.set($event)" />

      <div class="field">
        <label for="comentario">Comentario</label>
        <textarea id="comentario" class="input input--area" style="min-height: 64px; margin-top: 0" placeholder="Cortina abajo, vecina dice que abren…"></textarea>
      </div>

      <p class="k">Foto del local · obligatoria</p>
      @if (photo(); as p) {
        <div class="photo" style="height: 68px" [style.backgroundImage]="'url(' + p + ')'">
          <span class="pill pill--ok photo__tag"><lucide-icon [img]="CheckIcon" [size]="12" />Lista</span>
          <button type="button" class="photo__x" aria-label="Quitar foto" (click)="photo.set(null)">
            <lucide-icon [img]="XIcon" [size]="14" />
          </button>
        </div>
      } @else {
        <button type="button" class="photo photo--add" style="height: 68px" (click)="file.click()">
          <lucide-icon [img]="CameraIcon" [size]="22" /><span>Foto del local</span>
        </button>
      }
      <input #file type="file" accept="image/*" capture="environment" hidden (change)="addPhoto($event)" />

      <div class="row">
        <span class="k sp" style="font-weight: 600">Reprogramar</span>
        <button type="button" class="chip" [class.chip--on]="repro() === 'Mañana'" (click)="repro.set('Mañana')">Mañana</button>
        <button type="button" class="chip" [class.chip--on]="repro() === 'Otro día'" (click)="repro.set('Otro día')">Otro día</button>
      </div>

      <div data-actions class="contents">
        <button type="button" class="btn" style="flex: 1" [disabled]="!ready()" (click)="router.navigateByUrl('/m/ruta')">Registrar y continuar</button>
      </div>
    </app-screen>
  `,
})
export class NoEntregaComponent {
  router = inject(Router);
  @ViewChild('file') file!: ElementRef<HTMLInputElement>;
  reasons = NO_ENTREGA_REASONS;
  motivo = signal<string | null>('Local cerrado');
  photo = signal<string | null>(null);
  repro = signal<string | null>(null);
  ready = computed(() => !!this.motivo() && this.photo() !== null);
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly CameraIcon = Camera;

  addPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.photo.set(URL.createObjectURL(f));
    input.value = '';
  }
}