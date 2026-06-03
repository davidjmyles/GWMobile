import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
} from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/user.service';
import { Observable, Subscription } from 'rxjs';
import { User } from 'src/app/user.model';
import { StorageService } from 'src/app/storage.service';
import { ContactMethod } from '../contact-method.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import * as _ from 'lodash';
import { ConnectionService } from 'src/app/connection.service';
import { Capacitor } from '@capacitor/core';
import { NotificationsService } from 'src/app/notifications.service';
import { OpenNativeSettings } from '@ionic-native/open-native-settings/ngx';
import { MaintenanceService } from 'src/app/maintenance.service';
import { BiometricsService } from 'src/app/biometrics.service';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false,
})
/* defines & controls functionality on signup page */
export class SignupPage implements OnInit, OnDestroy {
  currentUser: User;
  formSignup: FormGroup;
  formContact: FormGroup;
  //tester;
  username;
  password;
  confirmPassword;
  title;
  firstName;
  surname;
  door;
  address1;
  address2;
  address3;
  address4;
  postcode;
  // email;
  // telephone;
  // mobile;
  titles = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr.', 'Rev.'];
  contactArray;
  filteredArray: ContactMethod[] = [];
  outputArray: ContactMethod[];
  s1Array: ContactMethod[];
  s2Array: ContactMethod[];
  s3Array: ContactMethod[];
  private userSub: Subscription;
  errorMessage = 'passwords do not match';
  submitAttempt = false;
  error;
  passwordIcon = 'eye-outline';
  showPassword = false;
  isLoading = false;
  contactsMatch = true;
  displayLoginHelp = false;
  currentProvider: Provider;
  private providerSub: Subscription;
  providerNumber: string;
  providerEmail: string;
  providerName: string;
  databaseCode;
  gadIsVerified = false;
  lockVerifiedGad = false;
  emailIsVerified = false;
  lockVerifiedEmail = false;
  connectionString;
  apiKey;
  connectionSub: Subscription;
  notificationsSub: Subscription;
  deviceNotificationsPermission;
  private maintenanceSub: Subscription;
  maintenanceStartDate;
  maintenanceEndDate;
  showMessageDaysBefore;
  maintenanceMessage;
  showMessage;
  lockAccess;
  biometricsAvailable;
  biometricStatus = false;
  highlightGadInput = false;
  highlightEmailInput = false;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private userService: UserService,
    private providerService: ProviderService,
    private storageService: StorageService,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private connectionService: ConnectionService,
    private platform: Platform,
    private notificationsService: NotificationsService,
    private nativeSettings: OpenNativeSettings,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private maintenanceService: MaintenanceService,
    private biometricsService: BiometricsService
  ) {}

  /*
   * subscribes to userService/providerService & sets variables accordingly. Also creates a formgroup & links
   * local variables to the form elements
   */
  ngOnInit() {
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.databaseCode = provider.dbCode;
      //this.providerNumber = provider.telephone;
      //this.providerEmail = provider.email;
      this.providerName = provider.name;
    });
    this.generateContactMethods().subscribe();
    this.formSignup = new FormGroup(
      {
        title: new FormControl(this.title, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        firstName: new FormControl(this.firstName, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        surname: new FormControl(this.surname, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        username: new FormControl(this.username, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        gadNumber: new FormControl(this.username, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        password: new FormControl(this.password, {
          updateOn: 'blur',
          validators: [
            Validators.required,
            Validators.pattern(
              '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@*.]).{8,16}$'
            ),
          ],
        }),
        confirmPassword: new FormControl(this.confirmPassword, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        door: new FormControl(this.door, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        address1: new FormControl(this.address1, {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        address2: new FormControl(this.address2, {
          updateOn: 'blur',
        }),
        address3: new FormControl(this.address3, {
          updateOn: 'blur',
        }),
        address4: new FormControl(this.address4, {
          updateOn: 'blur',
        }),
        postcode: new FormControl(this.postcode, {
          updateOn: 'blur',
          validators: [
            Validators.required,
            Validators.pattern(
              '^(([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) [0-9][A-Z]{2}$'
            ),
          ],
        }),
      },
      {
        validators: this.passwordMatch.bind(this),
      }
    );
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.notificationsSub =
      this.notificationsService.devicePermissionStatus.subscribe((res) => {
        this.deviceNotificationsPermission = res;
        this.changeDetectorRef.detectChanges();
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
  }

  /* refreshes notifications permission status */
  ionViewWillEnter() {
    this.maintenanceService.getMaintenance();
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(() => {
        this.notificationsService.checkNotificationsPermission();
        this.checkBiometricAvailability();
      });
    }
  }

    checkPostcode(postcode: any) {
    if (postcode.length >= 5) {
      var editedPostcode = postcode.replace(/\s/g, '');
      var spaceTest = editedPostcode.charAt(editedPostcode.length - 4);
      if (spaceTest !== ' ') {
        editedPostcode = editedPostcode.replace(/.{3}$/, ' $&');
        this.formSignup.controls['postcode'].setValue(editedPostcode);
      }
    }
  }

  async checkBiometricAvailability() {
    const result = await NativeBiometric.isAvailable();
    this.biometricsAvailable = result.isAvailable;
  }

  toggleBiometrics() {
    this.biometricStatus = !this.biometricStatus;
    console.log(this.biometricStatus);
  }

  /* refreshes notifications permission status */
  onRefreshSettings() {
    let test = Capacitor.getPlatform();
    if (test != 'web') {
      this.platform.ready().then(() => {
        this.notificationsService.checkNotificationsPermission();
      });
    }
  }

  /* resets form if user navigates away */
  ionViewWillLeave() {
    this.formSignup.reset();
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
  }

  /* closes help modal */
  onCloseAbout() {
    this.modalCtrl.dismiss();
  }

  /* allows user to navigate back to login page, cancelling registration process*/
  goBack() {
    this.router.navigateByUrl('/tabnav/auth');
  }

  // /* retrieves databse code from local storage */
  // async getDatabaseCode() {
  //   const code = await this.storageService.get('databaseCode');
  //   this.databaseCode = code;
  //   console.log(code);
  //   console.log(this.databaseCode);
  // }

  // resolveCode() {
  //   this.getDatabaseCode().then((value) => {
  //     console.log('value: ' + value);
  //     this.databaseCode = value;
  //     console.log('In method: ' + this.databaseCode);
  //   });
  // }

  /* checks that email entered by user for account setup is valid in LotteryMaster */
  async checkGadValidity() {
    const databaseCode = await this.storageService.get('databaseCode');
    if (this.formSignup.value.gadNumber !== null) {
      var gad = this.formSignup.value.gadNumber;
      console.log(gad);
      var header = new HttpHeaders({
        dbCode: this.databaseCode,
        ApiKey: this.apiKey,
        'x-api-version': '1.0',
        //ApiKey: '6G3dVKWzd4CGs3HXuAC&Ucfeo$g5*A6Em#5YvCH@3UYAzNU8F$dWjDcg8&VmFv5nZR',
      });
      console.log(header);
      this.loadingCtrl
        .create({ keyboardClose: true, message: 'validating Gad Number' })
        .then((loadingEl) => {
          loadingEl.present();
          let gadObs: Observable<any>;
          gadObs = this.http.post<any>(
            `https://${this.connectionString}/api/user/checkgadexists`,
            { number: gad },
            { headers: header }
          );
          console.log(header);
          gadObs.subscribe({
              next: (resData) => { 
                console.log(resData); 
                   if (resData === true) {
                loadingEl.dismiss();
                this.gadIsVerified = true;
                this.lockVerifiedGad = true;
                //this.showAlertPassword(email, password);
                this.highlightGadInput = false;
              } else if (resData === false) {
                loadingEl.dismiss();
                this.formSignup.get('gadNumber')!.reset();
                this.showAlertGadAlreadyVerified();
              } 
               }, 
               error: (errRes) => {
                 this.formSignup.get('gadNumber')!.reset();
              this.gadIsVerified = false;
              this.highlightGadInput = true;
              loadingEl.dismiss();
              const error = errRes.error;
              if (error.status == 404) {
                this.showAlertInvalidGad();
              }
               }
        });
          // gadObs.subscribe(
          //   (resData) => {
          //     console.log(resData);
          //     if (resData === true) {
          //       loadingEl.dismiss();
          //       this.gadIsVerified = true;
          //       this.lockVerifiedGad = true;
          //       //this.showAlertPassword(email, password);
          //       this.highlightGadInput = false;
          //     } else if (resData === false) {
          //       loadingEl.dismiss();
          //       this.formSignup.get('gadNumber')!.reset();
          //       this.showAlertGadAlreadyVerified();
          //     }
          //   },
          //   (errRes) => {
          //     this.formSignup.get('gadNumber')!.reset();
          //     this.gadIsVerified = false;
          //     this.highlightGadInput = true;
          //     loadingEl.dismiss();
          //     const error = errRes.error;
          //     if (error.status == 404) {
          //       this.showAlertInvalidGad();
          //     }
          //   }
          // );
        });
    }
  }

  /* alert message to inform user that email entered has already been registered */
  private showAlertGadAlreadyVerified() {
    this.alertCtrl
      .create({
        header: 'verification failed',
        cssClass: 'custom-alert',
        message:
          'This gift aid declaration number has already been registered. Please contact us for further information.',
        buttons: [
          {
            text: 'ok',
            cssClass: 'alert-button-ok',
            handler: () => {
              this.ngZone.run(() => {
                this.router.navigateByUrl('/tabnav/auth');
                this.formSignup.reset();
              });
            },
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  /* alert message to inform user that email entered is invalid */
  private showAlertInvalidGad() {
    this.alertCtrl
      .create({
        header: 'verification failed',
        cssClass: 'custom-alert',
        message:
          `We don't recognise this gift aid declaration number. please ensure that you have entered it correctly.`,
        buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
      })
      .then((alertEl) => alertEl.present());
  }

  /* checks that email entered by user for account setup is valid in LotteryMaster */
  async checkEmailValidity() {
    const databaseCode = await this.storageService.get('databaseCode');
    if (this.formSignup.value.username !== null) {
      var email = this.formSignup.value.username;
      console.log(email);
      var header = new HttpHeaders({
        dbCode: this.databaseCode,
        ApiKey: this.apiKey,
        'x-api-version': '1.0',
        //ApiKey: '6G3dVKWzd4CGs3HXuAC&Ucfeo$g5*A6Em#5YvCH@3UYAzNU8F$dWjDcg8&VmFv5nZR',
      });
      console.log(header);
      this.loadingCtrl
        .create({ keyboardClose: true, message: 'validating Email' })
        .then((loadingEl) => {
          loadingEl.present();
          let emailObs: Observable<any>;
          emailObs = this.http.post<any>(
            `https://${this.connectionString}/api/user/checkemailexists`,
            { emailAddress: email },
            { headers: header }
          );
          console.log(header);

          emailObs.subscribe({
              next: (resData) => {  
                if (resData === true) {
                loadingEl.dismiss();
                this.emailIsVerified = true;
                this.lockVerifiedEmail = true;
                //this.showAlertPassword(email, password);
                this.highlightEmailInput = false;
              } else if (resData === false) {
                loadingEl.dismiss();
                this.formSignup.get('username')!.reset();
                this.showAlertEmailAlreadyVerified();
              }
               }, 
               error: (errRes) => {
                //this.formSignup.get('username').reset();
              this.emailIsVerified = false;
              this.highlightEmailInput = true;
              loadingEl.dismiss();
              const error = errRes.error;
              //if (error.status == 404) {
                //this.showAlertInvalidGad();
               }
        });
        });
    }
  }

    /* alert message to inform user that email entered has already been registered */
  private showAlertEmailAlreadyVerified() {
    this.alertCtrl
      .create({
        header: 'verification failed',
        cssClass: 'custom-alert',
        message:
          'This email address had already been registered. Please register with a different email address, or reset your password from the login page to restore access.',
        buttons: [
          {
            text: 'ok',
            cssClass: 'alert-button-ok',
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  /* retrieves contact method data from API & creates form elements to match. also splits contact
   * method array into 2 arrays (input & checkbox) for display
   */
  generateContactMethods() {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    //const databaseCode = await this.storageService.get('databaseCode');
    this.formContact = new FormGroup({});
    var header = new HttpHeaders({
      dbCode: this.databaseCode,
      ApiKey: this.apiKey,
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    return this.http
      .get<ContactMethod[]>(
        `https://${this.connectionString}/api/User/contactMethods`,
        { headers: header }
      )
      .pipe(
        map((response) =>
          response.forEach((result) => {
            console.log(result);
            this.contactArray = result;
            let value = result.contactMethodId.toString();
            if (result.section === 1 && result.name !== 'Email') {
              this.formSignup.addControl(value, new FormControl(''));
            } else {
              this.formSignup.addControl(value, new FormControl(result.value));
            }
            this.filteredArray.push(this.contactArray);
            this.s1Array = this.filteredArray.filter(
              (res) => res.section === 1 && res.name !== 'Email'
            );
            this.s2Array = this.filteredArray.filter(
              (res) => res.section === 2
            );
            this.s3Array = this.filteredArray.filter(
              (res) => res.section === 3 && res.show === true
            );
          })
        )
      );
  }

  /*
   * update checkbox values in contact method array to reflect user inputs
   *
   * @param inputArray - contact method array to be updated
   */
  returnContactMethods(inputArray: ContactMethod[]) {
    inputArray.forEach((result) => {
      if (result.section === 1) {
        let control = result.contactMethodId.toString();
        result.value = this.formSignup.get(control)!.value;
      }
      let control = result.contactMethodId.toString();
      if (result.section === 2 && this.formSignup.get(control)!.value === true) {
        result.value = 'true';
      }
      if (
        result.section === 2 &&
        this.formSignup.get(control)!.value === false
      ) {
        result.value = 'false';
      }
      if (result.section === 3 && this.formSignup.get(control)!.value === true) {
        result.value = 'true';
      }
      if (
        result.section === 3 &&
        this.formSignup.get(control)!.value === false
      ) {
        result.value = 'false';
      }
    });
  }

  // matchEmailInput(inputArray: ContactMethod[]) {
  //   inputArray.forEach((result) => {
  //     if (result.section === 1 && result.name === 'Email') {
  //       let control = result.contactMethodId.toString();
  //       this.username = this.formSignup.get(control).value;
  //       console.log(result.value);
  //     }
  //   });
  // }

  /*
   * checks that user selected contact preferences have a matching contact method filled out
   *
   * @param inputArray - contact method array to be checked
   */
  checkContactsMatch(inputArray: ContactMethod[]) {
    inputArray.forEach((res) => {
      if (res.section === 2 && res.requiredId > 0) {
        var x = res.requiredId.toString();
        var y = res.value;
        if (this.formSignup.get(x)!.value === '' && y === 'true') {
          this.contactsMatch = false;
          this.showAlertContactsNotMatch();
          return;
        } else {
        }
      }
    });
  }

  /* capitalises (where required) the first letter of words from submitted form */
  capitalize(inputString: string) {
    return inputString[0].toUpperCase() + inputString.slice(1).toLowerCase();
  }

  /* collates form data & sends to API for new user registration */
  async onSignup() {
    let firstName = this.formSignup.value.firstName;
    let upperFirstName = _.upperFirst(firstName);
    let lastName = this.formSignup.value.surname;
    let upperLastName = _.upperFirst(lastName);
    let door = this.formSignup.value.door;
    let upperDoor = _.upperFirst(door);
    let address1 = this.formSignup.value.address1;
    let upperAddress1 = _.upperFirst(address1);
    let address2 = this.formSignup.value.address2;
    let upperAddress2;
    if (address2 !== null) {
      upperAddress2 = _.upperFirst(address2);
    }
    let address3 = this.formSignup.value.address3;
    let upperAddress3;
    if (address3 !== null) {
      upperAddress3 = _.upperFirst(address3);
    }
    let upperAddress4;
    let address4 = this.formSignup.value.address4;
    if (address4 !== null) {
      upperAddress4 = _.upperFirst(address4);
    }
    let trimmedPostcode = this.formSignup.value.postcode.trim();
    this.returnContactMethods(this.filteredArray);
    this.checkContactsMatch(this.filteredArray);
    //this.matchEmailInput(this.filteredArray);
    this.submitAttempt = true;
    if (!this.formSignup.valid || this.contactsMatch === false) {
      this.contactsMatch = true;
      return;
    }
    if (this.biometricStatus === true) {
      const message =
        'Unable to register biometric access at this time. Once your account has been verified, you can retry from the main menu';
      this.biometricsService.setCredential(
        this.formSignup.value.username,
        this.formSignup.value.password,
        'server',
        message,
        false
      );
      this.storageService.set('hasBiometrics', true);
    }
    this.userService.addNewUser({
      gadRef: this.formSignup.value.gadNumber,
      username: this.formSignup.value.username,
      password: this.formSignup.value.password,
      confirmPassword: this.formSignup.value.confirmPassword,
      personalDetails: {
        title: this.formSignup.value.title,
        forename: upperFirstName,
        surname: upperLastName,
      },
      addressDetails: {
        door: upperDoor,
        address1: upperAddress1,
        address2: upperAddress2,
        address3: upperAddress3,
        address4: upperAddress4,
        postcode: trimmedPostcode,
      },
      contactDetails: this.filteredArray,
    });
    this.submitAttempt = false;
  }

  /* validator to check that passwords match */
  passwordMatch(formGroup: FormGroup) {
    const { value: password } = formGroup.get('password') as FormControl;
    const { value: confirmPassword } = formGroup.get('confirmPassword') as FormControl;
    return password === confirmPassword ? null : { passwordNotMatch: true };
  }

  /* controls show/hide password functionality */
  toggleViewPassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword ? 'eye-off-outline' : 'eye-outline';
  }

  /* displays login details help text */
  showLoginHelp() {
    this.displayLoginHelp = true;
  }

  /* hides login help text */
  hideLoginHelp() {
    this.displayLoginHelp = false;
  }

  /* controls alert box to show user that contact details do not match */
  private showAlertContactsNotMatch() {
    this.alertCtrl
      .create({
        header: 'registration failed',
        cssClass: 'custom-alert',
        message:
          'please ensure that you have entered valid contact details for your chosen contact preferences',
        buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
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

  /* controls alert that warns user that they aborting signup process */
  abortSignup() {
    this.alertCtrl
      .create({
        header: 'stop account setup',
        cssClass: 'custom=alert',
        message:
          'are you sure you want to leave this page? account will not be created',
        buttons: [
          {
            text: 'confirm',
            cssClass: 'alert-button-ok',
            handler: () => {
              this.ngZone.run(() => {
                this.router.navigateByUrl('/tabnav/auth');
                this.formSignup.reset();
              });
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

  /* updates all values for notification preferences when toggle all is clicked */
  updateToggleAll(e: Event) {
    const detail = (e as CustomEvent).detail
    if (detail.checked) {
      this.s3Array.forEach((res) => {
        res.value = 'true';
        this.changeDetectorRef.detectChanges();
      });
    } else {
      this.s3Array.forEach((res) => {
        res.value = 'false';
        this.changeDetectorRef.detectChanges();
      });
    }
  }

  /* links to privacy policy, allowing user to view */
  onViewPrivacy() {
    window.location.href = `https://carnsoftware.online/lotterylink-privacy-policy/`;
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
    if (this.maintenanceSub) {
      this.maintenanceSub.unsubscribe();
    }
  }
}
