// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MobileLayoutComponent } from './mobile/mobile-layout.component';
import { RutaComponent } from './mobile/ruta.component';
import { MapaComponent } from './mobile/mapa.component';
import { EntregaComponent } from './mobile/entrega.component';
import { EvidenciaComponent } from './mobile/evidencia.component';
import { CorteComponent } from './mobile/corte.component';
import { NegocioComponent } from './mobile/negocio.component';
import { TorreComponent } from './web/torre.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'm/ruta' },
  {
    path: 'm',
    component: MobileLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ruta' },
      { path: 'ruta', component: RutaComponent },           // M-01
      { path: 'mapa', component: MapaComponent },           // M-02
      { path: 'entrega', component: EntregaComponent },     // M-03
      { path: 'evidencia', component: EvidenciaComponent }, // M-04
      { path: 'corte', component: CorteComponent },         // M-05
      { path: 'negocio', component: NegocioComponent },     // M-06
    ],
  },
  { path: 'web', component: TorreComponent },               // M-07
  { path: '**', redirectTo: 'm/ruta' },
];