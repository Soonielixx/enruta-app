import { DatePipe } from '@angular/common';
import { Component, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { API_URL } from '../core/config';
import { ApiDevice, ApiDriver, ApiError, ApiService, ApiVehicle, DeviceStatus, LinkToken } from '../core/api.service';
import { ValidateFormDirective } from '../core/validate-form.directive';
import type { EnrutaState } from '../core/enruta-state.service';

interface DeviceForm {
  alias: string; imei_serial: string; brand: string; model: string; os: string; os_version: string; phone: string;
  driver_id: string; vehicle_id: string; status: DeviceStatus;
}

const emptyForm = (): DeviceForm => ({ alias: '', imei_serial: '', brand: '', model: '', os: 'Android', os_version: '', phone: '', driver_id: '', vehicle_id: '', status: 'Activo' });

@Component({
  selector: 'app-devices-screen',
  standalone: true,
  imports: [FormsModule, DatePipe, QRCodeComponent, ValidateFormDirective],
  templateUrl: './devices-screen.component.html',
})
export class DevicesScreenComponent implements OnInit, OnDestroy {
  @Input({ required: true }) app!: EnrutaState;
  private readonly api = inject(ApiService);
  private readonly zone = inject(NgZone);

  devices: ApiDevice[] = []; drivers: ApiDriver[] = []; vehicles: ApiVehicle[] = [];
  loading = true; loadError = '';
  search = ''; statusFilter = 'Todos';
  selected: ApiDevice | null = null;
  readonly statuses: DeviceStatus[] = ['Activo', 'Inactivo', 'Reparación', 'Robado'];

  dialogOpen = false; editingId: string | null = null; form: DeviceForm = emptyForm(); saving = false;
  newDriver = { name: '', phone: '' }; newVehicle = { plate: '', description: '' }; addingDriver = false; addingVehicle = false;

  qr: LinkToken | null = null; qrPayload = ''; secondsLeft = 0; qrLoading = false; linkedNotice = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.stopQr(); }

  get filtered(): ApiDevice[] {
    const q = this.search.trim().toLowerCase();
    return this.devices.filter((d) => (this.statusFilter === 'Todos' || d.status === this.statusFilter)
      && (!q || [d.alias, d.imei_serial, d.model, d.driver_name, d.vehicle_plate].some((v) => (v ?? '').toLowerCase().includes(q))));
  }

  statusClass(status: string): string { return status === 'Reparación' ? 'status-reparacion' : status === 'Robado' ? 'status-robado' : status === 'Inactivo' ? 'status-inactivo' : 'status-green'; }

  availableDrivers(): ApiDriver[] { const used = new Set(this.devices.filter((d) => d.id !== this.editingId && d.driver_id).map((d) => d.driver_id)); return this.drivers.filter((d) => !used.has(d.id)); }
  availableVehicles(): ApiVehicle[] { const used = new Set(this.devices.filter((d) => d.id !== this.editingId && d.vehicle_id).map((d) => d.vehicle_id)); return this.vehicles.filter((v) => !used.has(v.id)); }

  private async guard<T>(job: () => Promise<T>): Promise<T | undefined> {
    try { return await job(); } catch (error) { this.app.fail(error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'); return undefined; }
  }

  async load(): Promise<void> {
    this.loading = true; this.loadError = '';
    try {
      const local = this.app.users.filter((u) => u.role === 'Repartidor' && u.email).map((u) => ({ name: u.name, email: u.email, phone: u.phone }));
      const [drivers, vehicles, devices] = await Promise.all([local.length ? this.api.syncDrivers(local) : this.api.drivers(), this.api.vehicles(), this.api.devices()]);
      this.drivers = drivers; this.vehicles = vehicles; this.devices = devices;
      if (this.selected) this.selected = devices.find((d) => d.id === this.selected?.id) ?? null;
    } catch (error) { this.loadError = error instanceof ApiError ? error.message : 'No se pudieron cargar los dispositivos.'; }
    finally { this.loading = false; }
  }

  select(device: ApiDevice): void { this.selected = device; this.stopQr(); this.linkedNotice = false; }

  openCreate(): void { this.editingId = null; this.form = emptyForm(); this.dialogOpen = true; this.addingDriver = false; this.addingVehicle = false; }
  openEdit(d: ApiDevice): void {
    this.editingId = d.id; this.dialogOpen = true; this.addingDriver = false; this.addingVehicle = false;
    this.form = { alias: d.alias, imei_serial: d.imei_serial, brand: d.brand ?? '', model: d.model ?? '', os: d.os ?? 'Android', os_version: d.os_version ?? '', phone: d.phone ?? '', driver_id: d.driver_id ?? '', vehicle_id: d.vehicle_id ?? '', status: d.status };
  }
  closeDialog(): void { this.dialogOpen = false; }

  async saveDriver(): Promise<void> {
    if (!this.newDriver.name.trim()) { this.app.fail('Escribe el nombre del conductor.'); return; }
    const driver = await this.guard(() => this.api.createDriver({ name: this.newDriver.name.trim(), phone: this.newDriver.phone.trim() || null }));
    if (!driver) return;
    this.drivers = [...this.drivers, driver].sort((a, b) => a.name.localeCompare(b.name)); this.form.driver_id = driver.id; this.newDriver = { name: '', phone: '' }; this.addingDriver = false;
  }

  async saveVehicle(): Promise<void> {
    if (!this.newVehicle.plate.trim()) { this.app.fail('Escribe la placa del vehículo.'); return; }
    const vehicle = await this.guard(() => this.api.createVehicle({ plate: this.newVehicle.plate.trim(), description: this.newVehicle.description.trim() || null }));
    if (!vehicle) return;
    this.vehicles = [...this.vehicles, vehicle].sort((a, b) => a.plate.localeCompare(b.plate)); this.form.vehicle_id = vehicle.id; this.newVehicle = { plate: '', description: '' }; this.addingVehicle = false;
  }

  async save(): Promise<void> {
    const f = this.form;
    if (!f.alias.trim()) { this.app.fail('Escribe un alias para el dispositivo.'); return; }
    if (!f.imei_serial.trim()) { this.app.fail('Escribe el IMEI o número de serie.'); return; }
    if (!/^\d{15}$/.test(f.imei_serial.trim()) && !/^[A-Za-z0-9-]{5,40}$/.test(f.imei_serial.trim())) { this.app.fail('El IMEI debe tener 15 dígitos o escribe un número de serie alfanumérico.'); return; }
    if (f.phone.trim() && !/^[0-9+\s()-]{7,20}$/.test(f.phone.trim())) { this.app.fail('El teléfono no es válido.'); return; }
    this.saving = true;
    const body = { ...f, driver_id: f.driver_id || null, vehicle_id: f.vehicle_id || null } as unknown as Partial<ApiDevice>;
    const saved = await this.guard(() => (this.editingId ? this.api.updateDevice(this.editingId, body) : this.api.createDevice(body)));
    this.saving = false;
    if (!saved) return;
    this.devices = this.editingId ? this.devices.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...this.devices];
    if (this.selected?.id === saved.id || !this.editingId) this.selected = saved;
    this.dialogOpen = false;
    this.app.showToast(this.editingId ? 'Dispositivo actualizado.' : 'Dispositivo agregado.');
  }

  async remove(d: ApiDevice): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar el dispositivo “${d.alias}”?`)) return;
    try { await this.api.deleteDevice(d.id); } catch (error) { this.app.fail(error instanceof ApiError ? error.message : 'No se pudo eliminar.'); return; }
    this.devices = this.devices.filter((x) => x.id !== d.id);
    if (this.selected?.id === d.id) { this.selected = null; this.stopQr(); }
    this.app.showToast('Dispositivo eliminado.');
  }

  // ---- QR ----
  async generateQr(): Promise<void> {
    const d = this.selected; if (!d) return;
    if (d.status === 'Robado') { this.app.fail('Un dispositivo marcado como robado no puede vincularse.'); return; }
    this.stopQr(); this.qrLoading = true; this.linkedNotice = false;
    const token = await this.guard(() => this.api.linkToken(d.id));
    this.qrLoading = false;
    if (!token) return;
    this.qr = token;
    this.qrPayload = JSON.stringify({ v: 1, api: API_URL, token: token.token });
    const tick = () => { this.secondsLeft = Math.max(0, Math.round((new Date(token.expiresAt).getTime() - Date.now()) / 1000)); if (!this.secondsLeft) this.stopTimers(); };
    tick();
    this.timer = setInterval(tick, 1000);
    const baseline = d.linked_at;
    this.poll = setInterval(async () => {
      try {
        const fresh = await this.api.device(d.id);
        if (fresh.linked_at && fresh.linked_at !== baseline) {
          this.zone.run(() => {
            this.devices = this.devices.map((x) => (x.id === fresh.id ? fresh : x)); this.selected = fresh;
            this.linkedNotice = true; this.stopQr(); this.app.showToast('Dispositivo vinculado correctamente.');
          });
        }
      } catch { /* reintenta en el siguiente ciclo */ }
    }, 3000);
  }

  get countdown(): string { return `${String(Math.floor(this.secondsLeft / 60)).padStart(2, '0')}:${String(this.secondsLeft % 60).padStart(2, '0')}`; }
  get qrExpired(): boolean { return !!this.qr && this.secondsLeft === 0; }

  private stopTimers(): void { if (this.timer) clearInterval(this.timer); if (this.poll) clearInterval(this.poll); this.timer = null; this.poll = null; }
  stopQr(): void { this.stopTimers(); this.qr = null; this.qrPayload = ''; this.secondsLeft = 0; }
}
