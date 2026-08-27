import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  IonAccordionGroup,
  LoadingController,
  MenuController,
  ModalController,
  Platform,
} from '@ionic/angular';
import { Observable, Subscription, interval } from 'rxjs';
import { Data } from 'src/app/data.model';
import { DataService } from 'src/app/data.service';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { User } from 'src/app/user.model';
import { UserService } from 'src/app/user.service';
import { AuthService } from '../auth/auth.service';
import { Payment } from '../payments/payment.model';
import { StorageService } from 'src/app/storage.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ConnectionService } from 'src/app/connection.service';
import { NotificationsService } from 'src/app/notifications.service';
import { ContactMethod } from '../contact-method.model';
import { Capacitor } from '@capacitor/core';
import { OpenNativeSettings } from '@ionic-native/open-native-settings/ngx';
import { BalanceService } from 'src/app/balance.service';
import { MaintenanceService } from 'src/app/maintenance.service';
import { BiometricsService } from 'src/app/biometrics.service';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { VersionService } from 'src/app/version.service';
import { Documents } from '../documents/documents.model';
import { App } from '@capacitor/app';
import { Promotion } from 'src/app/promotion.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
/* defines & controls functionality on auth page */
export class DashboardPage implements OnInit, OnDestroy {
  @ViewChild('accordionGroup', { static: true })
  accordionGroup: IonAccordionGroup;
  currentUser: User;
  currentData: Data;
  currentProvider: Provider;
  playerName;
  balance = 129;
  totalWinnings;
  truncateTotalWinnings = false;
  lastPayment;
  lastPaymentDate: Date;
  lastPaymentDateShort;
  nextPayment;
  nextPaymentDate;
  nextPaymentDateShort;
  private userSub: Subscription;
  private dataSub: Subscription;
  private providerSub: Subscription;
  private countdownSub: Subscription;
  private connectionSub: Subscription;
  private maintenanceSub: Subscription;
  paymentsArray: Payment[] = [];
  ticketsArray;
  targetDate: any;
  milliSecondsInASecond = 1000;
  hoursInADay = 24;
  minutesInAnHour = 60;
  SecondsInAMinute = 60;
  targetDay;
  paymentsAvailable = false;
  providerNumber: string;
  providerEmail: string;
  providerName: string;
  providerHasTwitter = true;
  nextDrawHour = 17;
  nextDrawDay = 5;
  //promoImage = '././assets/img/promoImage.jpg';
  promoImage = '././assets/img/church.jpg';
  //promoImage = '././assets/img/willowwood2.jpg';
  x = '././assets/img/twitter-x.svg';
  versionNumber;
  lowBalanceAlert;
  lowBalance = 4;
  ticketCost;
  balanceSub: Subscription;
  ticketSub: Subscription;
  notificationsSub: Subscription;
  biometricsSub: Subscription;
  versionSub: Subscription;
  formLogin: FormGroup;
  memberNumberList;
  memberNumber;
  apiKey;
  currentPassword;
  password;
  confirmPassword;
  connectionString;
  deviceNotificationsPermission;
  contactMethods: ContactMethod[] = [];
  contactMethodsForDisplay: ContactMethod[] = [];
  notificationsPreferences: ContactMethod[] = [];
  formContact: FormGroup;
  formBiometrics: FormGroup;
  showPassword = false;
  multipleMemberships = false;
  imageLink: string;
  maintenanceStartDate;
  maintenanceEndDate;
  showMessageDaysBefore;
  maintenanceMessage;
  showMessage;
  lockAccess;
  submitLogin = false;
  useBiometrics;
  hasBiometrics;
  biometricsAvailable;
  submitAttempt;
  displayPromo: boolean;
  promoTitle;
  promoText;
  promoPicture;
  promoLink;
  appVersion;
  notificationMembershipId;
  unreadDocuments = true;
  documentArray: Documents[];
  versionChanged = false;
  platformChanged = false;
  devicePermissionChanged = false;
  refreshMode = false;
  largeScreen = false;
  taxYear = '2024/25';
  smallScreen;

  public timeDifference;
  public secondsToDday;
  public minutesToDday;
  public hoursToDday;
  public daysToDday;

  constructor(
    private modalCtrl: ModalController,
    private userService: UserService,
    private providerService: ProviderService,
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private menuCtrl: MenuController,
    private storageService: StorageService,
    private alertCtrl: AlertController,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private connectionService: ConnectionService,
    private notificationsService: NotificationsService,
    private platform: Platform,
    private nativeSettings: OpenNativeSettings,
    private balanceService: BalanceService,
    private maintenanceService: MaintenanceService,
    private biometricsService: BiometricsService,
    private versionService: VersionService,
    public datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.setupListener();
  }

  async setupListener() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        this.notificationsService.resetNotificationMembershipId();
        this.notificationsService.resetNotificationUrl();
        //console.log('app minimised');
        //this.router.navigateByUrl('tabnav/tabs/dashboard');
        // App went to background
        // Save anything you fear might be lost
      } else {
        //console.log('app maximised');
        //this.dataService.getLatestData(this.memberNumber);
        this.checkPromotion();
        if (this.notificationMembershipId > 0) {
          this.dataService.getLatestData(this.notificationMembershipId);
          this.notificationMembershipId = 0;
          this.notificationsService.resetNotificationMembershipId();
          this.notificationsService.resetNotificationUrl();
        } else {
          this.dataService.getLatestData(this.memberNumber);
        }
        // console.log(this.currentUser);
        // let testPromo = this.currentUser.promotion;
        // console.log(testPromo.read);
        //if (this.currentUser.promotion) {
        //this.managePromotion(testPromo);
        // if (
        //   this.currentUser.promotion.read ||
        //   this.currentUser.promotion.hasExpired
        // ) {
        //   this.displayPromo = false;
        //   console.log(this.currentUser.promotion.read);
        //   console.log(this.currentUser.promotion.hasExpired);
        // } else {
        //   this.displayPromo = true;
        //   console.log('show promo');
        //   console.log(this.currentUser.promotion.read);
        //   console.log(this.currentUser.promotion.hasExpired);
        // }
        // this.promoTitle = this.currentUser.promotion.title;
        // this.promoText = this.currentUser.promotion.text;
        // this.promoLink = this.currentUser.promotion.linkUrl;
        // this.promoPicture = this.currentUser.promotion.imageUrl;
        //}
        // App went to foreground
        // restart things like sound playing
      }
    });
  }

  managePromotion(promo: Promotion) {
    if (promo.read || promo.hasExpired) {
      this.displayPromo = false;
    } else {
      this.displayPromo = true;
    }
    this.promoTitle = promo.title;
    this.promoText = promo.text;
    this.promoLink = promo.linkUrl;
    this.promoPicture = promo.imageUrl;
  }

  async checkPromotion() {
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    const userId = await this.storageService.get('userId');
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    let promoObs: Observable<Promotion>;
    promoObs = this.http.get<Promotion>(
      `https://${this.connectionString}/api/user/promotion/${userId}`,
      { headers: headers }
    );
    promoObs.subscribe(
      (resData) => {
        this.currentUser.promotion = resData;
        this.managePromotion(resData);
      },
      (errRes) => {
        console.log(errRes);
      }
    );
  }

  /* subscribes to userService/providerService/dataService & sets local variables to subscription
   * values. also initialises next draw countdown
   */
  async ngOnInit() {
    this.dataSub = this.dataService.data.subscribe((data) => {
      this.currentData = data;
      this.nextDrawDay = this.currentData.drawDay;
      this.nextDrawHour = this.currentData.drawHour;
      this.balance = this.currentData.currentBalance;
      this.lowBalanceAlert = this.currentData.lowBalanceAlert;
      this.lowBalance = 6;
      this.totalWinnings = this.currentData.totalWinnings;
      if (this.totalWinnings > 999.99) {
        this.truncateTotalWinnings = true;
        Math.trunc(this.totalWinnings);
      }
      if (this.currentData.paymentsArray.length > 0) {
        this.paymentsAvailable = true;
        this.paymentsArray = this.currentData.paymentsArray;
        this.lastPayment = this.paymentsArray[0].paymentAmount;
        let rawDateLast = this.paymentsArray[0].paymentDate;
        //this.lastPaymentDate = new Date(Date.parse(rawDateLast));
        //this.lastPaymentDateShort = this.lastPaymentDate.toDateString();
        let rawDateNext = this.currentData.nextPaymentDate;
        this.nextPaymentDate = new Date(Date.parse(rawDateNext));
        this.nextPaymentDateShort = this.nextPaymentDate.toDateString();
        this.nextPayment = this.currentData.nextPaymentAmount;
        this.ticketCost = this.currentData.ticketCost;
      }
      this.memberNumber = this.currentData.memberNumber;
      this.memberNumberList = this.currentData.memberNumberList;
      if (this.memberNumberList.length > 1) {
        this.multipleMemberships = true;
      }
      this.documentArray = this.currentData.documentsArray;
    });
    this.userSub = this.userService.user.subscribe((user) => {
      this.currentUser = user;
      this.contactMethods = this.currentUser.contactMethods;
      this.playerName =
        this.currentUser.firstName + ' ' + this.currentUser.surname;
      this.useBiometrics = this.currentUser.hasBiometrics;
      if (this.currentUser.promotion) {
        this.managePromotion(this.currentUser.promotion);
        // if (
        //   this.currentUser.promotionRead ||
        //   this.currentUser.promotion.hasExpired
        // ) {
        //   this.displayPromo = false;
        // } else {
        //   this.displayPromo = true;
        // }
        // this.promoTitle = this.currentUser.promotion.title;
        // this.promoText = this.currentUser.promotion.text;
        // this.promoLink = this.currentUser.promotion.linkUrl;
        // this.promoPicture = this.currentUser.promotion.imageUrl;
      }
    });
    this.countdownSub = interval(1000).subscribe((x) => {
      this.generateTargetDay();
      this.getTimeDifference();
    });
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerNumber = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      //this.providerName = this.currentProvider.name;
      //this.promoImage = this.currentProvider.imageUrl;
      //this.versionNumber = this.currentProvider.appVersion;
      //this.lowBalance = this.currentProvider.lowBalance;
      //this.imageLink = this.currentProvider.imageLink;
    });
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.formBiometrics = new FormGroup({
      biometricsPassword: new FormControl('', {
        updateOn: 'blur',
        validators: [
          Validators.required,
          Validators.pattern(
            '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@*.]).{8,16}$'
          ),
        ],
      }),
    });
    this.formLogin = new FormGroup(
      {
        currentPassword: new FormControl('', {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        password: new FormControl('', {
          updateOn: 'blur',
          validators: [
            Validators.required,
            Validators.pattern(
              '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@*.]).{8,16}$'
            ),
          ],
        }),
        confirmPassword: new FormControl('', {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
      },
      {
        validators: this.passwordMatch.bind(this),
      }
    );
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(() => {
        this.notificationsService.checkNotificationsPermission();
      });
    }
    this.notificationsSub =
      this.notificationsService.devicePermissionStatus.subscribe((res) => {
        this.deviceNotificationsPermission = res;
      });
    this.formContact = new FormGroup({});
    this.contactMethodsForDisplay = this.contactMethods.filter(
      (res) => res.show === true
    );
    this.contactMethodsForDisplay.forEach(async (result) => {
      let value = result.contactMethodId.toString();
      if (result.section === 3 && result.value === 'true') {
        this.formContact.addControl(value, new FormControl(''));
      } else if (result.section === 3) {
        this.formContact.addControl(value, new FormControl('false'));
      }
      this.notificationsPreferences = this.contactMethodsForDisplay.filter(
        (res) => res.section === 3
      );
    });
    this.maintenanceSub = this.maintenanceService.maintenance.subscribe(
      (res) => {
        this.maintenanceStartDate = res.maintenanceStartDate;
        this.maintenanceEndDate = res.maintenanceEndDate;
        this.showMessageDaysBefore = res.showMessageDaysBefore;
        this.maintenanceMessage = res.maintenanceMessage;
        this.showMessage = res.showMessage;
        this.lockAccess = res.lockAccess;
      }
    );
    let showMaintenanceMessage = await this.storageService.get(
      'maintenanceMessageReady'
    );
    if (
      this.showMessage &&
      (showMaintenanceMessage === true || showMaintenanceMessage === null)
    ) {
      this.showAlertMaintenance();
      this.storageService.set('maintenanceMessageReady', false);
    }
    if (!this.showMessage) {
      this.storageService.set('maintenanceMessageReady', true);
    }
    this.biometricsSub =
      this.biometricsService.checkBiometricsUserPermission.subscribe(
        (permission) => {
          this.hasBiometrics = permission;
        }
      );
    this.checkBiometrics();
    //this.resetPageView();
    this.versionSub = this.versionService.appVersion.subscribe((appVersion) => {
      this.appVersion = appVersion;
    });
    const databaseCode = await this.storageService.get('databaseCode');
    const token: string = await this.storageService.get('token');
    let platform = Capacitor.getPlatform();
    if (
      this.deviceNotificationsPermission !=
      this.currentUser.deviceNotificationsPermission
    ) {
      this.devicePermissionChanged = true;
    }
    if (platform != this.currentUser.platform) {
      this.platformChanged = true;
    }
    if (this.appVersion != this.currentUser.appVersion) {
      this.versionChanged = true;
    }
    if (
      this.devicePermissionChanged == true ||
      this.platformChanged == true ||
      this.versionChanged == true
    ) {
      this.getDeviceData(
        databaseCode,
        token,
        this.currentUser.userId,
        platform,
        this.appVersion,
        this.deviceNotificationsPermission
      );
    }
    this.devicePermissionChanged = false;
    this.platformChanged = false;
    this.versionChanged = false;
    if (window.innerWidth > 800) {
      this.largeScreen = true;
    } else {
      this.largeScreen = false;
    }
    let screenHeight = window.innerHeight;
    if (screenHeight < 700) {
      this.smallScreen = true;
      console.log('small screen');
    } else {
      this.smallScreen = false;
    }
  }

  /* sets player name at top of screen */
  ionViewWillEnter() {
    this.maintenanceService.getMaintenance();
    this.dataService.getLatestData(this.memberNumber);
    this.playerName =
      this.currentUser.firstName + ' ' + this.currentUser.surname;
    this.balance = this.currentData.currentBalance;
    //this.checkUnreadDocuments(this.documentArray);
  }

  updateDocuments() {
    this.checkUnreadDocuments(this.currentData.documentsArray);
  }

  checkUnreadDocuments(documentArray: Documents[]) {
    const checkDocs = documentArray.some((res) => !res.read);
    if (checkDocs) {
      this.unreadDocuments = true;
    } else {
      this.unreadDocuments = false;
    }
  }

  async getDeviceData(
    databaseCode: string,
    token: string,
    userId: number,
    platform: string,
    appVersion: number,
    deviceNotifications: boolean
  ) {
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    let authObs3: Observable<any>;
    authObs3 = this.http.put<any>(
      `https://${this.connectionString}/api/User/devicedata/${userId}`,
      {
        platform: platform,
        appVersion: appVersion,
        deviceNotifications: deviceNotifications,
      },
      { headers: headers }
    );
    authObs3.subscribe(
      (resData) => {},
      (errRes) => {}
    );
  }

  async onDismissPromo() {
    const userId = await this.storageService.get('userId');
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    const promotionId = this.currentUser.promotion.promotionId;
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    let promoObs: Observable<any>;
    promoObs = this.http.put<any>(
      `https://${this.connectionString}/api/User/promotions/${userId}/${promotionId}`,
      { emptystring: '' },
      { headers: headers }
    );
    promoObs.subscribe(
      async (resData) => {
        this.currentUser.promotion.read = true;
      },
      (errRes) => {}
    );
    this.displayPromo = false;
  }

  /* refreshes notifications permission status */
  async onRefreshSettings() {
    let platform = Capacitor.getPlatform();
    if (platform != 'web') {
      this.platform.ready().then(() => {
        this.notificationsService.checkNotificationsPermission();
      });
      this.refreshMode = true;
      // await this.getDeviceData(
      //   databaseCode,
      //   token,
      //   this.currentUser.userId,
      //   platform,
      //   this.appVersion,
      //   test
      // );
    }
  }

  checkBiometrics() {
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(async () => {
        const result = await NativeBiometric.isAvailable();
        this.biometricsAvailable = result.isAvailable;
      });
    }
  }

  /* displays alert warning user of upcoming app maintenance activity */
  private showAlertMaintenance() {
    let dateFrom = this.datePipe.transform(
      this.maintenanceStartDate,
      'dd/MM/yyyy, HH:mm'
    );
    let dateTo = this.datePipe.transform(
      this.maintenanceEndDate,
      'dd/MM/yyyy, HH:mm'
    );
    this.alertCtrl
      .create({
        header: 'Maintenance Alert',
        message: `We will be undertaking essential maintenance from ${dateFrom} until ${dateTo}. During this time, you can still have access to the app, but you will not be able to make any updates to your details.`,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /* resets app page view to dashboard when app is moved to background */
  resetPageView() {
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.pause.subscribe(() => {
        this.router.navigateByUrl('tabnav/tabs/dashboard');
      });
    }
  }

  /* closes sidebar menu when user navigates to another page */
  ionViewDidLeave() {
    this.menuCtrl.close();
  }

  /* navigates user to external link when clicked */
  onClickImageLink() {
    if (this.imageLink !== '') {
      window.location.href = this.imageLink;
    }
  }

  /* navigates user to external link when clicked */
  onClickPromoLink() {
    //if (this.imageLink !== '') {
    try {
      new URL(this.promoLink);
      window.location.href = this.promoLink;
      return true;
    } catch (err) {
      return false;
    }

    // }
  }

  /* validator to check that passwords match */
  passwordMatch(formGroup: FormGroup) {
    const { value: password } = formGroup.get('password') as FormControl;
    const { value: confirmPassword } = formGroup.get('confirmPassword') as FormControl;
    return password === confirmPassword ? null : { passwordNotMatch: true };
  }

  /* changes displayed membership details */
  onChangeMemberNumber(event: any) {
    this.dataService.getLatestData(event);
    let someSub = this.dataService.lowBalanceTrigger.subscribe((res) => {
      this.lowBalanceAlert = res;
    });
    this.toggleAccordion();
    this.menuCtrl.close();
  }

  /* closes membership number accordion when option is selected */
  toggleAccordion = () => {
    const nativeEl = this.accordionGroup;
    if (nativeEl.value === 'second') {
      nativeEl.value = undefined;
    } else {
      nativeEl.value = 'second';
    }
  };

  /* retrieves latest data when pull-down is triggered by user */
  doRefresh(event) {
    this.dataService.getLatestData(this.memberNumber);
    setTimeout(() => {
      event.target.complete();
    }, 1500);
    //this.checkLowBalance();
  }

  /* creates a target date for the next draw countdown */
  generateTargetDay() {
    var currentDate = new Date();
    this.targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      this.nextDrawHour,
      0,
      0
    );
    var currentDay = this.targetDate.getDay();
    var distance = this.nextDrawDay - currentDay;
    this.targetDate.setDate(this.targetDate.getDate() + distance);
    return this.targetDate;
  }

  /* calculates time difference between current time & next draw time to display on 
     countdown */
  getTimeDifference() {
    this.targetDate = this.generateTargetDay();
    this.timeDifference = this.targetDate.getTime() - new Date().getTime();
    if (this.timeDifference <= 0) {
      this.timeDifference += 604800000;
    }
    this.allocateTimeUnits(this.timeDifference);
  }

  /* takes current time vs draw target time & converts into days/hours/mins */
  private allocateTimeUnits(timeDifference) {
    this.secondsToDday = Math.floor(
      (timeDifference / this.milliSecondsInASecond) % this.SecondsInAMinute
    );
    this.minutesToDday = Math.floor(
      (timeDifference / (this.milliSecondsInASecond * this.minutesInAnHour)) %
        this.SecondsInAMinute
    );
    if (this.minutesToDday < 10) {
      this.minutesToDday = '0' + this.minutesToDday;
    }
    this.hoursToDday = Math.floor(
      (timeDifference /
        (this.milliSecondsInASecond *
          this.minutesInAnHour *
          this.SecondsInAMinute)) %
        this.hoursInADay
    );
    if (this.hoursToDday < 10) {
      this.hoursToDday = '0' + this.hoursToDday;
    }
    this.daysToDday = Math.floor(
      timeDifference /
        (this.milliSecondsInASecond *
          this.minutesInAnHour *
          this.SecondsInAMinute *
          this.hoursInADay)
    );
  }

  /* allows user to reset password */
  async onSaveNewPassword() {
    this.submitLogin = true;
    if (!this.formLogin.valid) {
      this.submitLogin = false;
      return;
    }
    this.currentPassword = this.formLogin.value.currentPassword;
    this.password = this.formLogin.value.password;
    this.confirmPassword = this.formLogin.value.confirmPassword;
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
      .create({ keyboardClose: true, message: 'submitting new details' })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<any>;
        authObs = this.http.post<any>(
          `https://${this.connectionString}/api/User/changepassword/${userId}`,
          {
            currentPassword: this.currentPassword,
            password: this.password,
          },
          { headers: headers }
        );
        authObs.subscribe(
          (resData) => {
            let message = 'your password has been successfully changed';
            this.showAlertSuccess(message);
            loadingEl.dismiss();
            this.modalCtrl.dismiss();
            if (this.biometricsAvailable) {
              let bioMessage = 'biometrics updated';
              this.biometricsService.setCredential(
                this.currentUser.username,
                this.password,
                'server',
                bioMessage,
                false
              );
            }
          },
          (errRes) => {
            let message = 'could not change password. please try again';
            this.showAlertFail(message);
            loadingEl.dismiss();
            this.submitLogin = false;
          }
        );
      });
  }

  /* filters contact methods array to display notification preferences & updates form */
  returnContactMethods(inputArray: ContactMethod[]) {
    inputArray.forEach((result) => {
      let control = result.contactMethodId.toString();
      if (
        result.section === 3 &&
        this.formContact.get(control)!.value === true
      ) {
        result.value = 'true';
      }
      if (
        result.section === 3 &&
        this.formContact.get(control)!.value === false
      ) {
        result.value = 'false';
      }
    });
  }

  /* saves & returns updated contact preferences */
  async onSaveNewNotificationsPreferences() {
    this.returnContactMethods(this.notificationsPreferences);
    this.currentUser.contactMethods = this.contactMethods;
    this.storageService.set('contactMethods', this.contactMethods);
    const userId = await this.storageService.get('userId');
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    let platform = Capacitor.getPlatform();
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: `submitting new preferences` })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<string>;
        authObs = this.http.post<string>(
          `https://${this.connectionString}/api/User/contacts/${userId}`,
          this.contactMethods,
          { headers: headers }
        );
        authObs.subscribe(
          (resData) => {
            this.resetNotificationsValues();
            let message = `your notifications preferences have been updated`;
            this.showAlertSuccess(message);
            loadingEl.dismiss();
            this.getDeviceData(
              databaseCode,
              savedToken,
              userId,
              platform,
              this.appVersion,
              this.deviceNotificationsPermission
            );
            this.onCloseModal();
            this.refreshMode = false;
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes;
            let message = `could not update. please try again`;
            this.showAlertFail(message);
          }
        );
      });
  }

  resetNotificationsValues() {
    this.contactMethods.forEach((res) => {
      res.oldValue = res.value;
    });
  }

  async onSetBiometrics() {
    this.submitAttempt = true;
    if (!this.formBiometrics.valid) {
      return;
    }
    const userId = await this.storageService.get('userId');
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: `submitting` })
      .then((loadingEl) => {
        loadingEl.present();
        const password = this.formBiometrics.value.biometricsPassword;
        const username = this.currentUser.username;
        let bioObs: Observable<string>;
        bioObs = this.http.post<string>(
          `https://${this.connectionString}/api/User/checkPassword/${userId}`,
          {
            password: password,
          },
          { headers: headers }
        );
        bioObs.subscribe(
          (resData) => {
            let message = `biometric login function has been activated`;
            //this.showAlertSuccess(message);
            loadingEl.dismiss();
            const failMessage =
              'Unable to register for biometric login at this time. Please restart your device and try again.';
            this.biometricsService.setCredential(
              username,
              password,
              'server',
              failMessage,
              true
            );
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes;
            let message = `please ensure you are entering your correct login password`;
            this.showAlertFail(message);
          }
        );
      });
    this.submitAttempt = false;
  }

  onDeleteBiometrics() {
    this.alertCtrl
      .create({
        header: 'Delete Biometrics',
        cssClass: 'custom=alert',
        message:
          'Are you sure you want to remove your biometric login function?',
        buttons: [
          {
            text: 'confirm',
            cssClass: 'alert-button-ok',
            handler: () => {
              this.biometricsService.deleteCredentials();
              this.biometricsService.updateBiometricsUserPermission(false);
              this.storageService.set('hasBiometrics', false);
              this.currentUser.hasBiometrics = false;
              this.alertCtrl
                .create({
                  header: 'Success',
                  message:
                    'The biometric login function has been removed. This change will be reflected on your next login.',
                  buttons: ['ok'],
                })
                .then((alertEl) => alertEl.present());
            },
          },
          {
            text: 'cancel',
            cssClass: 'alert-button-role-cancel',
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  /* link to open device settings & allow user to change notifications permission */
  openDeviceSettings() {
    this.nativeSettings
      .open('application_details')
      .then((res) => {})
      .catch((err) => {});
  }

  /*
   * alert message for successful submission
   */
  private showAlertSuccess(message: string) {
    this.alertCtrl
      .create({
        header: 'Success',
        message: message,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /*
   * alert message for unsuccessful submission
   */
  private showAlertFail(message: string) {
    this.alertCtrl
      .create({
        header: 'Authentication failed',
        message: message,
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /* closes sidebar menu */
  onCloseMenu() {
    this.menuCtrl.close();
  }

  /* navigates user to twitter page */
  navigateToTwitter() {
    this.onCloseMenu();
    this.router.navigateByUrl('/tabnav/twitter');
  }

  navigateToDocuments() {
    this.onCloseMenu();
    this.router.navigateByUrl('/tabnav/documents');
  }

  /* closes help modal & resets password change form */
  onClosePassword() {
    this.formLogin.reset();
    this.modalCtrl.dismiss();
  }

  onCloseBiometrics() {
    this.formBiometrics.reset();
    this.modalCtrl.dismiss();
  }

  ionModalDidDismiss() {}

  /* closes help modal */
  onCloseModal() {
    this.modalCtrl.dismiss();
  }

  /* initiates logout & navigates to auth screen */
  onLogout() {
    this.authService.logout();
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
    if (this.maintenanceSub) {
      this.maintenanceSub.unsubscribe();
    }
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
    if (this.biometricsSub) {
      this.biometricsSub.unsubscribe();
    }
  }
}


