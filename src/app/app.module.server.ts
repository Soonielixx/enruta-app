import { NgModule } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';

export default () => bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...(appConfig.providers ?? []), provideServerRendering()],
});
