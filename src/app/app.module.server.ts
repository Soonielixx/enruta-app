import { provideServerRendering } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

export default () =>
  bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [...(appConfig.providers ?? []), provideServerRendering()],
  });
