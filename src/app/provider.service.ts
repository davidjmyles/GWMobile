import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ConnectionService } from './connection.service';
import { Provider } from './provider.model';
import { UserService } from './user.service';
import { StorageService } from './storage.service';

const currentProvider = new Provider(
  0,
  '',
  '',
  '',
  0,
  0,
  '',
  {},
  '',
  '',
);

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to the users lottery provider*/
export class ProviderService implements OnDestroy {
  private _provider = new BehaviorSubject<Provider>(currentProvider);
  connectionString;
  apiKey;
  connectionSub: Subscription;

  get provider() {
    return this._provider.asObservable();
  }

  constructor(
    private _http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private connectionService: ConnectionService,
    private storageService: StorageService
  ) {}

  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }

  /*
   * sets app theme using provider code
   *
   * @param providerCode - provider specific code entered by user
   */
  // setTheme(providerCode) {
  //   if (providerCode == 123456) {
  //     document.querySelector('body').classList.add('one');
  //     //this.setTheme('two');
  //   }
  //   if (providerCode == 654321) {
  //     document.querySelector('body').classList.add('two');
  //     //this.setTheme('two');
  //   }
  //   this.userService.themeIsSet = true;
  // }

  /*
   * makes API call using provider code entered by user. response values are set to an observable
   *
   * @param providerCode - provider specific code entered by user
   */
  setProvider(providerCode: string) {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    var headers = new HttpHeaders({
      dbCode: providerCode,
      ApiKey: this.apiKey,
      'x-api-version': '2.0',
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'starting up. please wait' })
      .then((loadingEl) => {
        loadingEl.present();
        let Obs: Observable<Provider>;
        Obs = this.http.get<Provider>(
          `https://${this.connectionString}/api/setup/VerifyCode`,

          { headers: headers }
        );
        Obs.subscribe({
              next: (resData) => {  
                    console.log(resData);
                    currentProvider.parameterId = resData.parameterId;
                    currentProvider.name = resData.name;
                    currentProvider.blurb = resData.blurb;
                    currentProvider.iconUrl = resData.iconUrl;
                    currentProvider.dbCode = providerCode;
                    currentProvider.appVersion = resData.appVersion;
                    currentProvider.minAppVersion = resData.minAppVersion;
                    currentProvider.cssVars = resData.cssVars; 
                    currentProvider.appleLinkUrl = resData.appleLinkUrl;
                    currentProvider.googleLinkUrl = resData.googleLinkUrl;
                    this.loadStyle2();
                    this.userService.providerIsSet = true;
                    loadingEl.dismiss();
                    this.router.navigateByUrl('/tabnav/auth');
               }, 
               error: (errRes) => {
                 loadingEl.dismiss();
                 this.showAlertThemeFail();
               }
        });
      });
  }

  /* sets app styling according to provider parameters */
  private loadStyle2() {
    if (currentProvider.cssVars !== null) {
      Object.keys(currentProvider.cssVars).forEach((k) => {
        document.body.style.setProperty(k, currentProvider.cssVars[k]);
      });
    }
  }

  /* alerts user that setting of provider & theme was not successful */
  private showAlertThemeFail() {
    this.alertCtrl
      .create({
        header: 'setup failed',
        cssClass: 'custom-alert',
        message:
          'cannot proceed with setup. please ensure you are connected to the internet and are entering the correct code received from your lottery provider',
        buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
      })
      .then((alertEl) => alertEl.present());
  }
}
