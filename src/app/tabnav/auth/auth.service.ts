import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from 'src/app/storage.service';
import { User } from 'src/app/user.model';
import { UserService } from 'src/app/user.service';
import * as _ from 'lodash';
import { ContactMethod } from '../contact-method.model';
import { LogoutService } from 'src/app/logout.service';
import { NgForm } from '@angular/forms';
import { Data } from 'src/app/data.model';
import { DataService } from 'src/app/data.service';
import { ConnectionService } from 'src/app/connection.service';
import OneSignal, { OneSignalPlugin } from 'onesignal-cordova-plugin';
import { Capacitor } from '@capacitor/core';
import { NotificationsService } from 'src/app/notifications.service';
import { BalanceService } from 'src/app/balance.service';
import { ProviderService } from 'src/app/provider.service';
import { Promotion } from 'src/app/promotion.model';
import { MaintenanceService } from 'src/app/maintenance.service';
//import { BiometricsService } from 'src/app/biometrics.service';

export interface AuthResponseData {
  access_Token: string;
  hasWriteAccess: boolean;
  roles: [];
  username: string;
  player: {
    rejected: boolean;
    isVerified: boolean;
    hash: string;
    joined: string;
    userId: number;
    promotion: Promotion;
    addressDetails: {
      door: string;
      address1: string;
      address2: string;
      address3: string;
      address4: string;
      postcode: string;
    };
    contactDetails: ContactMethod[];
    personalDetails: {
      title: string;
      forename: string;
      surname: string;
    };
    appVersion: number;
    deviceNotifications: boolean;
    platform: string;
  };
  playerPromotion: {
    promotionId: number;
    playerId: number;
    read: boolean;
  };
}

export interface ResetData {
  username: string;
  token: string;
  resetCode: string;
}

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to login, logout & password management */
export class AuthService implements OnDestroy {
  newReset = { username: '', token: '', resetCode: '' };
  private _reset = new BehaviorSubject<ResetData>(this.newReset);
  private _userIsAuthenticated = false;
  private _userId;
  private _token;
  isLoading = false;
  isVerified = false;
  rejected;
  loginComplete = false;
  currentUser: User;
  currentData: Data;
  balanceDecimals;
  decimals = 0;
  connectionString;
  apiKey;
  connectionSub: Subscription;
  notificationSub: Subscription;
  hash: any;
  navUrl;

  get userIsAuthenticated() {
    return this._userIsAuthenticated;
  }

  get userId() {
    return this._userId;
  }

  get reset() {
    return this._reset;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private storageService: StorageService,
    private userService: UserService,
    private dataService: DataService,
    private logoutService: LogoutService,
    private connectionService: ConnectionService,
    private ngZone: NgZone,
    private notificationService: NotificationsService,
    private balanceService: BalanceService,
    private providerService: ProviderService, //private biometricsService: BiometricsService,
    private platform: Platform,
    private maintenanceService: MaintenanceService
  ) {}

  /* unsubscribes from subscriptions when service is destroyed */
  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  async login(
    email: string,
    password: string,
    notificationUrl: string,
    hasBiometrics: boolean
  ) {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
      console.log(this.connectionString);
      console.log(this.apiKey);
    });
    this.isLoading = true;
    const databaseCode = await this.storageService.get('databaseCode');
    console.log(databaseCode);
    var headersAuth = new HttpHeaders({
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      'x-api-version': '2.0',
    });
    console.log(headersAuth);
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Logging in...' })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<any>;
        authObs = this.http.post<any>(
          `https://${this.connectionString}/api/Auth`,
          {
            username: email,
            password: password,
          },
          { headers: headersAuth }
        );
        authObs.subscribe({
          next: (resData) => {
            console.log(resData);
            this.userService.user.subscribe((user) => {
              this.currentUser = user;
              this.currentUser.username = resData.username;
              this.currentUser.title = resData.player.personalDetails.title;
              this.currentUser.firstName =
                resData.player.personalDetails.forename;
              this.currentUser.surname = resData.player.personalDetails.surname;
              this.currentUser.door = resData.player.addressDetails.door;
              this.currentUser.address1 =
                resData.player.addressDetails.address1;
              this.currentUser.address2 =
                resData.player.addressDetails.address2;
              this.currentUser.address3 =
                resData.player.addressDetails.address3;
              this.currentUser.address4 =
                resData.player.addressDetails.address4;
              this.currentUser.postcode =
                resData.player.addressDetails.postcode;
              this.currentUser.contactMethods = resData.player.contactDetails;
              this.currentUser.contactMethods.forEach((method) => {
                method.oldValue = method.value;
              });
              this.currentUser.userId = resData.player.userId;
              this.currentUser.dateJoined = resData.player.joined;
              this.currentUser.hasBiometrics = hasBiometrics;
              this.currentUser.hash = resData.player.hash;
              this.currentUser.promotion = resData.player.promotion;
              // if (resData.player.promotion !== null) {
                //   this.currentUser.promotionRead = resData.player.promotion.read;
                // }
                this.hash = resData.player.hash;
                this.storageService.set('userId', this.currentUser.userId);
                this.storageService.set('playerId', resData.playerId);
              this.rejected = resData.player.rejected;
              this.isVerified = resData.player.isVerified;
              this.currentUser.appVersion = resData.player.appVersion;
              this.currentUser.deviceNotificationsPermission =
                resData.player.deviceNotifications;
              this.currentUser.platform = resData.player.platform;
            });
            this.logoutService.userIsAuthenticated = true;
            this._userIsAuthenticated = true;
            if (resData.player.isVerified && !resData.player.rejected) {
              console.log('this thing');
            this.userService.isVerified = true;
            }
            console.log(this.userService.isVerified);
            if (this.rejected) {
              console.log('1');
              //loadingEl.dismiss();
              this.router.navigateByUrl('/tabnav/rejected');
            } else if (!this.isVerified && !this.rejected) {
              console.log('2');
              //loadingEl.dismiss();
              this.router.navigateByUrl('/tabnav/unverified');
            } else if (notificationUrl === '' || !notificationUrl) {
              console.log('3');
              this.router.navigateByUrl('/tabnav/tabs/dashboard');
            } else {
              console.log('4');
              this.router.navigateByUrl(notificationUrl);
            }
            let instanceId = databaseCode + '-' + resData.player;
            this.notificationService.setNotificationsExternalId(
              instanceId,
              this.hash
            );
            this.isLoading = false;
            loadingEl.dismiss();
          },
          error: (errRes) => {
            loadingEl.dismiss();
            const error = errRes.error;
            if (error === 'Invalid username and / password') {
              let message =
                'your email or password is incorrect. please check and try again';
              this.showAlert(message);
            } else {
              let message =
                'could not login. please try again or contact administrator';
              this.showAlert(message);
            }
          }
        });
       });
    //this.maintenanceService.getMaintenance();
    this.providerService.setProvider(databaseCode);
  }

  /*
   * logs user in & subscribes to user & data services to set variables used across the app where
   * applicable. also determines onward navigation based on user status.
   *
   * @param email = users inputted email address
   * @param password = users inputted password
   *
   */
  // async login2(
  //   email: string,
  //   password: string,
  //   notificationUrl: string,
  //   hasBiometrics: boolean
  // ) {
  //   this.connectionSub = this.connectionService.connection.subscribe((data) => {
  //     this.connectionString = data.connectionString;
  //     this.apiKey = data.apiKey;
  //   });
  //   this.isLoading = true;
  //   const databaseCode = await this.storageService.get('databaseCode');
  //   var headersAuth = new HttpHeaders({
  //     dbCode: databaseCode,
  //     ApiKey: this.apiKey,
  //     'x-api-version': '2.0',
  //     //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
  //   });
  //   this.loadingCtrl
  //     .create({ keyboardClose: true, message: 'Logging in...' })
  //     .then((loadingEl) => {
  //       loadingEl.present();
  //       let authObs: Observable<AuthResponseData>;
  //       authObs = this.http.post<AuthResponseData>(
  //         `https://${this.connectionString}/api/Auth`,
  //         {
  //           username: email,
  //           password: password,
  //         },
  //         { headers: headersAuth }
  //       );
  //       authObs.subscribe(
  //         async (resData) => {
  //           this.userService.user.subscribe((user) => {
  //             console.log(resData);
  //             console.log(user);
  //             this.currentUser = user;
  //             this.currentUser.username = resData.username;
  //             this.currentUser.title = resData.player.personalDetails.title;
  //             this.currentUser.firstName =
  //               resData.player.personalDetails.forename;
  //             this.currentUser.surname = resData.player.personalDetails.surname;
  //             this.currentUser.door = resData.player.addressDetails.door;
  //             this.currentUser.address1 =
  //               resData.player.addressDetails.address1;
  //             this.currentUser.address2 =
  //               resData.player.addressDetails.address2;
  //             this.currentUser.address3 =
  //               resData.player.addressDetails.address3;
  //             this.currentUser.address4 =
  //               resData.player.addressDetails.address4;
  //             this.currentUser.postcode =
  //               resData.player.addressDetails.postcode;
  //             this.currentUser.contactMethods = resData.player.contactDetails;
  //             console.log(resData);
  //             this.currentUser.contactMethods.forEach((method) => {
  //               method.oldValue = method.value;
  //             });
  //             this.currentUser.userId = resData.player.userId;
  //             this.currentUser.dateJoined = resData.player.joined;
  //             this.currentUser.hasBiometrics = hasBiometrics;
  //             this.currentUser.hash = resData.player.hash;
  //             this.currentUser.promotion = resData.player.promotion;
  //             this.currentUser.promotionRead = resData.player.promotionRead;
  //             this.hash = resData.player.hash;
  //             this.storageService.set('userId', this.currentUser.userId);
  //             this.isVerified = resData.player.isVerified;
  //             console.log(this.currentUser);
  //           });
  //           this.logoutService.userIsAuthenticated = true;
  //           this._userIsAuthenticated = true;
  //           if (this.isVerified) {
  //             var headers = new HttpHeaders({
  //               'Content-Type': 'application/json',
  //               Authorization: 'Bearer ' + resData.access_Token,
  //               dbCode: databaseCode,
  //               ApiKey: this.apiKey,
  //               'x-api-version': '3.0',
  //             });
  //             this.storageService.set('token', resData.access_Token);
  //             console.log('from login: ' + resData.access_Token);
  //             let authObs2: Observable<any>;
  //             authObs2 = this.http.get<any>(
  //               `https://${this.connectionString}/api/User/verified/${this.currentUser.userId}`,
  //               { headers: headers }
  //             );
  //             authObs2.subscribe(
  //               (resData) => {
  //                 //if (Array.isArray(resData)) {
  //                 //if (resData.length > 1) {
  //                 //var index = resData.findIndex((res) => res.playerId === 8);
  //                 //} else {
  //                 var index = 0;
  //                 console.log(resData[index].rejected);
  //                 //}
  //                 if (resData[index].isVerified && !resData[index].rejected) {
  //                   console.log('condition 1');
  //                   this.userService.isVerified = true;
  //                   this.dataService.data.subscribe((data) => {
  //                     this.currentData = data;
  //                   });
  //                   this.storageService.set(
  //                     'playerId',
  //                     resData[index].playerId
  //                   );
  //                   if (resData[index].payments.length > 0) {
  //                     this.currentData.paymentsArray = resData[index].payments;
  //                     let rawDate = this.currentData.paymentsArray[0].date;
  //                     this.currentData.lastPaymentDate = new Date(
  //                       Date.parse(rawDate)
  //                     );
  //                   }
  //                   if (resData[index].tickets.length > 0) {
  //                     this.currentData.ticketsArray = resData[index].tickets;
  //                   }
  //                   this.currentData.lastDrawDate = resData[index].lastDrawDate;
  //                   this.currentData.ticketCost = resData[index].ticketCost;
  //                   this.currentData.nextPaymentAmount =
  //                     resData[index].nextPaymentAmount;
  //                   this.currentData.nextPaymentDate =
  //                     resData[index].nextPaymentDate;
  //                   this.currentData.currentBalance = resData[index].balance;
  //                   this.currentData.lowBalanceAlert =
  //                     resData[index].lowBalanceAlert;
  //                   this.currentData.drawDay = resData[index].day;
  //                   this.currentData.drawHour = resData[index].time;
  //                   this.decimals = this.countDecimals(resData[index].balance);
  //                   this.decimals = this.countDecimals(resData[index].balance);
  //                   this.setDecimals(this.decimals);
  //                   let sum = _.sumBy(resData[index].tickets, 'amountWon');
  //                   this.currentData.totalWinnings = sum;
  //                   this.isLoading = false;
  //                   loadingEl.dismiss();
  //                   if (notificationUrl === '' || !notificationUrl) {
  //                     this.router.navigateByUrl('/tabnav/tabs/dashboard');
  //                   } else {
  //                     this.router.navigateByUrl(notificationUrl);
  //                   }
  //                 } else if (resData[index].rejected) {
  //                   console.log('condition 2');
  //                   loadingEl.dismiss();
  //                   this.router.navigateByUrl('/tabnav/rejected');
  //                 }
  //                 let instanceId = databaseCode + '-' + resData[index].playerId;
  //                 this.notificationService.setNotificationsExternalId(
  //                   instanceId,
  //                   this.hash
  //                 );
  //               },
  //               (errRes) => {
  //                 const code = errRes;
  //                 let message = 'could not update at this time';
  //                 //this.showAlertUpdate(message);
  //               }
  //             );
  //           } else {
  //             console.log('condition 3');
  //             loadingEl.dismiss();
  //             this.router.navigateByUrl('/tabnav/unverified');
  //           }
  //         },
  //         (errRes) => {
  //           loadingEl.dismiss();
  //           const error = errRes.error;
  //           if (error === 'Invalid username and / password') {
  //             let message =
  //               'your email or password is incorrect. please check and try again';
  //             this.showAlert(message);
  //           } else {
  //             let message =
  //               'could not login. please try again or contact administrator';
  //             this.showAlert(message);
  //           }
  //         }
  //       );
  //     });
  //   this.providerService.setProvider(databaseCode);
  // }

  /*
   * sends request to API to generate password reset code. also saves response data to use in next
   * stage & handles onward navigation
   *
   * @param email - users registered email address to which password reseet code is sent
   *
   */
  async forgotPassword(email: string) {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.isLoading = true;
    const databaseCode = await this.storageService.get('databaseCode');
    var headersForgot = new HttpHeaders({
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'submitting request...' })
      .then((loadingEl) => {
        loadingEl.present();
        let forgotObs: Observable<any>;
        forgotObs = this.http.post<any>(
          `https://${this.connectionString}/api/auth/forgotpassword`,
          {
            username: email,
          },
          { headers: headersForgot }
        );
        forgotObs.subscribe(
          (resData) => {
            this.newReset.token = resData.access_Token;
            this.newReset.resetCode = resData.resetCode;
            this.newReset.username = email;
            loadingEl.dismiss();
            this.router.navigateByUrl('/tabnav/reset');
          },
          (errRes) => {
            loadingEl.dismiss();
            const error = errRes.error;
            if (error === 'User with this email address does not exist') {
              this.showAlertForgotPassword(
                'no user with this email address could be found. please try again or contact your administrator'
              );
            } else {
              this.showAlertForgotPassword(
                'cannot proceed at this time. please try later or contact your administrator'
              );
            }
          }
        );
      });
  }

  /*
   * sends password reset data to API. also handles errors
   *
   * @param resetCode - code which user retrieves from email & enters on reset form
   * @param password - new user password
   * @param email - users email address
   * @param token - authorisation token, saved in local storage
   *
   */
  async resetPassword(
    resetCode: string,
    password: string,
    email: string,
    token: string,
    hasBiometrics: boolean
  ) {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.isLoading = true;
    const databaseCode = await this.storageService.get('databaseCode');
    var headersReset = new HttpHeaders({
      Authorization: 'Bearer ' + token,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'submitting request...' })
      .then((loadingEl) => {
        loadingEl.present();
        let forgotObs: Observable<any>;
        forgotObs = this.http.post<any>(
          `https://${this.connectionString}/api/auth/resetPassword`,
          {
            email: email,
            resetCode: resetCode,
            password: password,
          },
          { headers: headersReset }
        );
        forgotObs.subscribe(
          (resData) => {
            loadingEl.dismiss();
            this.showAlertPassword(email, password, hasBiometrics);
            // if (hasBiometrics) {
            //   const message =
            //     'Could not reset biometric login function. Please continue and retry from main menu';
            //   this.biometricsService.setCredential(
            //     email,
            //     password,
            //     'server',
            //     message,
            //     false
            //   );
            // }
          },
          (errRes) => {
            //console.log(errRes);
            loadingEl.dismiss();
            const error = errRes.error;
            //console.log(error);
            if (error == 'Code entered is invalid') {
              this.showAlertResetPassword(
                'the reset code entered is invalid. please try again or request a new code'
              );
            } else if (error === 'Reset Code has expired') {
              this.showAlertResetPassword(
                'this reset code has expired. please request a new one'
              );
            } else {
              this.showAlertResetPassword(
                'could not reset password. please try later or contact your administrator'
              );
            }
          }
        );
      });
  }

  /*
   * user alert for successful password change. gives option to login or exit
   *
   * @param email - user email address for auto login
   * @param password = user password for auto login
   *
   */
  private showAlertPassword(
    email: string,
    password: string,
    hasBiometrics: boolean
  ) {
    this.alertCtrl
      .create({
        header: 'Success',
        message: 'your password was successfully changed',
        buttons: [
          {
            text: 'continue login',
            handler: () => {
              this.login(email, password, '', hasBiometrics);
            },
          },
          {
            text: 'exit',
            handler: () => {
              this.router.navigateByUrl('/tabnav/auth');
            },
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  /* returns the number of decimal places in input value
   *
   * @param number - input value
   */
  countDecimals(number: number) {
    if (Number.isInteger(number)) {
      return 0;
    }
    return number.toString().split('.')[1].length;
  }

  /* sets the value of local variable to input
   *
   * @param input - input value
   */
  setDecimals(input: number) {
    if (input === 0) {
      this.balanceDecimals = 0;
    } else if (input === 1) {
      this.balanceDecimals = 1;
    } else if (input === 2) {
      this.balanceDecimals = 2;
    }
  }

  /* alert message for failed login */
  private showAlert(message: string) {
    this.alertCtrl
      .create({
        header: 'Authentication Failed',
        message: message,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /* alert message for failed password reset request */
  private showAlertForgotPassword(message: string) {
    this.alertCtrl
      .create({
        header: 'Request Failed',
        message: message,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /* alert message for failed password reset */
  private showAlertResetPassword(message: string) {
    this.alertCtrl
      .create({
        header: 'Reset Failed',
        message: message,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  // private showAlertUpdate(message: string) {
  //   this.alertCtrl
  //     .create({
  //       header: 'update failed',
  //       message: message,
  //       buttons: ['ok'],
  //     })
  //     .then((alertEl) => alertEl.present());
  // }

  /* logs user out, resetting all data & authentication status */
  logout() {
    //this.setNotificationsExternalId('', this.currentUser.hash);
    this.alertCtrl
      .create({
        header: 'logout',
        cssClass: 'custom=alert',
        message: 'are you sure you want to logout?',
        buttons: [
          {
            text: 'confirm',
            cssClass: 'alert-button-ok',
            handler: () => {
              this.ngZone.run(() => {
                this.router.navigateByUrl('/tabnav/auth');
              });
              this._userIsAuthenticated = false;
              this.logoutService.userIsAuthenticated = false;
              this.isVerified = false;
              this.storageService.set('token', '');
              this.storageService.set('userId', '');
              if (this.currentData) {
                this.currentData.userId = 0;
                this.currentData.dateJoined = '';
                this.currentData.playerId = 0;
                this.currentData.isVerified = false;
                this.currentData.contactMethods = [];
                this.currentData.totalWinnings = 0;
                this.currentData.currentBalance = 0;
                this.currentData.ticketCost = 0;
                this.currentData.lastDrawDate = '';
                this.currentData.drawDay = 0;
                this.currentData.drawHour = 0;
                this.currentData.lastPaymentDate = new Date();
                this.currentData.nextPaymentAmount = 0;
                this.currentData.nextPaymentDate = '';
                this.currentData.paymentsArray = [];
                this.currentData.memberNumber = 0;
                this.currentData.memberNumberList = [];
              }
              this.currentUser.userId = 0;
              this.currentUser.dateJoined = '';
              this.currentUser.username = '';
              this.currentUser.password = '';
              this.currentUser.confirmPassword = '';
              this.currentUser.title = '';
              this.currentUser.firstName = '';
              this.currentUser.surname = '';
              this.currentUser.door = '';
              this.currentUser.address1 = '';
              this.currentUser.address2 = '';
              this.currentUser.address3 = '';
              this.currentUser.address4 = '';
              this.currentUser.postcode = '';
              this.notificationService.resetNotificationUrl();
              //this.router.navigateByUrl('/tabnav/auth');
            },
          },
          {
            text: 'cancel',
            cssClass: 'alert-button-role-cancel',
          },
        ],
      })
      .then((alertEl) => alertEl.present());
    this.loginComplete = false;
  }

  /* logs user out without check alert, resetting all data & authentication status */
  logoutNoCheck() {
    //this.setNotificationsExternalId('', this.currentUser.hash);
    this._userIsAuthenticated = false;
    this.logoutService.userIsAuthenticated = false;
    this.isVerified = false;
    this.storageService.set('token', '');
    this.storageService.set('userId', '');
    if (this.currentData) {
      this.currentData.userId = 0;
      this.currentData.dateJoined = '';
      this.currentData.playerId = 0;
      this.currentData.isVerified = false;
      this.currentData.contactMethods = [];
      this.currentData.totalWinnings = 0;
      this.currentData.currentBalance = 0;
      this.currentData.ticketCost = 0;
      this.currentData.lastDrawDate = '';
      this.currentData.drawDay = 0;
      this.currentData.drawHour = 0;
      this.currentData.lastPaymentDate = new Date();
      this.currentData.nextPaymentAmount = 0;
      this.currentData.nextPaymentDate = '';
      this.currentData.paymentsArray = [];
      this.currentData.memberNumber = 0;
      this.currentData.memberNumberList = [];
    }
    this.currentUser.userId = 0;
    this.currentUser.dateJoined = '';
    this.currentUser.username = '';
    this.currentUser.password = '';
    this.currentUser.confirmPassword = '';
    this.currentUser.title = '';
    this.currentUser.firstName = '';
    this.currentUser.surname = '';
    this.currentUser.door = '';
    this.currentUser.address1 = '';
    this.currentUser.address2 = '';
    this.currentUser.address3 = '';
    this.currentUser.address4 = '';
    this.currentUser.postcode = '';
    this.router.navigateByUrl('/tabnav/auth');
    this.notificationService.resetNotificationUrl();
  }

  /* logs user out & returns to signup page. used when user details cannot be matched to existing player */
  logoutToSignup() {
    //OneSignal.removeExternalUserId();
    this.ngZone.run(() => {
      this.router.navigateByUrl('/tabnav/signup');
    });
    this._userIsAuthenticated = false;
    this.logoutService.userIsAuthenticated = false;
    this.isVerified = false;
    this.storageService.set('token', '');
    this.storageService.set('userId', '');
    (this.currentUser.userId = 0),
      (this.currentUser.dateJoined = ''),
      (this.currentUser.username = ''),
      (this.currentUser.password = ''),
      (this.currentUser.confirmPassword = ''),
      (this.currentUser.title = ''),
      (this.currentUser.firstName = ''),
      (this.currentUser.surname = ''),
      (this.currentUser.door = ''),
      (this.currentUser.address1 = ''),
      (this.currentUser.address2 = ''),
      (this.currentUser.address3 = ''),
      (this.currentUser.address4 = ''),
      (this.currentUser.postcode = '');
    if (this.currentData) {
      this.currentData.userId = 0;
      this.currentData.dateJoined = '';
      this.currentData.playerId = 0;
      this.currentData.isVerified = false;
      this.currentData.contactMethods = [];
      this.currentData.totalWinnings = 0;
      this.currentData.currentBalance = 0;
      this.currentData.ticketCost = 0;
      this.currentData.lastDrawDate = '';
      this.currentData.drawDay = 0;
      this.currentData.drawHour = 0;
      this.currentData.lastPaymentDate = new Date();
      this.currentData.nextPaymentAmount = 0;
      this.currentData.nextPaymentDate = '';
      this.currentData.paymentsArray = [];
      this.currentData.memberNumber = 0;
      this.currentData.memberNumberList = [];
    }
  }
}
