import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AlertButton, AlertController, LoadingController } from '@ionic/angular';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ConnectionService } from 'src/app/connection.service';
import { LogoutService } from 'src/app/logout.service';
import { StorageService } from 'src/app/storage.service';
import { ProviderService } from 'src/app/provider.service';
import { Payment } from './payment.model';

 let payments: Payment[] = [];

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to users player data */
export class PaymentsService implements OnDestroy {
  private _payments = new BehaviorSubject<Payment[]>(payments);
  private _paymentsLoaded = new BehaviorSubject<boolean>(false);
  connectionString;
  apiKey;
  connectionSub: Subscription;
  providerSub: Subscription;
  providerLowBalance;
  displayLowBalanceIcon = false;

  get payments() {
    return this._payments.asObservable();
  }

  get paymentsLoaded() {
    return this._paymentsLoaded.asObservable();
  }

  constructor(
    private storageService: StorageService,
    private http: HttpClient,
    private logoutService: LogoutService,
    private alertCtrl: AlertController,
    private connectionService: ConnectionService,
    private loadingCtrl: LoadingController,
  ) {}

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
  }

 async getPayments() { 
     let testArray: Payment[] = [];
     this._paymentsLoaded.next(false);
     this._payments.next(testArray);
     this.connectionSub = this.connectionService.connection.subscribe((data) => {
       this.connectionString = data.connectionString;
       this.apiKey = data.apiKey;
     });
     const playerId = await this.storageService.get('playerId');
     const userId = await this.storageService.get('userId');
     const savedToken: string = await this.storageService.get('token');
     const databaseCode = await this.storageService.get('databaseCode');
       var header = new HttpHeaders({
         'Content-Type': 'application/json',
         Authorization: 'Bearer ' + savedToken,
         dbCode: databaseCode,
         ApiKey: this.apiKey,
       });
            let paymentObs: Observable<Payment[]>;
           paymentObs = this.http.get<Payment[]>(
             `https://${this.connectionString}/api/user/payments/${userId}`,
             { headers: header }
           );
           this.loadingCtrl
    .create({ keyboardClose: true, message: 'fetching donations' })
    .then((loadingEl) => {
      loadingEl.present();
           paymentObs.subscribe({
               next: (resData) => { 
                 resData.forEach((res) => {
                   this._payments.next([...this._payments.value, res]);
                 });
                 this._paymentsLoaded.next(true);
                 loadingEl.dismiss();
               }, 
               error: (errRes) => {
                 console.log(errRes);
                 this._paymentsLoaded.next(true);
                 loadingEl.dismiss();
               }
             });
    });
   }

  /* alert to update user if getLatestData() fails. not currently used */
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
}
