import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import OneSignal from 'onesignal-cordova-plugin';

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to logout*/
export class LogoutService {
  accessAllowed = false;
  logoutAllowed = false;
  userIsAuthenticated = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private ngZone: NgZone
  ) {}

  /* logs user out when auth token is not longer valid. resets stored user data */
  forceLogout() {
    this.userIsAuthenticated = false;
    this.storageService.set('token', '');
    this.storageService.set('userId', '');
    //OneSignal.removeExternalUserId();
    this.router.navigateByUrl('/tabnav/auth');
  }

  /* logs user out at their request. resets stored user data */
  logout() {
    this.ngZone.run(() => {
      this.router.navigateByUrl('/tabnav/auth');
    });
    //OneSignal.removeExternalUserId();
    this.userIsAuthenticated = false;
    //this.isVerified = false;
    this.storageService.set('token', '');
    this.storageService.set('userId', '');
    // (this.currentUser.userId = 0),
    //   (this.currentUser.playerId = ''),
    //   (this.currentUser.isVerified = false),
    //   (this.currentUser.username = ''),
    //   (this.currentUser.password = ''),
    //   (this.currentUser.confirmPassword = ''),
    //   (this.currentUser.title = ''),
    //   (this.currentUser.firstName = ''),
    //   (this.currentUser.surname = ''),
    //   (this.currentUser.door = ''),
    //   (this.currentUser.address1 = ''),
    //   (this.currentUser.address2 = ''),
    //   (this.currentUser.address3 = ''),
    //   (this.currentUser.address4 = ''),
    //   (this.currentUser.postcode = ''),
    //   (this.currentUser.contactMethods = []),
    //   (this.currentUser.totalWinnings = 0),
    //   (this.currentUser.currentBalance = 0),
    //   (this.currentUser.lastPaymentDate = new Date()),
    //   (this.currentUser.nextPaymentAmount = 0),
    //   (this.currentUser.nextPaymentDate = ''),
    //   (this.currentUser.paymentsArray = []),
    //   (this.currentUser.ticketsArray = []);
    this.router.navigateByUrl('/tabnav/auth');
  }
}
