import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { appConfig as appConfigProd } from './app/app.config.prod';
import { environment } from './environments/environment';

bootstrapApplication(App, environment.production ? appConfigProd : appConfig)
  .catch((err) => console.error(err));
