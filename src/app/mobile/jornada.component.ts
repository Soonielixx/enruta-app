import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, AlertCircle, Check, ChevronRight } from 'lucide-angular';
import { LOAD_DIFF_REASONS, LOAD_LINES, LoadLine, UNITS, Unit } from '../data-extra';
import { ROUTE } from '../data';
import { PillComponent } from '../shared/pill.component';
import { StepperComponent } from '../shared/stepper.component';
import { OptionListComponent } from '../shared/option-list.component';
import { BottomSheetComponent } from '../shared/bottom-sheet.component';
import { ScreenComponent } from './screen.component';

type Status = 'pending' | 'ok' | 'diff';

@Component({
  selector: 'app-jornada',
  standalone: true,
  imports: [ScreenComponent, PillComponent, StepperComponent, OptionListComponent, BottomSheetComponent, LucideAngularModule],
  host: { class: 'route-host' },
  template: `
    <app-screen title="Inicio de jornada" [sub]="'Ruta ' + route.code + ' · ' + route.date" [sync]="'—'" [actions]="true">
      <div class="card">
        <div class="row">
          <div class="sp">
            <div class="k">Unidad</div>
            <div class="v">{{ unit().name }}</div>
          </div>
          <button type="button" class="btn btn--ghost" style="min-height: 36px; padding: 0 14px; font-size: 13px" (click)="unitSheet.set(true)">Cambiar</button>
        </div>
        <hr class="divider" />
        <div class="field">
          <label for="km">Kilometraje inicial</label>
          <div class="input-suffix">
            <input id="km" class="input" inputmode="numeric" [value]="unit().km.replace(' km','')" />
            <span>km</span>
          </div>
        </div>
      </div>

      <div class="row" style="margin-top: 4px">
        <h2 class="section-label sp">Confirmar carga · {{ lines().length }} SKU</h2>
        @if (pendingCount() > 0) {
          <button type="button" class="link" (click)="confirmPending()">Confirmar {{ pendingCount() }} pendientes</button>
        }
      </div>
      <div class="prog"><i [style.width.%]="(confirmedCount() / lines().length) * 100"></i></div>
      <p class="k">{{ confirmedCount() }} de {{ lines().length }} productos contados</p>

      @for (l of lines(); track l.id) {
        <div class="card card--link" [class.card--ok]="statusOf(l) === 'ok'" [class.card--bad]="statusOf(l) === 'diff' && !l.reason" [class.card--hl]="statusOf(l) === 'diff' && !!l.reason" (click)="openCount(l)">
          <div class="row">
            <div class="sp">
              <div class="v">{{ l.name }}</div>
              <div class="k">{{ statusOf(l) === 'diff' ? 'Cargado ' + l.loaded + ' · contado ' + l.counted : 'Cargado ' + l.loaded + (l.loaded === 1 ? ' caja' : ' cajas') }}</div>
              @if (statusOf(l) === 'diff') {
                <div class="k" [class.k--bad]="!l.reason">{{ l.reason ? 'Motivo: ' + l.reason : 'Elige el motivo de la diferencia' }}</div>
              }
            </div>
            @if (statusOf(l) === 'ok') {
              <app-pill tone="ok"><lucide-icon [img]="CheckIcon" [size]="12" />OK</app-pill>
            }
            @if (statusOf(l) === 'diff') {
              <app-pill tone="bad"><lucide-icon [img]="AlertIcon" [size]="12" />Diferencia</app-pill>
            }
            @if (statusOf(l) === 'pending') {
              <app-pill>Pendiente</app-pill>
            }
            <lucide-icon [img]="ChevronIcon" [size]="18" class="chev" />
          </div>
        </div>
      }
      <p class="k">Toda diferencia exige motivo antes de iniciar la ruta.</p>

      <div data-actions class="contents">
        <button type="button" class="btn btn--ghost" style="flex: 1" [disabled]="!firstDiff()" (click)="firstDiff() && openCount(firstDiff()!)">Reportar</button>
        <button type="button" class="btn" style="flex: 2" [disabled]="!ready()" (click)="router.navigateByUrl('/m/ruta')">Iniciar ruta</button>
      </div>
    </app-screen>

    <app-bottom-sheet [open]="editingId() !== null" [title]="editing() ? 'Contar · ' + editing()!.name : 'Contar'" (closed)="editingId.set(null)">
      @if (editing(); as l) {
        <div class="row">
          <div class="sp">
            <div class="k">Cargado en almacén</div>
            <div class="v">{{ l.loaded }} {{ l.loaded === 1 ? 'caja' : 'cajas' }}</div>
          </div>
          <div>
            <div class="k" style="text-align: right">Contado en la unidad</div>
            <app-stepper [value]="draft().counted" [label]="'cajas contadas'" (valueChange)="draft.set({ counted: $event, reason: $event === l.loaded ? null : draft().reason })" />
          </div>
        </div>
        @if (hasDiff()) {
          <p class="alert-line">
            <lucide-icon [img]="AlertIcon" [size]="16" />
            Diferencia de {{ diffAbs() }} {{ diffAbs() === 1 ? 'caja' : 'cajas' }}. Elige el motivo.
          </p>
          <app-option-list [options]="reasons" [value]="draft().reason" label="Motivo de la diferencia" (valueChange)="draft.set({ counted: draft().counted, reason: $event })" />
        } @else {
          <p class="k">El conteo coincide con lo cargado.</p>
        }
      }
      <div data-foot>
        <button type="button" class="btn" style="width: 100%" [disabled]="hasDiff() && !draft().reason" (click)="saveCount()">Guardar conteo</button>
      </div>
    </app-bottom-sheet>

    <app-bottom-sheet [open]="unitSheet()" title="Cambiar unidad" (closed)="unitSheet.set(false)">
      <div class="options">
        @for (u of units; track u.id) {
          <button type="button" role="radio" [attr.aria-checked]="u.id === unit().id" class="option option--two" (click)="unit.set(u); unitSheet.set(false)">
            <span class="option__dot" aria-hidden="true"></span>
            <span>
              <span class="v" style="display: block">{{ u.name }}</span>
              <span class="k">Último kilometraje {{ u.km }}</span>
            </span>
          </button>
        }
      </div>
    </app-bottom-sheet>
  `,
})
export class JornadaComponent {
  router = inject(Router);
  route = ROUTE;
  units = UNITS;
  reasons = LOAD_DIFF_REASONS;

  lines = signal<LoadLine[]>(LOAD_LINES.map((l) => ({ ...l })));
  unit = signal<Unit>(UNITS[0]);
  unitSheet = signal(false);
  editingId = signal<string | null>(null);
  draft = signal<{ counted: number; reason: string | null }>({ counted: 0, reason: null });

  readonly CheckIcon = Check;
  readonly AlertIcon = AlertCircle;
  readonly ChevronIcon = ChevronRight;

  statusOf(l: LoadLine): Status {
    if (l.counted === null) return 'pending';
    return l.counted === l.loaded ? 'ok' : 'diff';
  }
  pendingCount = computed(() => this.lines().filter((l) => this.statusOf(l) === 'pending').length);
  confirmedCount = computed(() => this.lines().length - this.pendingCount());
  diffNoReasonCount = computed(() => this.lines().filter((l) => this.statusOf(l) === 'diff' && !l.reason).length);
  ready = computed(() => this.pendingCount() === 0 && this.diffNoReasonCount() === 0);
  firstDiff = computed(() => this.lines().find((l) => this.statusOf(l) === 'diff' && !l.reason) ?? null);
  editing = computed(() => this.lines().find((l) => l.id === this.editingId()) ?? null);
  hasDiff = computed(() => !!this.editing() && this.draft().counted !== this.editing()!.loaded);
  diffAbs = computed(() => (this.editing() ? Math.abs(this.draft().counted - this.editing()!.loaded) : 0));

  openCount(l: LoadLine) {
    this.draft.set({ counted: l.counted ?? l.loaded, reason: l.reason });
    this.editingId.set(l.id);
  }
  saveCount() {
    const id = this.editingId();
    this.lines.update((ls) => ls.map((l) => (l.id === id ? { ...l, counted: this.draft().counted, reason: this.draft().counted === l.loaded ? null : this.draft().reason } : l)));
    this.editingId.set(null);
  }
  confirmPending() {
    this.lines.update((ls) => ls.map((l) => (l.counted === null ? { ...l, counted: l.loaded } : l)));
  }
}