import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Camera, Check, X } from 'lucide-angular';
import { INCIDENCIA_ENTREGA, INCIDENCIA_REASONS } from '../data-extra';
import { OptionListComponent } from '../shared/option-list.component';
import { StepperComponent } from '../shared/stepper.component';
import { ScreenComponent } from './screen.component';

@Component({
  selector: 'app-reportar',
  standalone: true,
  imports: [ScreenComponent, OptionListComponent, StepperComponent, LucideAngularModule],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Reportar problema" back="/m/negocio" tone="client" [actions]="true">
      <div class="card">
        <p class="v">Entrega {{ e.folio }} · {{ e.fecha }}</p>
        <p class="k">Recibida por {{ e.recibio }}</p>
      </div>

      <p class="section-label">¿Qué pasó?</p>
      <app-option-list [options]="reasons" [value]="motivo()" label="Tipo de incidencia" (valueChange)="motivo.set($event)" />

      <p class="section-label">Producto afectado</p>
      <div class="card">
        <div class="row">
          <span class="v sp">{{ e.producto }}</span>
          <app-stepper [value]="qty()" [min]="1" [max]="5" [label]="'unidades de ' + e.producto" (valueChange)="qty.set($event)" />
        </div>
      </div>

      @if (photo(); as p) {
        <div class="photo" style="height: 68px" [style.backgroundImage]="'url(' + p + ')'">
          <span class="pill pill--ok photo__tag"><lucide-icon [img]="CheckIcon" [size]="12" />Lista</span>
          <button type="button" class="photo__x" aria-label="Quitar foto" (click)="photo.set(null)">
            <lucide-icon [img]="XIcon" [size]="14" />
          </button>
        </div>
      } @else {
        <button type="button" class="photo photo--add" style="height: 68px" (click)="file.click()">
          <lucide-icon [img]="CameraIcon" [size]="22" /><span>Foto de evidencia</span>
        </button>
      }
      <input #file type="file" accept="image/*" capture="environment" hidden (change)="addPhoto($event)" />

      <p class="k">Tu reporte llega al supervisor de la ruta y recibes respuesta en menos de 24 h.</p>

      <div data-actions class="contents">
        <button type="button" class="btn" style="flex: 1" [disabled]="!ready()" (click)="router.navigateByUrl('/m/negocio')">Enviar reporte</button>
      </div>
    </app-screen>
  `,
})
export class ReportarComponent {
  router = inject(Router);
  @ViewChild('file') file!: ElementRef<HTMLInputElement>;
  e = INCIDENCIA_ENTREGA;
  reasons = INCIDENCIA_REASONS;
  motivo = signal<string | null>('Faltó producto');
  qty = signal(1);
  photo = signal<string | null>(null);
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