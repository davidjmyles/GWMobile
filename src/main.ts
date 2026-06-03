import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
// CHANGE: Add the following import
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// CHANGE: Call the element loader before the `bootstrapModule` call
defineCustomElements(window);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
