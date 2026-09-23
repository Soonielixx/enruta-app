// src/app/shared/signature-pad.component.ts
import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Output, PLATFORM_ID, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
    <div class="sig">
      <canvas
        #cv
        aria-label="Área de firma. Dibuja con el dedo."
        (pointerdown)="down($event)"
        (pointermove)="move($event)"
        (pointerup)="up()"
        (pointercancel)="up()"
      ></canvas>
      @if (!inked()) {
        <span class="sig__hint">Firma aquí con el dedo</span>
      }
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;
  @Output() inkedChange = new EventEmitter<boolean>();

  inked = signal(false);
  private drawing = false;
  private last = { x: 0, y: 0 };

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setup();
    }
  }

  clear() {
    this.setup();
    this.inked.set(false);
    this.inkedChange.emit(false);
  }

  private setup() {
    const c = this.cv.nativeElement;
    const box = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = box.width * dpr;
    c.height = box.height * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F1E2B';
  }

  private pt(e: PointerEvent) {
    const r = this.cv.nativeElement.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  down(e: PointerEvent) {
    this.cv.nativeElement.setPointerCapture(e.pointerId);
    this.drawing = true;
    this.last = this.pt(e);
  }

  move(e: PointerEvent) {
    if (!this.drawing) return;
    const p = this.pt(e);
    const ctx = this.cv.nativeElement.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    this.last = p;
    if (!this.inked()) {
      this.inked.set(true);
      this.inkedChange.emit(true);
    }
  }

  up() {
    this.drawing = false;
  }
}