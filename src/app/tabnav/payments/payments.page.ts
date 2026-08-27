/* eslint-disable @typescript-eslint/member-ordering */
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  ViewDidEnter,
  ViewWillEnter,
} from '@ionic/angular';
import { combineLatestWith, Observable, Subscription } from 'rxjs';
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
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { StorageService } from 'src/app/storage.service';
import { ConnectionService } from 'src/app/connection.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Parish } from 'src/app/parish.model';
import { PaymentsService } from './payments.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: false,
})
/* defines & controls functionality on payments page */
export class PaymentsPage implements OnInit, OnDestroy, ViewWillEnter {
  @ViewChild('accordionGroup', { static: true })
  taxYearTotal;
  balanceDecimals;
  decimalsForBalance;
  paymentsArray: Payment[] = [];
  unfilteredPaymentsArray: Payment[] = [];
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
  filteredArrayParish: Payment[];
  parishActive: any;
  fundList: string[] = [];
  filteredArrayFund: Payment[];
  fundActive: any;
  paymentMethodList: string[] = [];
  filteredArrayPaymentMethod: Payment[];
  taxYearList: number[] = [];
  filteredArrayTaxYear: Payment[];
  paymentMethodActive: any;
  showAllPayments = true;
  accordionCollapsed = true;
  activeAccordion: string | undefined;
  accordionGroup: any;
  showAccordionHeader = true;
  clickedIndex: number;
  selectedValue: any;
  resetAccordion: boolean;
  lastElement: number;
  formAddMissingDonations: FormGroup;
  gadNumber;
  folioNumber;
  forename;
  surname;
  door;
  postcode;
  maintenanceStartDate;
  maintenanceEndDate;
  showMessageDaysBefore;
  maintenanceMessage;
  showMessage;
  lockAccess;
  parishSelected = false;
  parishToSubmit;
  submitText = 'Submit';
  connectionString: any;
  connectionSub: Subscription;
  apiKey: any;
  databaseCode: any ;
  parishName: any;
  parishId: any;
  selectedTaxYear: any;
  paymentsSub: Subscription;
  paymentsLoadedSub: Subscription;
  paymentsLoaded = false;
  
 
  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private providerService: ProviderService,
    private dataService: DataService,
    private notificationsService: NotificationsService,
    private paymentsService: PaymentsService,
    private platform: Platform,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private alertCtrl: AlertController,
    private storageService: StorageService,
    private loadingCtrl: LoadingController,
    private connectionService: ConnectionService,
    private http: HttpClient,
  ) {
    //this.setupListener();
  }

  async setupListener() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        this.notificationsService.resetNotificationMembershipId();
        this.notificationsService.resetNotificationUrl();
        this.notificationMembershipId = 0;
      } else { 
      }
      this.checkNoPayments(this.paymentsArray);

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

  /* subscribes to dataService/providerService & sets local variables to subscription values */
  ngOnInit() {
      this.connectionSub = this.connectionService.connection.subscribe((data) => {
       this.connectionString = data.connectionString;
       this.apiKey = data.apiKey;
      });
      this.paymentsSub = this.paymentsService.payments.subscribe((payments) => {
        this.unfilteredPaymentsArray = payments;
      });
      this.paymentsLoadedSub = this.paymentsService.paymentsLoaded.subscribe((loaded) => {
        this.paymentsLoaded = loaded;
        if (this.paymentsLoaded === true) {
          this.organiseDonations();
        };
      });
      this.formAddMissingDonations = new FormGroup({
        parishName: new FormControl(this.parishName, {
          updateOn: 'blur',
          validators: [Validators.required]
        }),
        gadNumber: new FormControl(this.gadNumber, {
          updateOn: 'blur',
          //validators: [Validators.required],
        }),
        folioNumber: new FormControl(this.folioNumber, {
          updateOn: 'blur',
          //validators: [Validators.required],
        }),
        forename: new FormControl(this.forename, {
          updateOn: 'blur',
          //validators: [Validators.required],
        }),
        surname: new FormControl(this.surname, {
          updateOn: 'blur',
          //    validators: [Validators.required],
        }),
        
          door: new FormControl(this.door, {
            updateOn: 'blur',
            //validators: [Validators.required],
          }),
          postcode: new FormControl(this.postcode, {
            updateOn: 'blur',
            validators: [
              //Validators.required,
              Validators.pattern(
                '^(([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) [0-9][A-Z]{2}$'
              ),
            ],
             }),
          });
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      this.providerName = this.currentProvider.name;
    });
    this.notificationsMembershipIdSub =
      this.notificationsService.notificationMembershipId.subscribe((data) => {
        this.notificationMembershipId = data;
      });
    this.notificationsMembershipIdSub2 =
      this.notificationsService.changeMembershipId.subscribe((data) => {
        this.changeMembershipId = data;
      });
    this.adjustPadding();
  }

  async organiseDonations() {
    if (this.paymentsLoaded === true) {
      this.selectedTaxYear = this.unfilteredPaymentsArray[0].taxYear;
      this.paymentsArray = this.unfilteredPaymentsArray.filter(
        (res) => res.taxYear === this.selectedTaxYear
      );
      this.checkNoPayments(this.paymentsArray);
      this.taxYearTotal = 0;
      this.paymentsArray.forEach( (res) => {
        if (res.paymentAmount != null){
          this.taxYearTotal += res.paymentAmount;
      }
      });
      let parishListUnique = new Set<string>();
      this.paymentsArray.forEach((res) => {
        parishListUnique.add(res.parishName);
      });
      this.parishList = [];
      parishListUnique.forEach((res) => {
        this.parishList.push(res);
      });
      let fundListUnique = new Set<string>();
      this.paymentsArray.forEach((res) => {
        fundListUnique.add(res.paymentFund);
      });
      this.fundList = [];
      fundListUnique.forEach((res) => {
        this.fundList.push(res);
      });
      let paymentMethodListUnique = new Set<string>();
      this.paymentsArray.forEach((res) => {
        paymentMethodListUnique.add(res.paymentMethod);
      });
      this.paymentMethodList = [];
      paymentMethodListUnique.forEach((res) => {
        this.paymentMethodList.push(res);
      });
      let taxYearListUnique = new Set<number>();
      this.unfilteredPaymentsArray.forEach((res) => {
        taxYearListUnique.add(res.taxYear);
      });
      this.taxYearList = [];
      taxYearListUnique.forEach((res) => {
        this.taxYearList.push(res);
      });
    }
  }

  onSelectTaxYear(e: Event) {
    let updatedTaxYear = (e as CustomEvent).detail;
    let stringTaxYear = updatedTaxYear.value.trim();
    this.selectedTaxYear = +stringTaxYear;
    this.paymentsArray = this.unfilteredPaymentsArray.filter(
      (res) => res.taxYear === this.selectedTaxYear
    );
    this.checkNoPayments(this.paymentsArray);
    this.taxYearTotal = 0;
      this.paymentsArray.forEach( (res) => {
        if (res.paymentAmount != null){
          this.taxYearTotal += res.paymentAmount;
      }
    });
    let parishListUnique = new Set<string>();
    this.paymentsArray.forEach((res) => {
      parishListUnique.add(res.parishName);
    });
    this.parishList = [];
    parishListUnique.forEach((res) => {
      this.parishList.push(res);
    });
    let fundListUnique = new Set<string>();
    this.paymentsArray.forEach((res) => {
      fundListUnique.add(res.paymentFund);
    });
    this.fundList = [];
    fundListUnique.forEach((res) => {
      this.fundList.push(res);
    });
    let paymentMethodListUnique = new Set<string>();
    this.paymentsArray.forEach((res) => {
      paymentMethodListUnique.add(res.paymentMethod);
    });
    this.paymentMethodList = [];
    paymentMethodListUnique.forEach((res) => {
      this.paymentMethodList.push(res);
    });
    let taxYearListUnique = new Set<number>();
    this.unfilteredPaymentsArray.forEach((res) => {
      taxYearListUnique.add(res.taxYear);
    });
    this.taxYearList = [];
    taxYearListUnique.forEach((res) => {
      this.taxYearList.push(res);
    }); 
    this.clearFilters();
  }

  /* updates with latest data when user navigates to page */
  ionViewWillEnter() {
    this.paymentsService.getPayments();
    //this.organiseDonations();
    this.checkNoPayments(this.paymentsArray);
  }

  CheckInputsMatch()  {
    const folioField = this.formAddMissingDonations.controls.folioNumber;
    const forenameField = this.formAddMissingDonations.controls.forename;
    const surnameField = this.formAddMissingDonations.controls.surname;
    const doorField = this.formAddMissingDonations.controls.door;
    const postcodeField = this.formAddMissingDonations.controls.postcode;

    if (folioField.value && !surnameField.value) {
      surnameField.setErrors({ required: true });
      console.log('Folio number requires surname');
    } else {
      surnameField.clearValidators();
    };
    if (forenameField.value && !surnameField.value) {
      surnameField.setErrors({ required: true });
      console.log('forename requires surname');
    } else {
      surnameField.clearValidators();
    };
    if (surnameField.value && !forenameField.value && !folioField.value) {
      forenameField.setErrors({ required: true });
      console.log('surname requires forename');
    } else {
      forenameField.clearValidators();
    };
    if (!surnameField.value && !forenameField.value && !folioField.value) {
      forenameField.clearValidators();
      surnameField.clearValidators();
      folioField.clearValidators();
    };

    if (doorField.value && !postcodeField.value) {
      postcodeField.setErrors({ required: true });
      console.log('door requires postcode');
    } else {
      postcodeField.clearValidators();
    };
    if (postcodeField.value && !doorField.value) {
      doorField.setErrors({ required: true });
      console.log('postcode requires door');
    } else {
      doorField.clearValidators();
    };
    if (!postcodeField.value && !doorField.value) {
      doorField.clearValidators();
      postcodeField.clearValidators();
    };
  }

  getParishId(parishName: string)  {
    const payment = this.unfilteredPaymentsArray.find(p => p.parishName === parishName);
    console.log(payment?.parishId);
    return payment?.parishId;
  }

 

  async onSubmitMissingDonations()  {
    this.CheckInputsMatch();
    console.log(this.formAddMissingDonations);
    if (this.formAddMissingDonations.valid) {
      this.submitText = 'Submit';
      this.parishId = this.getParishId(this.formAddMissingDonations.value.parishName);
      console.log(this.parishId);
      this.gadNumber = this.formAddMissingDonations.value.gadNumber;
      this.folioNumber = this.formAddMissingDonations.value.folioNumber;
      this.forename = this.formAddMissingDonations.value.forename;
      this.surname = this.formAddMissingDonations.value.surname;
      this.door = this.formAddMissingDonations.value.door;
      this.postcode = this.formAddMissingDonations.value.postcode;
      const playerId = await this.storageService.get('playerId');
      const userId = await this.storageService.get('userId');
      const savedToken: string = await this.storageService.get('token');
      const databaseCode = await this.storageService.get('databaseCode');
      var headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + savedToken,
        dbCode: databaseCode,
        ApiKey: this.apiKey,
        //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
      });
      this.loadingCtrl
      .create({ keyboardClose: true, message: 'submitting details' })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<string>;
        authObs = this.http.post<string>(
          `https://${this.connectionString}/api/User/missinggads/${userId}`,
          {
            playerId: playerId,
            parishId: this.parishId,
            gadNumber: this.gadNumber,
            folio: this.folioNumber,
            forename: this.forename,
            surname: this.surname,
            door: this.door,
            postcode: this.postcode,
          },
          { headers: headers }
        );
        authObs.subscribe(
          (resData) => {
            this.showAlertSuccess();
            loadingEl.dismiss();
            this.modalCtrl.dismiss();
          },
          (errRes) => {
            console.log(errRes);
            loadingEl.dismiss();
            this.showAlertFail();
            this.modalCtrl.dismiss();
          }
        );
      });
    } else {
      this.submitText = 'Resubmit With Highlighted Field(s)'
    };
  }

       /*
   * alert message for successful submission
   */
  private showAlertSuccess() {
    this.alertCtrl
      .create({
        header: 'Success',
        message: 'Your submission was successful. We will now attempt to locate your missing donations and add them to your records within 5 working days.',
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /*
   * alert message for unsuccessful submission
   */
  private showAlertFail() {
    this.alertCtrl
      .create({
        header: 'Submission Failed',
        message: 'Unable to submit details. Please try again later',
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  OnSelectMissingPaymentParish(e: Event) {
    let selectedParish = (e as CustomEvent).detail;
    this.parishSelected = true;
    console.log(selectedParish);
  }

  onCloseModal()  {
    this.modalCtrl.dismiss();
    this.formAddMissingDonations.reset();
    this.parishSelected = false;
    this.submitText = 'Submit';
  }

  async canDismiss(data?: undefined, role?: string) {
    return role !== 'gesture';
  }

  updateParish(e: Event) {
      this.fundActive = null;
      this.paymentMethodActive = null;
      this.changeDetectorRef.detectChanges();
    let selectedParish = (e as CustomEvent).detail;
    if (selectedParish.value !== 'All') {
      this.showAllPayments = false;
      
      this.filteredArrayParish = this.paymentsArray.filter(
        (res) => res.parishName === selectedParish.value
      );
    } else {
      this.showAllPayments = true;
    }
    this.lastElement = this.filteredArrayParish.length - 1;
  }

  updateFund(e: Event) {
    this.parishActive = null;
      this.paymentMethodActive = null;
      this.changeDetectorRef.detectChanges();
    let selectedFund = (e as CustomEvent).detail;
    if (selectedFund.value !== 'All') {
      this.showAllPayments = false;
      this.filteredArrayParish = this.paymentsArray.filter(
        (res) => res.paymentFund === selectedFund.value
      );
    } else {
      this.showAllPayments = true;
    }
    this.lastElement = this.filteredArrayParish.length - 1;
  }

  updatePaymentMethod(e: Event) {
    this.parishActive = null;
      this.fundActive = null;
      this.changeDetectorRef.detectChanges();
    let selectedPaymentMethod = (e as CustomEvent).detail;
    if (selectedPaymentMethod.value !== 'All') {
      this.showAllPayments = false;
      this.filteredArrayParish = this.paymentsArray.filter(
        (res) => res.paymentMethod === selectedPaymentMethod.value
      );
    } else {
      this.showAllPayments = true;
    }
    this.lastElement = this.filteredArrayParish.length - 1;
  }

  clearFilters() {
    this.parishActive = null
    this.fundActive = null;
    this.paymentMethodActive = null;
    this.showAllPayments = true;
    this.activeAccordion = '';
    this.lastElement = this.paymentsArray.length - 1;
    this.changeDetectorRef.detectChanges();
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

  /* closes help modal */
  onCloseAbout() {
    this.modalCtrl.dismiss();
  }

  ionViewDidLeave() {
    this.clearFilters();
  }

  /* initiates logout & navigates to auth screen */
  onLogout() {
    //this.notificationsService.resetNotificationMembershipId();
    //this.notificationsService.resetNotificationUrl();
    this.authService.logout();
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.notificationsMembershipIdSub) {
      this.notificationsMembershipIdSub.unsubscribe();
    }
  }
}
