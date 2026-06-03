import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import OneSignal from 'onesignal-cordova-plugin';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  public instanceId: BehaviorSubject<string>;
  private test: string;
  subscriptionStarted = false;
  notificationUrl;
  membershipId;
  private _navUrl = new BehaviorSubject<string>('');
  private _notificationMembershipId = new BehaviorSubject<number>(0);
  private _devicePermissionStatus = new BehaviorSubject<boolean>(true);
  private _changeMembershipId = new BehaviorSubject<boolean>(false);

  constructor(
    private platform: Platform,
    private storage: StorageService,
    private router: Router,
    private zone: NgZone,
    private dataService: DataService
  ) {
    this.initializeApp();
  }

  get navUrl() {
    return this._navUrl.asObservable();
  }

  get notificationMembershipId() {
    return this._notificationMembershipId.asObservable();
  }

  get devicePermissionStatus() {
    return this._devicePermissionStatus.asObservable();
  }

  get changeMembershipId()  {
    return this._changeMembershipId.asObservable();
  }

  /* checks that platform is mobile device before initialising notifications */
  initializeApp() {
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(() => {
        this.OneSignalInit();
      });
    }
  }

  /* initialises notification functionality & sets up notification handler */
  OneSignalInit(): void {
    let self = this;
    // var notificationOpenedCallback = function (jsonData) {
    //   self.notificationUrl = jsonData.notification.additionalData['url'];
    //   self.membershipId = +jsonData.notification.additionalData['memberNumber'];
    //   if (self.membershipId > 0) {
    //     self._changeMembershipId.next(true);
    //   } else {
    //     self._changeMembershipId.next(false);
    //   }
    //   self._notificationMembershipId.next(self.membershipId);
    //   if (self.notificationUrl !== null) {
    //     self.zone.run(() => {
    //       self.router.navigateByUrl(self.notificationUrl);
    //     });
    //   }
    //   self._navUrl.next(self.notificationUrl);
    // };
    const notificationOpenedCallback = (event) => {
      // self.notificationUrl = jsonData.notification.additionalData['url'];
      //self.membershipId = +jsonData.notification.additionalData['memberNumber'];
      var test = JSON.stringify(event);
      self.notificationUrl = event.notification.additionalData['url'];
      self.membershipId = event.notification.additionalData['memberNumber'];
      if (self.membershipId > 0) {
        self._changeMembershipId.next(true);
      } else {
        self._changeMembershipId.next(false);
      }
      self._notificationMembershipId.next(self.membershipId);
      if (self.notificationUrl !== null) {
        self.zone.run(() => {
          self.router.navigateByUrl(self.notificationUrl);
        });
      }
      self._navUrl.next(self.notificationUrl);
    };
    //OneSignal.Location.isShared = false
    OneSignal.Notifications.addEventListener(
      'click',
      notificationOpenedCallback
    );
    this.checkNotificationsPermission();
  }

  /* checks is user has granted permission to send notifications */
  checkNotificationsPermission() {
    let self = this;
    OneSignal.Notifications.requestPermission(true).then((accepted) => {
      let devicePermissionStatus = accepted;
      self._devicePermissionStatus.next(devicePermissionStatus);
    });
    // (window as any).plugins.OneSignal.getDeviceState(function (stateChanges) {
    //   let devicePermissionStatus = stateChanges.hasNotificationPermission;
    //   self._devicePermissionStatus.next(devicePermissionStatus);
    //   return devicePermissionStatus;
    // });
  }

  /* sets membershipId from notification data back to 0 */
  resetNotificationMembershipId() {
    this._notificationMembershipId.next(0);
  }

  /* sets url from notification data back to 0 */
  resetNotificationUrl() {
    this._navUrl.next('');
  }

  /* set externalId for notifications */
  setNotificationsExternalId(externalUserId: string, hash: string) {
    let platform = Capacitor.getPlatform();
    //var setExternalIdCallback = function () {};
    if (platform != 'web') {
      // OneSignal.login(externalUserId, hash, setExternalIdCallback);
      OneSignal.login(externalUserId);
    }
  }
}
