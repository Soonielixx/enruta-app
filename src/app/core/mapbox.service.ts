import { Injectable } from '@angular/core';
import { MAPBOX_TOKEN } from './config';

export interface GeoResult { lat: number; lng: number; place: string; }
export interface DirectionsResult { distanceKm: number; durationMin: number; geometry: number[][]; estimated: boolean; }

@Injectable({ providedIn: 'root' })
export class MapboxService {
  private readonly base = 'https://api.mapbox.com';

  async geocode(query: string): Promise<GeoResult | null> {
    const q = query.trim();
    if (!q) return null;
    try {
      const res = await fetch(`${this.base}/search/geocode/v6/forward?q=${encodeURIComponent(q)}&limit=1&country=mx&language=es&access_token=${MAPBOX_TOKEN}`);
      if (!res.ok) return null;
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return null;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      return { lat, lng, place: feature.properties?.full_address || feature.properties?.name || q };
    } catch { return null; }
  }

  async reverse(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(`${this.base}/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&language=es&access_token=${MAPBOX_TOKEN}`);
      if (!res.ok) return '';
      const data = await res.json();
      return data.features?.[0]?.properties?.full_address ?? '';
    } catch { return ''; }
  }

  async directions(points: { lat: number; lng: number }[]): Promise<DirectionsResult | null> {
    if (points.length < 2) return null;
    try {
      let distance = 0; let duration = 0; const geometry: number[][] = [];
      for (let start = 0; start < points.length - 1; start += 24) {
        const chunk = points.slice(start, start + 25);
        if (chunk.length < 2) break;
        const coords = chunk.map((p) => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(`${this.base}/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`);
        if (!res.ok) throw new Error('directions');
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) throw new Error('no route');
        distance += route.distance; duration += route.duration;
        geometry.push(...route.geometry.coordinates);
      }
      return { distanceKm: distance / 1000, durationMin: duration / 60, geometry, estimated: false };
    } catch { return this.estimate(points); }
  }

  estimate(points: { lat: number; lng: number }[]): DirectionsResult {
    let km = 0;
    for (let i = 1; i < points.length; i += 1) km += this.haversine(points[i - 1], points[i]);
    km *= 1.3;
    return { distanceKm: km, durationMin: (km / 30) * 60, geometry: points.map((p) => [p.lng, p.lat]), estimated: true };
  }

  /** Devuelve el orden óptimo (índices de entrada). El primer punto se conserva como origen. */
  async optimize(points: { lat: number; lng: number }[]): Promise<number[]> {
    if (points.length < 3) return points.map((_, i) => i);
    if (points.length <= 12) {
      try {
        const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(`${this.base}/optimized-trips/v1/mapbox/driving/${coords}?source=first&destination=any&roundtrip=false&access_token=${MAPBOX_TOKEN}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && Array.isArray(data.waypoints)) {
            return (data.waypoints as { waypoint_index: number }[])
              .map((w, input) => ({ input, pos: w.waypoint_index }))
              .sort((a, b) => a.pos - b.pos).map((w) => w.input);
          }
        }
      } catch { /* usa el vecino más cercano */ }
    }
    return this.nearestNeighbor(points);
  }

  private nearestNeighbor(points: { lat: number; lng: number }[]): number[] {
    const order = [0]; const left = new Set(points.map((_, i) => i).slice(1));
    while (left.size) {
      const last = points[order[order.length - 1]];
      let best = -1; let bestD = Infinity;
      for (const i of left) { const d = this.haversine(last, points[i]); if (d < bestD) { bestD = d; best = i; } }
      order.push(best); left.delete(best);
    }
    return order;
  }

  private haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const rad = Math.PI / 180; const dLat = (b.lat - a.lat) * rad; const dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
}
