import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AlertButton, AlertController } from '@ionic/angular';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ConnectionService } from './connection.service';
import { Data } from './data.model';
import { LogoutService } from './logout.service';
import { StorageService } from './storage.service';
import { ProviderService } from './provider.service';

const currentData = new Data(
  0,
  0,
  false,
  false,
  0,
  '',
  '',
  [],
  0,
  0,
  new Date(),
  0,
  '',
  [],
  [],
  0,
  0,
  false,
  0,
  []
);

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to users player data */
export class DataService implements OnDestroy {
  private _data = new BehaviorSubject<Data>(currentData);
  private _lowBalanceTrigger = new BehaviorSubject<boolean>(false);
  private _newWinningTicketTrigger = new BehaviorSubject<boolean>(false);
  connectionString;
  apiKey;
  connectionSub: Subscription;
  providerSub: Subscription;
  providerLowBalance;
  displayLowBalanceIcon = false;

  get data() {
    return this._data.asObservable();
  }

  get lowBalanceTrigger() {
    return this._lowBalanceTrigger.asObservable();
  }

  get newWinningTicketTrigger() {
    return this._newWinningTicketTrigger.asObservable();
  }

  updateData(updatedData: Data) {
    this._data.next(updatedData);
  }

  updateBalanceTrigger(isBalanceLow: boolean) {
    this._lowBalanceTrigger.next(isBalanceLow);
  }

  updateNewWinningTicketTrigger(isNewTicket: boolean) {
    this._newWinningTicketTrigger.next(isNewTicket);
  }

  constructor(
    private storageService: StorageService,
    private http: HttpClient,
    private logoutService: LogoutService,
    private alertCtrl: AlertController,
    private connectionService: ConnectionService
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

  /* makes API call to retrieve latest data & sets the resonse values to an observable */
  async getLatestData(memberNumber: number) {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    const playerId = await this.storageService.get('playerId');
    const userId = await this.storageService.get('userId');
    this.providerLowBalance = await this.storageService.get('lowBalance');
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      'x-api-version': '3.0',
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    let latestObs: Observable<any>;
    latestObs = this.http.get<any>(
      `https://${this.connectionString}/api/User/verified/${userId}`,
      { headers: headers }
    );
    latestObs.subscribe(
      async (resData) => {
        //if (Array.isArray(resData)) {
        // if (resData.isVerified) {
        //   this.isVerified = true;
        // }
        // console.log(
        //   'from resData in service to check if defined: ' + memberNumber
        // );
        currentData.memberNumberList = [];
        resData.forEach((res) => {
          currentData.memberNumberList.push(res.memberNumber);
        });
        if (memberNumber > 0) {
          var index = resData.findIndex(
            (res) => res.memberNumber === memberNumber
          );
        } else {
          index = 0;
        }
        currentData.memberNumber = resData[index].memberNumber;
        currentData.paymentsArray = resData[index].payments;
        currentData.nextPaymentAmount = resData[index].nextPaymentAmount;
        currentData.nextPaymentDate = resData[index].nextPaymentDate;
        currentData.currentBalance = resData[index].balance;
        currentData.rejected = resData[index].rejected;
        currentData.ticketCost = resData[index].ticketCost;
        currentData.lastDrawDate = resData[index].lastDrawDate;
        currentData.dateJoined = resData[index].joined;
        currentData.lowBalanceAlert = resData[index].lowBalanceAlert;
        this._lowBalanceTrigger.next(currentData.lowBalanceAlert);
        //let lastTicketDate = resData[index].tickets[0].datePurchased;
        //this._lastWinningTicketDate.next(lastTicketDate);
        // let lowBalanceTrigger =
        //   resData[index].ticketCost * this.providerLowBalance;
        // console.log(
        //   'balance trigger from data service: ' + this.providerLowBalance
        // );
        // if (currentData.currentBalance <= lowBalanceTrigger) {
        //   currentData.balanceIsLow = true;
        // } else {
        //   currentData.balanceIsLow = false;
        // }
        let sum = _.sumBy(resData[index].tickets, 'amountWon');
        currentData.totalWinnings = sum;
        this._data.next(currentData);

        // } else {
        //   console.log(resData);
        //   currentData.paymentsArray = resData.payments;
        //   currentData.ticketsArray = resData.tickets;
        //   currentData.nextPaymentAmount = resData.nextPaymentAmount;
        //   currentData.nextPaymentDate = resData.nextPaymentDate;
        //   currentData.currentBalance = resData.balance;
        //   currentData.rejected = resData.rejected;
        //   currentData.ticketCost = resData.ticketCost;
        //   currentData.lastDrawDate = resData.lastDrawDate;
        //   currentData.dateJoined = resData.joined;
        //   //let lastTicketDate = resData.tickets[0].datePurchased;
        //   //this._lastWinningTicketDate.next(lastTicketDate);
        //   let lowBalanceTrigger = resData.ticketCost * 6;
        //   if (currentData.currentBalance <= lowBalanceTrigger) {
        //     currentData.balanceIsLow = true;
        //   } else {
        //     currentData.balanceIsLow = false;
        //   }
        //   let sum = _.sumBy(resData.tickets, 'amountWon');
        //   currentData.totalWinnings = sum;
        //   this._data.next(currentData);
        //   console.log(currentData);
        // }
        let storedNumberBalance = 'balance' + memberNumber.toString();
        let storedNumberTicket = 'ticket' + memberNumber.toString();
        let checkBalanceStatus = await this.storageService.get(
          storedNumberBalance
        );
        //console.log('is balance low: ' + this.balanceIsLow);
        if (currentData.lowBalanceAlert) {
          if (checkBalanceStatus === true || checkBalanceStatus === null) {
            this.updateBalanceTrigger(currentData.lowBalanceAlert);
          }
          this.storageService.set(storedNumberBalance, false);
        } else {
          this.storageService.set(storedNumberBalance, true);
        }
        // this.ticketSub = this.dataService.newWinningTicketTrigger.subscribe(
        //   () => {}
        // );
        // let storedLastTicketDate = await this.storageService.get(
        //   'lastWinningTicketDate'
        // );
        // console.log('last date from storage: ' + storedLastTicketDate);
        // if (currentData.ticketsArray.length > 0) {
        //   let newLastTicketDate = currentData.ticketsArray[0].datePurchased;
        //   console.log('last date from latest data: ' + newLastTicketDate);
        //   if (newLastTicketDate > (await storedLastTicketDate)) {
        //     this.updateNewWinningTicketTrigger(true);
        //     console.log('a new winning ticket');
        //     this.storageService.set(storedNumberTicket, newLastTicketDate);
        //   }
        // }
        var headers2 = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + savedToken,
          dbCode: databaseCode,
          ApiKey: this.apiKey,
          'x-api-version': '2.0',
          //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
        });
        let docObs: Observable<any>;
        docObs = this.http.get<any>(
          `https://${this.connectionString}/api/User/documents/${userId}`,
          { headers: headers2 }
        );
        docObs.subscribe(
          async (resData) => {
            currentData.documentsArray = resData;
          },
          (errRes) => {}
        );
      },
      (errRes) => {
        const code = errRes;
        if (errRes.status === 401) {
          this.logoutService.forceLogout();
          currentData.userId = 0;
          currentData.dateJoined = '';
          currentData.playerId = 0;
          currentData.isVerified = false;
          currentData.contactMethods = [];
          currentData.totalWinnings = 0;
          currentData.currentBalance = 0;
          currentData.ticketCost = 0;
          currentData.lastDrawDate = '';
          currentData.drawDay = 0;
          currentData.drawHour = 0;
          currentData.lastPaymentDate = new Date();
          currentData.nextPaymentAmount = 0;
          currentData.nextPaymentDate = '';
          currentData.paymentsArray = [];
          currentData.memberNumber = 0;
          currentData.memberNumberList = [];
          currentData.lowBalanceAlert = false;
        }
      }
    );
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
