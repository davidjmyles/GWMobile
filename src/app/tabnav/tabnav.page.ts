import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { Data } from '../data.model';
import { Payment } from './payments/payment.model';
import { ProviderService } from '../provider.service';
import { Provider } from '../provider.model';
import { BalanceService } from '../balance.service';
import { PaymentsService } from './payments/payments.service';

@Component({
  selector: 'app-tabnav',
  templateUrl: './tabnav.page.html',
  styleUrls: ['./tabnav.page.scss'],
  standalone: false,
})
export class TabnavPage implements OnInit {
  dataSub: Subscription;
  providerSub: Subscription;
  balanceSub: Subscription;
  ticketSub: Subscription;
  currentData: Data;
  currentProvider: Provider;
  paymentsArray: Payment[] = [];
  ticketsArray;
  newWinningTicket;
  ticketCost;
  balance;
  lowBalance;
  balanceIsLow;

  constructor(
    private dataService: DataService,
    private providerService: ProviderService,
    private balanceService: BalanceService,
    private paymentsService: PaymentsService
  ) {}

  ngOnInit() {
    // this.dataSub = this.dataService.data.subscribe((data) => {
    //   this.currentData = data;
    //   this.balance = this.currentData.currentBalance;
    //   this.ticketCost = this.currentData.ticketCost;
    // });
    // this.providerSub = this.providerService.provider.subscribe((provider) => {
    //   this.currentProvider = provider;
    //   this.lowBalance = this.currentProvider.lowBalance;
    // });
    // if (this.balance <= this.lowBalance * this.ticketCost) {
    //   this.balanceIsLow = true;
    // }
    //   this.balanceSub = this.balanceService.lowBalanceTrigger.subscribe((res) => {
    //     this.balanceIsLow = res;
    //   });
    //   this.ticketSub = this.dataService.newWinningTicketTrigger.subscribe(
    //     (res) => {
    //       this.newWinningTicket = res;
    //     }
    //   );
    // }
    // onClickBalance() {
    //   this.balanceService.updateBalanceTrigger(false);
    //   this.balanceIsLow = false;
    // }
    // onClickTicket() {
    //   this.dataService.updateNewWinningTicketTrigger(false);
    //   this.newWinningTicket = false;
    // }
  }

}
