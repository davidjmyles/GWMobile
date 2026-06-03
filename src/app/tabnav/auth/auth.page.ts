import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  NgZone,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { NotificationsService } from 'src/app/notifications.service';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { StorageService } from 'src/app/storage.service';
import { User } from 'src/app/user.model';
import { UserService } from 'src/app/user.service';
import { AuthService } from './auth.service';
import OneSignal from 'onesignal-cordova-plugin';
import { MaintenanceService } from 'src/app/maintenance.service';
import { BiometricsService } from 'src/app/biometrics.service';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { VersionService } from 'src/app/version.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false,
})
/* defines & controls functionality on auth page */
export class AuthPage implements OnInit, OnDestroy {
  isLogin = false;
  passwordIcon = 'eye-outline';
  showPassword = false;
  //email = 'neil@carnsoftware.co.uk';
  //email = '670253@carntest.com';
  email = 'gw1@gmail.com';
  password = 'P@55word1';
  //email = '';
  //password = '';
  currentUser: User;
  userSub: Subscription;
  providerSub: Subscription;
  notificationsSub: Subscription;
  biometricsSub: Subscription;
  biometricsSub2: Subscription;
  versionSub: Subscription;
  logoImage = 'assets/img/logo.jpg';
  currentProvider: Provider;
  versionNumber;
  instanceId;
  instanceIdChanged = false;
  navUrl = '';
  notificationUrl = '';
  hasBiometrics = false;
  biometryType = '';
  largeScreen;
  appVersion;

  constructor(
    private userService: UserService,
    private providerService: ProviderService,
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService,
    private notificationsService: NotificationsService,
    private alertCtrl: AlertController,
    private platform: Platform,
    private appComponent: AppComponent,
    private maintenanceService: MaintenanceService,
    private biometricsService: BiometricsService,
    private changeDetectorRef: ChangeDetectorRef,
    private versionService: VersionService,
    private ngZone: NgZone
  ) {}

  /* subscribes to provider service & sets local variables to subscription values */
  ngOnInit() {
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(() => {
        this.biometricsService.getBiometricType();
      });
    }
    //this.maintenanceService.getMaintenance();
    // let code = await this.storageService.get('databaseCode');
    // await this.providerService.setProvider(code);
    // await this.providerService.setTheme(code);
    this.userSub = this.userService.user.subscribe((user) => {
      //   this.currentUser = user;
      if (this.currentUser) {
        this.hasBiometrics = this.currentUser.hasBiometrics;
      }
      //   console.log(this.isLogin);
    });
    //this.storageService.set('databaseCode', code);
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.logoImage = this.currentProvider.iconUrl;
      this.versionNumber = this.currentProvider.appVersion;
    });
    this.notificationsSub = this.notificationsService.navUrl.subscribe(
      (url) => {
        this.notificationUrl = url;
      }
    );
    this.biometricsSub =
      this.biometricsService.checkBiometricsUserPermission.subscribe(
        (permission) => {
          this.hasBiometrics = permission;
        }
      );
    this.biometricsSub2 = this.biometricsService.biometryType.subscribe(
      (type) => {
        this.biometryType = type;
      }
    );
    if (this.biometryType === '') {
      this.biometryType = 'Biometrics';
    }
    let screenSize = window.innerWidth;
    let screenHeight = window.innerHeight;
    if (screenSize > 1000) {
      this.largeScreen = true;
    } else {
      this.largeScreen = false;
    }
    this.versionSub = this.versionService.appVersion.subscribe((appVersion) => {
      this.appVersion = appVersion;
    });
    this.promptAppUpdate();
  }

  ionViewWillEnter() {
    this.checkBiometrics();
  }

  promptAppUpdate() {
    let currentVersion = this.appVersion;
    let latestVersion = this.currentProvider.appVersion;
    let minVersion = this.currentProvider.minAppVersion;
    if (currentVersion < latestVersion && currentVersion >= minVersion) {
      this.canUpgradePrompt();
    }
    if (currentVersion < minVersion) {
      this.mustUpgradePrompt();
    }
  }

  async canUpgradePrompt() {
    let platform = Capacitor.getPlatform();
    if (platform == 'ios' || platform == 'web') {
      const alert = await this.alertCtrl.create({
        header: 'Update Available',
        message:
          'A new version of Lotterylink is available from the App Store. Click below to update & get the latest features',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              window.open(this.currentProvider.appleLinkUrl, '_system');
              // this.ngZone.run(() => {
              //   this.router.navigateByUrl(this.currentProvider.appleLinkUrl);
              // });
            },
          },
          {
            text: 'CANCEL',
          },
        ],
        backdropDismiss: false,
      });
      await alert.present();
    }
    if (platform == 'android') {
      const alert = await this.alertCtrl.create({
        header: 'Update Available',
        message:
          'A new version of Lotterylink is available from the Play Store. Click below to update & get the latest features',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              window.open(this.currentProvider.googleLinkUrl, '_system');
              // this.ngZone.run(() => {
              //   this.router.navigateByUrl(this.currentProvider.appleLinkUrl);
              // });
            },
          },
          {
            text: 'CANCEL',
          },
        ],
        backdropDismiss: false,
      });
      await alert.present();
    }
  }

  async mustUpgradePrompt() {
    let platform = Capacitor.getPlatform();
    if (platform == 'ios' || platform == 'web') {
      const alert = await this.alertCtrl.create({
        header: 'Update Required',
        message:
          'This version of LotteryLink is no longer supported. Please go to the App Store and update',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              window.open(this.currentProvider.appleLinkUrl, '_system');
              // this.ngZone.run(() => {
              //   this.router.navigateByUrl(this.currentProvider.appleLinkUrl);
              // });
            },
            role: 'confirm',
          },
        ],
        backdropDismiss: false,
      });
      await alert.present();
    }
    if (platform == 'android') {
      const alert = await this.alertCtrl.create({
        header: 'Update Required',
        message:
          'This version of LotteryLink is no longer supported. Please go to the Play Store and update',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              window.open(this.currentProvider.googleLinkUrl, '_system');
              // this.ngZone.run(() => {
              //   this.router.navigateByUrl(this.currentProvider.appleLinkUrl);
              // });
            },
            role: 'confirm',
          },
        ],
        backdropDismiss: false,
      });
      await alert.present();
    }
  }

  /* navigates to signup page */
  onSignup() {
    this.router.navigateByUrl('/tabnav/signup');
  }

  async checkBiometrics() {
    let platform = Capacitor.getPlatform();
    if (platform != 'web') {
      this.changeDetectorRef.detectChanges();
      const result = await NativeBiometric.isAvailable();
      const available = result.isAvailable;
      let check: boolean = await this.storageService.get('hasBiometrics');
      if (check === true && available) {
        this.hasBiometrics = true;
      } else {
      }
    }
  }

  /*
   * submits login form data to authService login function
   *
   * @param form - login form data containing user entered email/password
   */
  onLogin(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    this.authService.login(
      email,
      password,
      this.notificationUrl,
      this.hasBiometrics
    );
    this.password = '';
    this.email = '';
    this.notificationUrl = '';
  }

  // onSetBiometrics() {
  //   this.biometricsService.setCredential(
  //     'carnsoftwareapp24090@carntest.com',
  //     'P@55word1',
  //     'server'
  //   );
  //   //this.storageService.set('hasBiometrics', true);
  //   //this.biometricsService.updateBiometricsUserPermission(true);
  // }

  onCheckBiometrics() {
    this.biometricsService.checkCredential(
      this.notificationUrl,
      this.hasBiometrics
    );
  }

  /* sets & controls alert box for requesting password reset */
  async forgotPassword() {
    const alert = await this.alertCtrl.create({
      header:
        'Please enter your registered email. A password reset code will be sent to that address',
      buttons: [
        {
          text: 'submit',
          handler: (alertData) => {
            this.authService.forgotPassword(alertData.emailForgot);
          },
        },
        {
          text: 'cancel',
        },
      ],
      inputs: [
        {
          placeholder: 'email',
          type: 'email',
          name: 'emailForgot',
        },
      ],
    });
    await alert.present();
  }

  /* controls show/hide password functionality */
  toggleViewPassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword ? 'eye-off-outline' : 'eye-outline';
  }

  /* unsubscribes from subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.biometricsSub) {
      this.biometricsSub.unsubscribe();
    }
  }
}
