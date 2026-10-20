import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  template: `
    <dialog #dlg class="sheet" [attr.aria-label]="title" (close)="closed.emit()" (click)="onBackdrop($event)">
      <div class="sheet__panel">
        <div class="sheet__head">
          <h2>{{ title }}</h2>
          <button type="button" class="sheet__close" aria-label="Cerrar" (click)="closed.emit()">✕</button>
        </div>
        <div class="sheet__body"><ng-content /></div>
        <div class="sheet__foot"><ng-content select="[data-foot]" /></div>
      </div>
    </dialog>
  `,
})
export class BottomSheetComponent implements OnChanges, AfterViewInit {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
  @ViewChild('dlg') dlg!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit() {
    this.sync();
  }
  ngOnChanges() {
    this.sync();
  }
  private sync() {
    if (!this.dlg) return;
    const el = this.dlg.nativeElement;
    if (this.open && !el.open) el.showModal();
    if (!this.open && el.open) el.close();
  }
  onBackdrop(e: MouseEvent) {
    if (e.target === this.dlg.nativeElement) this.closed.emit();
  }
}