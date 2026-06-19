/* eslint-disable @typescript-eslint/member-ordering */
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  ModalController,
  Platform,
  ViewDidEnter,
  ViewWillEnter,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Payment } from './payment.model';
import { AuthService } from '../auth/auth.service';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { DataService } from 'src/app/data.service';
import { Data } from 'src/app/data.model';
import { NotificationsService } from 'src/app/notifications.service';
import { App } from '@capacitor/app';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { set } from 'lodash';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: false,
})
/* defines & controls functionality on payments page */
export class PaymentsPage implements OnInit, OnDestroy, ViewWillEnter {
  @ViewChild('accordionGroup', { static: true })
  private dataSub: Subscription;
  currentData: Data;
  balance;
  balanceDecimals;
  decimalsForBalance;
  paymentsArray: Payment[] = [
    {
      paymentId: 1,
      amount: '10',
      date: new Date(2025, 1, 28),
      method: 'Cash',
      parish: 'St Church',
      fund: 'Easter Fund',
    },
    {
      paymentId: 2,
      amount: '25',
      date: new Date(2024, 12, 28),
      method: 'Card',
      parish: 'St Church',
      fund: 'Random Fund',
    },
    {
      paymentId: 3,
      amount: '15',
      date: new Date(2024, 11, 28),
      method: 'Cash',
      parish: 'St Jesus',
      fund: 'Christmas Fund',
    },
  ];
  paymentsAvailable = false;
  currentProvider: Provider;
  providerSub: Subscription;
  providerNumber: string;
  providerEmail: string;
  providerName: string;
  lowBalanceAlert;
  lowBalance;
  ticketCost;
  drawsRemaining;
  memberNumber;
  memberSince;
  notificationMembershipId;
  notificationsMembershipIdSub: Subscription;
  displayZeroDrawsRemaining = false;
  notificationsMembershipIdSub2: Subscription;
  changeMembershipId: boolean;
  parishList: string[] = [];
  filteredArray: Payment[];
  showAllPayments = true;
  accordionCollapsed = true;
  activeAccordion: string | undefined;
  accordionGroup: any;
  showAccordionHeader = true;
  clickedIndex: number;
  selectedValue: any;
  resetAccordion: boolean;
  lastElement: number;

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private providerService: ProviderService,
    private dataService: DataService,
    private notificationsService: NotificationsService,
    private platform: Platform,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    //this.setupListener();
  }

  async setupListener() {
    App.addListener('appStateChange', ({ isActive }) => {
      //let platform = Capacitor.getPlatform();
      //if (platform == 'android') {
      if (!isActive) {
        this.notificationsService.resetNotificationMembershipId();
        this.notificationsService.resetNotificationUrl();
        this.notificationMembershipId = 0;
      } else {
        // console.log('app maximised');
        // if (this.notificationMembershipId > 0) {
        //   this.dataService.getLatestData(this.notificationMembershipId);
        //   this.notificationsService.resetNotificationMembershipId();
        //   this.notificationsService.resetNotificationUrl();
        //   //this.notificationMembershipId = 0;
        // } else {
        //   this.dataService.getLatestData(this.memberNumber);
        // }
      }
      this.checkNoPayments(this.paymentsArray);
      //}
    });
  }

  accordionGroupChange = (event: CustomEvent) => {
   this.selectedValue = event.detail.value;
   console.log('Selected Value: ', this.selectedValue);
    if (this.selectedValue === undefined) {
      this.resetAccordion = true;
    } else {
      this.resetAccordion = false;
    }
  };

  changeAccordionStyle(index: number) {
    let blankIndex = this.paymentsArray.length + 1;
    if (this.resetAccordion === true) {
      this.clickedIndex = blankIndex;
    } else {
      this.clickedIndex = index;
    }
  }

  adjustPadding() {
    this.lastElement = this.paymentsArray.length - 1;
  }

  trackByPaymentId(index: number, payment: Payment): number {
      return payment.paymentId;
    }

  /* subscribes to dataService/providerService & sets local variables to subscription values */
  ngOnInit() {
    this.dataSub = this.dataService.data.subscribe((user) => {
      this.currentData = user;
      if (this.currentData.paymentsArray.length > 0) {
        //this.paymentsArray = this.currentData.paymentsArray;
        this.paymentsAvailable = true;
      }
      this.balance = this.currentData.currentBalance;
      this.ticketCost = this.currentData.ticketCost;
      this.memberNumber = this.currentData.memberNumber;
      this.memberSince = this.currentData.dateJoined;
      this.lowBalanceAlert = this.currentData.lowBalanceAlert;
      //this.decimalsForBalance = this.countDecimals(this.balance);
      //this.setDecimalsBalance(this.decimalsForBalance);
      //console.log(this.balanceDecimals);
    });
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerNumber = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      this.providerName = this.currentProvider.name;
      //this.lowBalance = this.currentProvider.lowBalance;
    });
    this.notificationsMembershipIdSub =
      this.notificationsService.notificationMembershipId.subscribe((data) => {
        this.notificationMembershipId = data;
      });
    this.notificationsMembershipIdSub2 =
      this.notificationsService.changeMembershipId.subscribe((data) => {
        this.changeMembershipId = data;
      });
    console.log(this.paymentsArray);
    let parishListUnique = new Set<string>();
    this.paymentsArray.forEach((res) => {
      parishListUnique.add(res.parish);
    });
    parishListUnique.forEach((res) => {
      this.parishList.push(res);
    });
    this.adjustPadding();
    console.log(this.parishList);
  }

  /* updates with latest data when user navigates to page */
  ionViewWillEnter() {
    if (this.changeMembershipId == true) {
      this.dataService.getLatestData(this.notificationMembershipId);
    } else {
      this.dataService.getLatestData(this.memberNumber);
    }
    this.changeMembershipId = false;
    this.lowBalanceCheck();
    this.checkNoPayments(this.paymentsArray);
  }

  updateParish(e: Event) {
    let selectedParish = (e as CustomEvent).detail;
    console.log(selectedParish.value);
    if (selectedParish.value !== 'All') {
      this.showAllPayments = false;
      this.filteredArray = this.paymentsArray.filter(
        (res) => res.parish === selectedParish.value
      );
    } else {
      this.showAllPayments = true;
    }
    console.log(this.filteredArray);
  }

  checkNoPayments(paymentArray) {
    if (paymentArray.length > 0) {
      this.paymentsArray = paymentArray;
      this.paymentsAvailable = true;
    } else {
      this.paymentsArray = paymentArray;
      this.paymentsAvailable = false;
    }
  }

  /* performs analysis of balance/ticket data to provide appropriate messaging for user */
  lowBalanceCheck() {
    if (this.lowBalanceAlert) {
      let drawCalculation = this.balance / this.ticketCost;
      if (drawCalculation >= this.ticketCost) {
        this.drawsRemaining = Math.floor(drawCalculation);
        this.displayZeroDrawsRemaining = false;
        this.changeDetectorRef.detectChanges();
      } else {
        this.displayZeroDrawsRemaining = true;
        this.drawsRemaining = 0;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  // checkLowBalance() {
  //   if (this.balance <= this.lowBalance * this.ticketCost) {
  //     this.balanceIsLow = true;
  //   } else {
  //     this.balanceIsLow = false;
  //   }
  // }

  // countDecimals(num) {
  //   if (Number.isInteger(num)) {
  //     return 0;
  //   }
  //   return num.toString().split('.')[1].length;
  // }

  // setDecimalsBalance(input: number) {
  //   if (input === 0) {
  //     this.balanceDecimals = 0;
  //   } else if (input === 1) {
  //     this.balanceDecimals = 1;
  //   } else if (input === 2) {
  //     this.balanceDecimals = 2;
  //   }
  // }

  // convertDates(input: Payment[]) {
  //   input.forEach((entry) => {
  //     new Date(Date.parse(entry.date));
  //   });
  // }

  /* retrieves latest data when pull-down is triggered by user */
  doRefresh(event) {
    setTimeout(() => {
      this.dataService.getLatestData(this.memberNumber);
      this.lowBalanceCheck();
      event.target.complete();
    }, 1500);
    this.lowBalanceCheck();
  }

  /* closes help modal */
  onCloseAbout() {
    this.modalCtrl.dismiss();
  }

  /* initiates logout & navigates to auth screen */
  onLogout() {
    //this.notificationsService.resetNotificationMembershipId();
    //this.notificationsService.resetNotificationUrl();
    this.authService.logout();
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.notificationsMembershipIdSub) {
      this.notificationsMembershipIdSub.unsubscribe();
    }
  }
}
