import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { MAPBOX_TOKEN } from './config';
import { EnrutaState } from './enruta-state.service';

let geoNotified = false;

export interface MapMarker {
  id: number;
  label: string;
  lat: number;
  lng: number;
  color?: string;
  order?: number;
  role?: 'start' | 'stop' | 'destination';
  detail?: string;
  status?: string;
  arrival?: string;
}
export interface MapLine { color: string; coords: number[][]; }

@Component({
  selector: 'app-route-map',
  standalone: true,
  template: `<div class="route-map-wrap" [style.height.px]="height"><div class="route-map" #host></div>@if (status) { <div class="route-map-status">{{ status }}</div> }</div>`,
})
export class RouteMapComponent implements AfterViewInit, DoCheck, OnDestroy {
  @Input() markers: MapMarker[] = [];
  @Input() lines: MapLine[] = [];
  @Input() height = 320;
  @Input() pick = false;
  @Output() picked = new EventEmitter<{ lat: number; lng: number }>();
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  status = 'Cargando mapa…';
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly platform = inject(PLATFORM_ID);
  private readonly appState = inject(EnrutaState);
  @Input() locate = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any; private gl: any; private domMarkers: any[] = [];
  private geolocate: any;
  private signature = ''; private loaded = false; private fitted = false;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platform)) return;
    try {
      const mod: any = await import('mapbox-gl/dist/mapbox-gl-csp');
      this.gl = mod.default ?? mod;
      this.gl.accessToken = MAPBOX_TOKEN;
      this.gl.workerUrl = new URL('assets/mapbox-gl-csp-worker.js', document.baseURI).toString();
      this.gl.workerCount = 1;
      this.gl.prewarm();
      this.zone.runOutsideAngular(() => {
        this.map = new this.gl.Map({ container: this.host.nativeElement, style: 'mapbox://styles/mapbox/streets-v12', center: [-99.1332, 19.4326], zoom: 10 });
        this.map.addControl(new this.gl.NavigationControl({ showCompass: false }), 'top-right');
        const geolocate = new this.gl.GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 12000 }, trackUserLocation: false, showUserLocation: true, showAccuracyCircle: false, fitBoundsOptions: { maxZoom: 15 } });
        this.map.addControl(geolocate, 'top-right');
        geolocate.on('geolocate', () => { if (this.markers.length || this.lines.length) { this.fitted = false; this.draw(); } });
        geolocate.on('error', (e: any) => {
          if (geoNotified) return; geoNotified = true;
          this.zone.run(() => this.appState.fail(e?.code === 1 ? 'Permiso de ubicación denegado. Actívalo en tu navegador para centrar el mapa en tu posición.' : 'No se pudo obtener tu ubicación actual.'));
        });
        this.geolocate = geolocate;
        this.map.on('load', () => {
          this.map.addSource('lines', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          this.map.addLayer({ id: 'lines-casing', type: 'line', source: 'lines', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': .82 } });
          this.map.addLayer({ id: 'lines', type: 'line', source: 'lines', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': .96 } });
          this.loaded = true;
          this.zone.run(() => {
            this.status = '';
            this.changeDetector.markForCheck();
          });
          this.map.resize();
          this.draw();
          if (this.locate && 'geolocation' in navigator) setTimeout(() => this.geolocate?.trigger(), 400);
        });
        this.map.on('click', (event: any) => {
          if (this.pick) this.zone.run(() => this.picked.emit({ lat: event.lngLat.lat, lng: event.lngLat.lng }));
        });
        this.map.on('error', (event: any) => {
          if (!this.loaded) this.zone.run(() => {
            this.status = 'No se pudo cargar el mapa. Revisa tu conexión.';
            this.changeDetector.markForCheck();
          });
          console.warn('Mapbox:', event?.error?.message ?? event);
        });
      });
    } catch (error) {
      console.error(error);
      this.status = 'No se pudo cargar el mapa.';
      this.changeDetector.markForCheck();
    }
  }

  ngDoCheck(): void {
    const next = JSON.stringify([this.markers, this.lines, this.pick]);
    if (next === this.signature) return;
    this.signature = next;
    if (this.loaded) this.zone.runOutsideAngular(() => this.draw());
  }

  ngOnDestroy(): void { this.domMarkers.forEach((marker) => marker.remove()); this.map?.remove(); }

  private draw(): void {
    if (!this.map || !this.gl) return;
    this.domMarkers.forEach((marker) => marker.remove());
    this.domMarkers = [];
    const bounds = new this.gl.LngLatBounds();
    let count = 0;
    for (const item of this.markers) {
      const el = document.createElement('div');
      const role = item.role ?? (item.order ? 'stop' : undefined);
      el.className = role ? `map-stop-marker map-stop-${role}` : 'map-dot';
      if (!role) el.style.background = item.color || '#1769aa';
      el.textContent = role === 'start' ? '▶' : role === 'destination' ? '⚑' : item.order ? String(item.order) : '';
      el.setAttribute('aria-label', this.markerDescription(item));
      el.title = this.markerDescription(item);
      const popupContent = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.label;
      popupContent.appendChild(title);
      if (item.detail) {
        const detail = document.createElement('p');
        detail.textContent = item.detail;
        popupContent.appendChild(detail);
      }
      if (item.status || item.arrival) {
        const info = document.createElement('small');
        info.textContent = [item.status, item.arrival ? `Llegada: ${item.arrival}` : ''].filter(Boolean).join(' · ');
        popupContent.appendChild(info);
      }
      const marker = new this.gl.Marker({ element: el, draggable: this.pick })
        .setLngLat([item.lng, item.lat])
        .setPopup(new this.gl.Popup({ offset: 16, closeButton: false }).setDOMContent(popupContent))
        .addTo(this.map);
      if (this.pick) marker.on('dragend', () => { const p = marker.getLngLat(); this.zone.run(() => this.picked.emit({ lat: p.lat, lng: p.lng })); });
      this.domMarkers.push(marker);
      bounds.extend([item.lng, item.lat]); count += 1;
    }
    const features = this.lines.filter((line) => line.coords.length > 1).map((line) => {
      line.coords.forEach((c) => bounds.extend(c as [number, number])); count += 1;
      return { type: 'Feature', properties: { color: line.color }, geometry: { type: 'LineString', coordinates: line.coords } };
    });
    (this.map.getSource('lines') as any)?.setData({ type: 'FeatureCollection', features });
    this.map.getCanvas().style.cursor = this.pick ? 'crosshair' : '';
    if (count && (!this.pick || !this.fitted)) {
      this.fitted = true;
      if (this.markers.length === 1 && !features.length) this.map.easeTo({ center: [this.markers[0].lng, this.markers[0].lat], zoom: Math.max(this.map.getZoom(), 14) });
      else this.map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 600 });
    }
  }

  private markerDescription(marker: MapMarker): string {
    const position = marker.role === 'start' ? 'Inicio'
      : marker.role === 'destination' ? 'Destino'
        : marker.order ? `Parada ${marker.order}` : '';
    return [position, marker.label, marker.detail, marker.status, marker.arrival ? `Llegada: ${marker.arrival}` : '']
      .filter(Boolean)
      .join(' · ');
  }
}
