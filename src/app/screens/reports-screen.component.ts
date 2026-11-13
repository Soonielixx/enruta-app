import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-reports-screen',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reports-screen.component.html',
})
export class ReportsScreenComponent {
  @Input({ required: true }) app!: EnrutaState;
  get maxStops(): number { return Math.max(0, ...this.app.routes.map((r) => r.stopIds?.length ?? 0)); }
  get coverage(): string { const n = this.app.clients.length; return n ? `${Math.round(((n - this.app.clientsWithoutLocation) / n) * 100)}%` : '—'; }
  get delta(): number | null { const prev = this.app.previousPeriodEvents.length; return this.app.reportPeriod === 'all' || !prev ? null : Math.round(((this.app.periodEvents.length - prev) / prev) * 100); }
  get activity(): { label: string; value: number; pct: number }[] {
    const days = this.app.reportPeriod === 'all' ? 30 : Number(this.app.reportPeriod); const out: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - i); const end = start.getTime() + 86_400_000;
      out.push({ label: start.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }), value: this.app.auditEvents.filter((e) => e.id >= start.getTime() && e.id < end).length });
    }
    const max = Math.max(1, ...out.map((o) => o.value));
    return out.some((o) => o.value) ? out.map((o) => ({ ...o, pct: Math.max(3, (o.value / max) * 100) })) : [];
  }
  private segments(items: { label: string; value: number; color: string }[]) { const total = items.reduce((s, i) => s + i.value, 0) || 1; return items.filter((i) => i.value).map((i) => ({ ...i, pct: (i.value / total) * 100 })); }
  get clientSegments() { const c = this.app.clients; const unlocated = c.filter((x) => x.lat === undefined).length; return this.segments([{ label: 'Activos con ubicación', value: c.filter((x) => x.status === 'Activo' && x.lat !== undefined).length, color: '#17865b' }, { label: 'Sin ubicación', value: unlocated, color: '#f29900' }, { label: 'Inactivos', value: c.filter((x) => x.status !== 'Activo' && x.lat !== undefined).length, color: '#9aa9b8' }]); }
  get routeSegments() { const r = this.app.routeStatusCounts; return this.segments([{ label: 'Publicadas', value: r.published, color: '#17865b' }, { label: 'En aprobación', value: r.pending, color: '#f29900' }, { label: 'Borrador', value: r.draft, color: '#9aa9b8' }]); }
  get categories(): { label: string; value: number; pct: number }[] {
    const map = new Map<string, number>(); for (const p of this.app.products) map.set(p.category || 'Sin categoría', (map.get(p.category || 'Sin categoría') ?? 0) + 1);
    const list = [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8); const max = Math.max(1, ...list.map((l) => l.value));
    return list.map((l) => ({ ...l, pct: (l.value / max) * 100 }));
  }
  exportReport(): void {
    this.app.downloadCsv('indicadores.csv', [['Indicador', 'Valor'], ['Rutas publicadas', this.app.routeStatusCounts.published], ['Rutas totales', this.app.routes.length], ['Paradas planeadas', this.app.totalStops], ['Clientes', this.app.clients.length], ['Clientes sin ubicación', this.app.clientsWithoutLocation], ['Productos', this.app.products.length], ['Eventos del periodo', this.app.periodEvents.length]]);
  }
}
