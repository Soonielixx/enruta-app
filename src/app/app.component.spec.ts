/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { strToU8, zipSync } from 'fflate';
import { AppComponent } from './app.component';
import { MapboxService } from './core/mapbox.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('starts on the login screen with no seeded operational data', () => {
    const state = component.state;
    fixture.detectChanges();

    expect(state.authenticated).toBeFalse();
    expect(state.email).toBe('');
    expect(state.clients).toEqual([]);
    expect(state.products).toEqual([]);
    expect(state.routes).toEqual([]);
    expect(state.settingsModules.every((module) => !module.enabled)).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Inicia sesión');
  });

  it('opens the empty control tower after the simulated login', () => {
    const state = component.state;
    state.login();
    fixture.detectChanges();

    expect(state.authenticated).toBeTrue();
    expect(state.view).toBe('dashboard');
    expect(state.routes).toEqual([]);
    expect(state.notifications).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-dashboard-screen')).toBeTruthy();
  });

  it('updates product, client and route lists immediately after saving', async () => {
    const state = component.state;
    state.authenticated = true;
    state.products = [];
    state.clients = [];
    state.routes = [];

    const records = [
      { view: 'products', kind: 'producto', name: 'Producto inmediato' },
      { view: 'clients', kind: 'cliente', name: 'Cliente inmediato' },
      { view: 'routes', kind: 'ruta', name: 'Ruta inmediata' },
    ] as const;

    for (const [index, { view, kind, name }] of records.entries()) {
      if (index > 0) {
        fixture.destroy();
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
      }

      const currentState = component.state;
      state.navigate(view);
      fixture.detectChanges();
      currentState.openCreate(kind);
      currentState.draftName = name;

      await currentState.saveRecord();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.page-content').textContent)
        .withContext(`${kind} debe aparecer sin recargar la pestaña`)
        .toContain(name);
    }
  });

  it('draws road directions in the control tower and skips estimated straight lines', async () => {
    const state = component.state;
    const mapbox = TestBed.inject(MapboxService);
    state.clients = [
      { id: 1, name: 'Origen', detail: '', status: 'Activo', lat: 19.43, lng: -99.13 },
      { id: 2, name: 'Destino', detail: '', status: 'Activo', lat: 19.44, lng: -99.14 },
    ];
    state.routes = [{ id: 10, name: 'Ruta urbana', detail: '', status: 'Publicada', stopIds: [1, 2] }];
    const roadGeometry = [[-99.13, 19.43], [-99.135, 19.435], [-99.14, 19.44]];
    const directions = spyOn(mapbox, 'directions').and.resolveTo({
      distanceKm: 2,
      durationMin: 8,
      geometry: roadGeometry,
      estimated: false,
    });

    await state.refreshOverviewRoutes();

    expect(state.overviewLines).toEqual([{ color: '#4f35d5', coords: roadGeometry }]);

    directions.and.resolveTo({
      distanceKm: 2,
      durationMin: 8,
      geometry: [[-99.13, 19.43], [-99.14, 19.44]],
      estimated: true,
    });
    state.clients[1].lng = -99.15;
    await state.refreshOverviewRoutes();

    expect(state.overviewLines).toEqual([]);
  });

  it('renders every administrator and access screen', () => {
    const views = [
      'dashboard', 'routes', 'planner', 'approvals', 'reports', 'settlements', 'audit',
      'configuration', 'parameters', 'forms', 'publish', 'brand', 'integrations', 'import',
      'products', 'clients', 'prices', 'users', 'devices', 'profile', 'notifications', 'context',
    ] as const;
    const state = component.state;
    state.authenticated = true;
    for (const view of views) {
      state.navigate(view);
      fixture.detectChanges();
      const boundary = fixture.nativeElement.querySelector('app-screen-boundary');

      expect(boundary)
        .withContext(`La vista ${view} debe estar protegida por su límite de errores`)
        .toBeTruthy();
      expect(fixture.nativeElement.querySelector('.page-content h1'))
        .withContext(`La vista ${view} debe tener un título visible`)
        .toBeTruthy();
      expect(boundary.querySelector(`app-${view}-screen`))
        .withContext(`La vista ${view} debe renderizar su propio componente`)
        .toBeTruthy();
    }

    state.authenticated = false;
    for (const authView of ['login', 'verify', 'recover', 'reset', 'register', 'plan', 'submitted', 'permission', 'expired'] as const) {
      state.openAuth(authView);
      fixture.detectChanges();
      const boundary = fixture.nativeElement.querySelector('app-screen-boundary');

      expect(boundary)
        .withContext(`La pantalla de acceso ${authView} debe estar protegida por su límite de errores`)
        .toBeTruthy();
      expect(fixture.nativeElement.querySelector('.auth-card h2'))
        .withContext(`La vista de acceso ${authView} debe tener un título visible`)
        .toBeTruthy();
      expect(boundary.querySelector(`app-${authView}-screen`))
        .withContext(`La pantalla de acceso ${authView} debe renderizar su propio componente`)
        .toBeTruthy();
    }
  });

  it('imports the first worksheet of an Excel workbook only after confirmation', async () => {
    const workbook = zipSync({
      'xl/workbook.xml': strToU8(
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Clientes" sheetId="1" r:id="rId1"/></sheets></workbook>',
      ),
      'xl/_rels/workbook.xml.rels': strToU8(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      ),
      'xl/worksheets/sheet1.xml': strToU8(
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>nombre</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Cliente de prueba</t></is></c></row></sheetData></worksheet>',
      ),
    });
    const file = new File([new Blob([workbook])], 'clientes.xlsx');
    const event = { target: { files: [file] } } as unknown as Event;

    const state = component.state;
    await state.importDataFile(event);

    expect(state.pendingImported.map((record) => record.name)).toEqual(['Cliente de prueba']);
    expect(state.clients).toEqual([]);

    state.submitImport();

    expect(state.clients.map((record) => record.name)).toEqual(['Cliente de prueba']);
    expect(state.pendingImported).toEqual([]);
  });
});
