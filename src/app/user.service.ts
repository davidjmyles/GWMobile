/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-underscore-dangle */
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { User } from './user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { ContactMethod } from './tabnav/contact-method.model';
import * as _ from 'lodash';
import { LogoutService } from './logout.service';
import { ConnectionService } from './connection.service';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';
import { NotificationsService } from './notifications.service';
import { Promotion } from './promotion.model';

const currentUser = new User(
  0,
  '',
  false,
  false,
  0,
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  [],
  0,
  0,
  new Date(),
  0,
  '',
  [],
  '',
  false,
  '',
  new Promotion(0, '', '', '', '', new Date(), new Date(), false, false),
  false,
  false,
  '',
  0
);

export interface SignupResponseData {}

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to the current user */
export class UserService implements OnDestroy {
  private _user = new BehaviorSubject<User>(currentUser);
  isVerified = false;
  isLoading = false;
  themeIsSet = false;
  providerIsSet = false;
  title = this.storageService.get('title');
  playerId = this.storageService.get('playerId');
  userId = this.storageService.get('userId');
  username = this.storageService.get('username');
  connectionString;
  apiKey;
  hash;
  connectionSub: Subscription;
  ignoreMismtach = true;

  get user() {
    return this._user.asObservable();
  }

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private storageService: StorageService,
    private logoutService: LogoutService,
    private connectionService: ConnectionService,
    private notificationsService: NotificationsService,
    private ngZone: NgZone
  ) {}

  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }

  async checkData() {

  }

  /*
   * submits a set of new user details to the API & saves some details to local storage
   *
   * @param userData - signup data entered by the user
   */
  async addNewUser(userData: {
    gadRef: number | null;
    parishCode: string;
    username: string;
    password: string;
    confirmPassword: string;
    appVersion: number;
    deviceNotifications: boolean;
    platform: string;
    personalDetails: { title: string; surname: string; forename: string };
    addressDetails: {
      door: string;
      address1: string;
      address2: string;
      address3: string;
      address4: string;
      postcode: string;
    };
    contactDetails: ContactMethod[];
  }) {
    console.log(userData);
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.isLoading = true;
    const databaseCode = await this.storageService.get('databaseCode');
    var headers = new HttpHeaders({
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      'x-api-version': '2.0',
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    var headers2 = new HttpHeaders({
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'submitting details...' })
      .then((loadingEl) => {
        loadingEl.present();
        let userObs: Observable<any>;
        userObs = this.http.post<any>(
          `https://${this.connectionString}/api/user`,
          userData,
          { headers: headers }
        );
        userObs.subscribe(
          (resData) => {
            this.storageService.set('userId', resData.userId);
            this.storageService.set('playerId', resData.playerId);
            let externalUserId = databaseCode + '-' + resData.playerId;
            this.hash = resData.hash;
            this.notificationsService.setNotificationsExternalId(
              externalUserId,
              this.hash
            );
            this.isLoading = false;
            loadingEl.dismiss();
            this.router.navigateByUrl('/tabnav/landing');
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes.error[0];
            let message = '';
            if (code === 'Email is already in use') {
              message =
                'this email address is already registered. please login or reset your password';
              this.showAlertEmail(message);
            } else {
              message = 'could not signup. please try again';
              this.showAlertFail(message);
            }
          }
        );
      });
  }


  /* generic alert message for failed signup */
  private showAlertFail(message: string) {
    this.alertCtrl
      .create({
        header: 'signup failed',
        cssClass: 'custom-alert',
        message: message,
        buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
      })
      .then((alertEl) => alertEl.present());
  }

  /* alert message for signup attempt with duplicate email */
  private showAlertEmail(message: string) {
    this.alertCtrl
      .create({
        header: 'signup failed',
        cssClass: 'custom-alert',
        message: message,
        buttons: [
          {
            text: 'ok',
            cssClass: 'alert-button-ok',
            handler: () => {
              this.ngZone.run(() => {
                this.router.navigateByUrl('/tabnav/auth');
              });
            },
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }
}
