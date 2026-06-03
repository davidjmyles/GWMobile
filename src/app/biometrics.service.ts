import { Injectable, OnDestroy, OnInit } from '@angular/core';
import {
  AvailableResult,
  BiometryType,
  NativeBiometric,
} from '@capgo/capacitor-native-biometric';
import { AuthService } from './tabnav/auth/auth.service';
import { NotificationsService } from './notifications.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { StorageService } from './storage.service';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class BiometricsService implements OnInit, OnDestroy {
  notificationsSub: Subscription;
  notificationUrl: string;
  private _hasPermission = new BehaviorSubject<boolean>(false);
  private _biometryType = new BehaviorSubject<string>('');

  get checkBiometricsUserPermission() {
    return this._hasPermission.asObservable();
  }

  get biometryType() {
    return this._biometryType.asObservable();
  }

  updateBiometricsUserPermission(updatePermission: boolean) {
    this._hasPermission.next(updatePermission);
  }

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private notificationsService: NotificationsService,
    private alertCtrl: AlertController
  ) {}

  /* subscribes to provider service & sets local variables to subscription values */
  ngOnInit() {
    this.notificationsSub = this.notificationsService.navUrl.subscribe(
      (url) => {
        this.notificationUrl = url;
      }
    );
  }

  async checkAvailability(): Promise<boolean> {
    const result = await NativeBiometric.isAvailable();
    const permission = result.isAvailable;
    return permission;
  }

  setCredential(
    username: string,
    password: string,
    server: string,
    message: string,
    hasAlert: boolean
  ) {
    this.deleteCredentials();
    // Save user's credentials
    NativeBiometric.setCredentials({
      username: username,
      password: password,
      server: server,
    })
      .then(() => this.setBiometricData(hasAlert))
      .catch((error) => {
        alert('unable to setup. please restart your device and try again');
        // const alertFail = this.alertCtrl.create({
        //   header: 'Biometric Setup Failed',
        //   message: message,
        //   buttons: ['ok'],
        // });
      });
  }

  setBiometricData(showAlert: boolean) {
    this.storageService.set('hasBiometrics', true);
    this._hasPermission.next(true);
    if (showAlert === true) {
      alert('biometrics setup complete');
    }
    this.getBiometricType();
  }

  checkCredential(notificationUrl: string, hasBiometrics: boolean) {
    NativeBiometric.isAvailable().then((result: AvailableResult) => {
      const isAvailable = result.isAvailable;
      // alert('RESULT ' + JSON.stringify(result));
      // const isFaceId=result.biometryType==BiometryType.FACE_ID;
      // const isFaceId = result.biometryType == BiometryType.FACE_ID;

      if (isAvailable) {
        // Get user's credentials
        NativeBiometric.getCredentials({
          server: 'server',
        }).then((credentials) => {
          // alert('CREDENTIAL ' + JSON.stringify(credentials));
          // Authenticate using biometrics before logging the user in
          NativeBiometric.verifyIdentity({
            //reason: 'For easy log in',
            title: 'Login',
            // subtitle: 'Maybe add subtitle here?',
            // description: 'Maybe a description too?',
          })
            .then((res) => {
              //     // Authentication successful
              //alert('SUCCESS!!');
              //this.getBiometricType();
              this.authService.login(
                credentials.username,
                credentials.password,
                notificationUrl,
                hasBiometrics
              );
            })
            .catch((err) => {
              //   // Failed to authenticate
              alert(
                'Biometric access unavailable. Please login with username & password'
              );
            });
        });
      }
    });
  }

  async getBiometricType() {
    const result = await NativeBiometric.isAvailable();
    const isNone = result.biometryType == BiometryType.NONE;
    const isTouchId = result.biometryType == BiometryType.TOUCH_ID;
    const isFaceId = result.biometryType == BiometryType.FACE_ID;
    const isFingerprint = result.biometryType == BiometryType.FINGERPRINT;
    const isFaceAuth = result.biometryType == BiometryType.FACE_AUTHENTICATION;
    const isIris = result.biometryType == BiometryType.IRIS_AUTHENTICATION;
    const isMultiple = result.biometryType == BiometryType.MULTIPLE;
    if (isTouchId) {
      this._biometryType.next('Touch ID');
    }
    if (isFaceId) {
      this._biometryType.next('Face ID');
    }
    if (isFingerprint) {
      this._biometryType.next('Fingerprint');
    }
    if (isFaceAuth) {
      this._biometryType.next('Face Authentication');
    }
    if (isIris) {
      this._biometryType.next('Iris Authentication');
    }
    if (isMultiple || isNone) {
      this._biometryType.next('Biometric ID');
    }
  }

  deleteCredentials() {
    NativeBiometric.deleteCredentials({
      server: 'server',
    }).then();
  }

  ngOnDestroy(): void {
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
  }
}
