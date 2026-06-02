import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { APP_INITIALIZER } from '@angular/core';
import { DatabaseService } from './app/services/database';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

export function initializeDatabase(dbService: DatabaseService) {
  return () => dbService.initialize();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    DatabaseService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDatabase,
      deps: [DatabaseService],
      multi: true,
    },
  ],
});
