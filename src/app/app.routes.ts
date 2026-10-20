// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MobileLayoutComponent } from './mobile/mobile-layout.component';
import { LoginComponent } from './mobile/login.component';
import { JornadaComponent } from './mobile/jornada.component';
import { RutaComponent } from './mobile/ruta.component';
import { MapaComponent } from './mobile/mapa.component';
import { ClienteComponent } from './mobile/cliente.component';
import { EntregaComponent } from './mobile/entrega.component';
import { EvidenciaComponent } from './mobile/evidencia.component';
import { NoEntregaComponent } from './mobile/no-entrega.component';
import { CobroComponent } from './mobile/cobro.component';
import { CorteComponent } from './mobile/corte.component';
import { NegocioComponent } from './mobile/negocio.component';
import { ReportarComponent } from './mobile/reportar.component';
import { TorreComponent } from './web/torre.component';
import { ConfigComponent } from './web/config.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'm/login' },
  {
    path: 'm',
    component: MobileLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', component: LoginComponent },       // W-01
      { path: 'jornada', component: JornadaComponent },   // W-02
      { path: 'ruta', component: RutaComponent },           // M-01
      { path: 'mapa', component: MapaComponent },           // M-02
      { path: 'cliente', component: ClienteComponent },   // W-05
      { path: 'entrega', component: EntregaComponent },     // M-03
      { path: 'evidencia', component: EvidenciaComponent }, // M-04
      { path: 'no-entrega', component: NoEntregaComponent }, // W-08
      { path: 'cobro', component: CobroComponent },       // W-09
      { path: 'corte', component: CorteComponent },         // M-05
      { path: 'negocio', component: NegocioComponent },     // M-06
      { path: 'reportar', component: ReportarComponent }, // W-12
    ],
  },
  { path: 'web', pathMatch: 'full', redirectTo: 'web/torre' },
  { path: 'web/torre', component: TorreComponent },       // M-07 / W-13
  { path: 'web/config', component: ConfigComponent },     // W-14
  { path: '**', redirectTo: 'm/login' },
];