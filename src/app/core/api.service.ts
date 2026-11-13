import { Injectable, inject } from '@angular/core';
import { API_KEY, API_URL } from './config';
import { EnrutaState } from './enruta-state.service';

export interface ApiDriver { id: string; name: string; email: string | null; phone: string | null; }
export interface ApiVehicle { id: string; plate: string; description: string | null; }
export type DeviceStatus = 'Activo' | 'Inactivo' | 'Reparación' | 'Robado';
export interface ApiDevice {
  id: string; alias: string; imei_serial: string; brand: string | null; model: string | null; os: string | null; os_version: string | null; phone: string | null;
  driver_id: string | null; vehicle_id: string | null; status: DeviceStatus; driver_name: string | null; vehicle_plate: string | null;
  fcm_token: string | null; reported_model: string | null; reported_os: string | null; linked_at: string | null; created_at: string;
}
export interface LinkToken { token: string; jti: string; expiresAt: string; ttlSeconds: number; }

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly state = inject(EnrutaState);

  private get company(): string { return (this.state.account?.company ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method, headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'x-company': this.company },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch { throw new ApiError(`No se pudo conectar con el servidor (${API_URL}). Inicia el backend con “docker compose up”.`, 0); }
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError((data as { error?: string }).error ?? `Error ${response.status}`, response.status);
    return data as T;
  }

  drivers(): Promise<ApiDriver[]> { return this.request('GET', '/api/drivers'); }
  syncDrivers(drivers: { name: string; email?: string; phone?: string }[]): Promise<ApiDriver[]> { return this.request('POST', '/api/drivers/sync', { drivers }); }
  createDriver(d: Partial<ApiDriver>): Promise<ApiDriver> { return this.request('POST', '/api/drivers', d); }
  vehicles(): Promise<ApiVehicle[]> { return this.request('GET', '/api/vehicles'); }
  createVehicle(v: Partial<ApiVehicle>): Promise<ApiVehicle> { return this.request('POST', '/api/vehicles', v); }
  devices(): Promise<ApiDevice[]> { return this.request('GET', '/api/devices'); }
  device(id: string): Promise<ApiDevice> { return this.request('GET', `/api/devices/${id}`); }
  createDevice(d: Partial<ApiDevice>): Promise<ApiDevice> { return this.request('POST', '/api/devices', d); }
  updateDevice(id: string, d: Partial<ApiDevice>): Promise<ApiDevice> { return this.request('PUT', `/api/devices/${id}`, d); }
  deleteDevice(id: string): Promise<void> { return this.request('DELETE', `/api/devices/${id}`); }
  linkToken(id: string): Promise<LinkToken> { return this.request('POST', `/api/devices/${id}/link-token`); }
}
