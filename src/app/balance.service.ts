import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  // private _allowBadge = new BehaviorSubject<boolean>(false);
  // get lowBalanceTrigger() {
  //   return this._allowBadge.asObservable();
  // }
  // updateBalanceTrigger(isBalanceLow: boolean) {
  //   this._allowBadge.next(isBalanceLow);
  // }
  // constructor(private storageService: StorageService) {}
  // async test(memberNumber: number, lowBalanceAlert: boolean) {
  //   let storedNumberBalance = 'balance' + memberNumber.toString();
  //   let storedNumberTicket = 'ticket' + memberNumber.toString();
  //   let checkBalanceStatus = await this.storageService.get(storedNumberBalance);
  //   if (lowBalanceAlert) {
  //     if (checkBalanceStatus === true || checkBalanceStatus === null) {
  //       this.updateBalanceTrigger(lowBalanceAlert);
  //     }
  //     this.storageService.set(storedNumberBalance, false);
  //   } else {
  //     this.storageService.set(storedNumberBalance, true);
  //   }
  // }
}
