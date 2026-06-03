import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ModalController,
  ViewWillEnter,
} from '@ionic/angular';
import { Observable, pipe, Subscription } from 'rxjs';
import { DataService } from 'src/app/data.service';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { StorageService } from 'src/app/storage.service';
import { User } from 'src/app/user.model';
import { UserService } from 'src/app/user.service';
import { AuthService } from '../auth/auth.service';
import { ContactMethod } from '../contact-method.model';
import * as _ from 'lodash';
import { ConnectionService } from 'src/app/connection.service';
import { MaintenanceService } from 'src/app/maintenance.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: false,
})
/* defines & controls functionality on account page */
export class AccountPage implements OnInit, OnDestroy, ViewWillEnter {
  submitPersonal = false;
  submitLogin = false;
  submitAddress = false;
  submitContactDetails = false;
  submitContactPreferences = false;
  currentUser: User;
  editModePersonal = false;
  editModeLogin = false;
  editModeAddress = false;
  editModeContactDetails = false;
  editModeContactPreferences = false;
  title;
  firstName;
  surname;
  currentPassword;
  password;
  confirmPassword;
  door;
  address1;
  address2;
  address3;
  address4;
  postcode;
  username;
  formPersonal: FormGroup;
  formLogin: FormGroup;
  formAddress: FormGroup;
  formContact: FormGroup;
  formDelete: FormGroup;
  contactMethods: ContactMethod[] = [];
  s1Array: ContactMethod[];
  s2Array: ContactMethod[];
  titles = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr.', 'Rev.'];
  private userSub: Subscription;
  passwordIcon = 'eye-outline';
  showPassword = false;
  contactsMatch = true;
  currentProvider: Provider;
  private providerSub: Subscription;
  providerNumber: string;
  providerEmail: string;
  providerName: string;
  dateJoined;
  connectionString;
  apiKey;
  connectionSub: Subscription;
  private maintenanceSub: Subscription;
  maintenanceStartDate;
  maintenanceEndDate;
  showMessageDaysBefore;
  maintenanceMessage;
  showMessage;
  lockAccess;

  constructor(
    private modalCtrl: ModalController,
    private userService: UserService,
    private authService: AuthService,
    private dataService: DataService,
    private providerService: ProviderService,
    private storageService: StorageService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private http: HttpClient,
    private router: Router,
    private connectionService: ConnectionService,
    private maintenanceService: MaintenanceService
  ) {}

  /*
   * subscribes to multiple subscriptions & sets variables accordingly. Also creates 4 formgroups & links
   * variables to the form elements
   */
  ngOnInit() {
    this.userSub = this.userService.user.subscribe(async (user) => {
      this.currentUser = user;
      this.title = this.currentUser.title;
      this.firstName = this.currentUser.firstName;
      this.surname = this.currentUser.surname;
      this.door = this.currentUser.door;
      this.address1 = this.currentUser.address1;
      this.address2 = this.currentUser.address2;
      this.address3 = this.currentUser.address3;
      this.address4 = this.currentUser.address4;
      this.postcode = this.currentUser.postcode;
      this.contactMethods = this.currentUser.contactMethods;
      this.dateJoined = this.currentUser.dateJoined;

      this.formPersonal = new FormGroup({
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
      });
      this.formLogin = new FormGroup({
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
      });
      this.formAddress = new FormGroup({
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
      });
      this.formContact = new FormGroup({});
      this.contactMethods.forEach(async (result) => {
        let value = result.contactMethodId.toString();
        if (result.section === 1) {
          this.formContact.addControl(value, new FormControl(result.value));
        } else if (result.section === 2 && result.value === 'true') {
          this.formContact.addControl(value, new FormControl(''));
        } else {
          this.formContact.addControl(value, new FormControl('false'));
        }
        this.s1Array = this.contactMethods.filter((res) => res.section === 1);
        this.s2Array = this.contactMethods.filter((res) => res.section === 2);
      });
    });
    this.formDelete = new FormGroup({
      deletePassword: new FormControl('', {
        updateOn: 'blur',
        validators: [
          Validators.required,
          Validators.pattern(
            '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@*.]).{8,16}$'
          ),
        ],
      }),
    });
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerNumber = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      this.providerName = this.currentProvider.name;
    });
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
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

  ionViewWillEnter(): void {
    this.maintenanceService.getMaintenance();
  }

  /* closes help modal*/
  onCloseAbout() {
    this.modalCtrl.dismiss();
  }

  /* closes delte modal*/
  onCloseDelete() {
    this.modalCtrl.dismiss();
  }

  /*
   * sets data from personal details form to relevant variables & sends to API. also updates relevant subscription
   */
  async onSavePersonal() {
    this.submitPersonal = true;
    if (!this.formPersonal.valid) {
      return;
    }
    this.title = this.formPersonal.value.title;
    this.currentUser.title = this.title;
    this.firstName = this.formPersonal.value.firstName;
    let upperFirstName = _.upperFirst(this.firstName);
    this.currentUser.firstName = upperFirstName;
    this.surname = this.formPersonal.value.surname;
    let upperSurname = _.upperFirst(this.surname);
    this.currentUser.surname = upperSurname;
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
      .create({ keyboardClose: true, message: 'submitting new details' })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<string>;
        authObs = this.http.post<string>(
          `https://${this.connectionString}/api/User/personal/${userId}`,
          {
            playerId: playerId,
            title: this.title,
            forename: upperFirstName,
            surname: upperSurname,
            personalDetailsChanged: true,
          },
          { headers: headers }
        );
        authObs.subscribe(
          (resData) => {
            let message =
              'your personal details have been successfully changed';
            this.showAlertSuccess(message);
            loadingEl.dismiss();
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes;
            let message = 'could not update details. please try again';
            this.showAlertFail(message);
          }
        );
      });
    this.editModePersonal = false;
  }

  /*
   * returns values of personal details form to previous if user exits without submitting new details
   */
  onCancelPersonal() {
    this.editModePersonal = false;
    this.title = this.currentUser.title;
    this.formPersonal.get('title').patchValue(this.title);
    this.firstName = this.currentUser.firstName;
    this.formPersonal.get('firstName').patchValue(this.firstName);
    this.surname = this.currentUser.surname;
    this.formPersonal.get('surname').patchValue(this.surname);
  }

  /* sets data from login details form to relevant variables & sends to API. also updates subscription */
  async onSaveLogin() {
    this.submitLogin = true;
    if (!this.formPersonal.valid) {
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
          },
          (errRes) => {
            let message = 'could not change password. please try again';
            this.showAlertFail(message);
            loadingEl.dismiss();
          }
        );
      });
    this.editModeLogin = false;
  }

  /*
   * clears inputted data from login form when user does not submit changes
   */
  onCancelLogin() {
    this.editModeLogin = false;
    this.formLogin.reset();
  }

  /*
   * sets data from address details form to relevant variables & sends to API. also updates subscription
   */
  async onSaveAddress() {
    this.submitAddress = true;
    if (!this.formAddress.valid) {
      return;
    }
    this.door = this.formAddress.value.door;
    this.currentUser.door = this.door;
    let upperDoor = _.upperFirst(this.door);
    this.address1 = this.formAddress.value.address1;
    this.currentUser.address1 = this.address1;
    let upperAddress1 = _.upperFirst(this.address1);
    let address2 = this.formAddress.value.address2;
    let upperAddress2;
    if (address2 !== null) {
      upperAddress2 = _.upperFirst(address2);
    }
    let address3 = this.formAddress.value.address3;
    let upperAddress3;
    if (address3 !== null) {
      upperAddress3 = _.upperFirst(address3);
    }
    let upperAddress4;
    let address4 = this.formAddress.value.address4;
    if (address4 !== null) {
      upperAddress4 = _.upperFirst(address4);
    }
    this.postcode = this.formAddress.value.postcode;
    this.currentUser.postcode = this.postcode;
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
      .create({ keyboardClose: true, message: 'submitting new details' })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<string>;
        authObs = this.http.post<string>(
          `https://${this.connectionString}/api/User/address/${userId}`,
          {
            playerId: playerId,
            door: upperDoor,
            address1: upperAddress1,
            address2: upperAddress2,
            address3: upperAddress3,
            address4: upperAddress4,
            postcode: this.postcode,
            addressDetailsChanged: true,
          },
          { headers: headers }
        );
        authObs.subscribe(
          (resData) => {
            let message = 'your address details have been successfully changed';
            this.showAlertSuccess(message);
            loadingEl.dismiss();
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes;
            let message = 'could not update details. please try again';
            this.showAlertFail(message);
          }
        );
      });
    this.editModeAddress = false;
  }

  /*
   * returns values of address details form to previous if user exits without submitting new details
   */
  onCancelAddress() {
    this.editModeAddress = false;
    this.door = this.currentUser.door;
    this.formAddress.get('door').patchValue(this.door);
    this.address1 = this.currentUser.address1;
    this.formAddress.get('address1').patchValue(this.address1);
    this.address2 = this.currentUser.address2;
    this.formAddress.get('address2').patchValue(this.address2);
    this.address3 = this.currentUser.address3;
    this.formAddress.get('address3').patchValue(this.address3);
    this.address4 = this.currentUser.address4;
    this.formAddress.get('address4').patchValue(this.address4);
    this.postcode = this.currentUser.postcode;
    this.formAddress.get('postcode').patchValue(this.postcode);
  }

  /*
   * takes values from contact methods form & updates contact method array
   *
   * @param inputArray - array created on initialisation with contact methods from userSub
   */
  returnContactMethods(inputArray: ContactMethod[]) {
    inputArray.forEach((result) => {
      if (result.section === 1) {
        let control = result.contactMethodId.toString();
        result.value = this.formContact.get(control).value;
      }
      let control = result.contactMethodId.toString();
      if (
        result.section === 2 &&
        this.formContact.get(control).value === true
      ) {
        result.value = 'true';
      }
      if (
        result.section === 2 &&
        this.formContact.get(control).value === false
      ) {
        result.value = 'false';
      }
    });
  }

  /*
   * sets data from contact methods/preferences form to relevant variables & sends to API.
   * also updates subscription
   *
   * @param keyword - determines which alert message is shown to user on submission
   */
  async onSaveContact(keyword: string) {
    this.returnContactMethods(this.contactMethods);
    this.checkContactsMatch(this.contactMethods);
    if (!this.formContact.valid || this.contactsMatch === false) {
      this.contactsMatch = true;
      return;
    }
    this.currentUser.contactMethods = this.contactMethods;
    this.storageService.set('contactMethods', this.contactMethods);
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
      .create({ keyboardClose: true, message: `submitting new ${keyword}` })
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
            this.editModeContactPreferences = false;
            this.editModeContactDetails = false;
            this.resetNotificationsValues();
            let message = `your contact ${keyword} have been successfully changed`;
            this.showAlertSuccess(message);
            loadingEl.dismiss();
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes;
            let message = `could not update ${keyword}. please try again`;
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

  /*
   * returns values of contect details form to previous if user exits without submitting new details
   */
  onCancelContactDetails() {
    this.editModeContactDetails = false;
    this.contactMethods.forEach(async (result) => {
      let value = result.contactMethodId.toString();
      if (result.section === 1) {
        this.formContact.get(value).patchValue(result.oldValue);
        //this.formContact.get(value).patchValue(result.value);
      }
      this.s1Array = this.contactMethods.filter((res) => res.section === 1);
    });
  }

  /*
   * returns values of contact preferences form to previous if user exits without submitting new details
   */
  onCancelContactPreferences() {
    this.editModeContactPreferences = false;
    this.contactMethods.forEach(async (result) => {
      let value = result.contactMethodId.toString();
      if (result.section === 2 && result.value === 'true') {
        //this.formContact.get(value).patchValue('');
        this.formContact.get(value).patchValue(result.oldValue);
      } else if (result.section === 2 && result.value === 'false') {
        //this.formContact.get(value).patchValue('false');
        this.formContact.get(value).patchValue(result.oldValue);
      }
      this.s2Array = this.contactMethods.filter((res) => res.section === 2);
    });
  }

  /*
   * checks that user has entered a matching method for chosen contact preferences. displays
   * alert if not
   */
  checkContactsMatch(thisArray: ContactMethod[]) {
    thisArray.forEach((res) => {
      if (res.section === 2 && res.requiredId > 0) {
        var x = res.requiredId.toString();
        var y = res.value;
        if (this.formContact.get(x).value === '' && y === 'true') {
          this.contactsMatch = false;
          this.showAlertContactsNotMatch();
          return;
        } else {
        }
      }
    });
  }

  /* saves contact details */
  onSaveContactDetails() {
    this.onSaveContact('details');
  }

  /* saves contact preferences */
  onSaveContactPreferences() {
    this.onSaveContact('preferences');
  }

  /*
   * alerts user if they attempt to submit contact preferences without valid matching contact details
   */
  private showAlertContactsNotMatch() {
    this.alertCtrl
      .create({
        header: 'could not update',
        cssClass: 'custom-alert',
        message:
          'please ensure that you have entered valid contact details for your chosen contact preferences',
        buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
      })
      .then((alertEl) => alertEl.present());
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

  async onDeleteAccount() {
    // console.log(this.formDelete);
    // if (!this.formDelete.valid) {
    //   return;
    // }
    this.alertCtrl
      .create({
        header: 'Delete Account',
        cssClass: 'custom=alert',
        message:
          'Are you sure you want to delete your account? This action cannot be undone.',
        buttons: [
          {
            text: 'confirm',
            cssClass: 'alert-button-ok',
            handler: async () => {
              const userId = await this.storageService.get('userId');
              const savedToken: string = await this.storageService.get('token');
              const databaseCode = await this.storageService.get(
                'databaseCode'
              );
              var headers = new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + savedToken,
                dbCode: databaseCode,
                ApiKey: this.apiKey,
                'x-api-version': '2.0',
              });
              // this.loadingCtrl
              //   .create({ keyboardClose: true, message: `submitting` })
              //   .then((loadingEl) => {
              //     loadingEl.present();
              //     const password = this.formDelete.value.deletePassword;
              //     const username = this.currentUser.username;
              //     let deleteObs: Observable<string>;
              //     deleteObs = this.http.post<string>(
              //       `https://${this.connectionString}/api/User/checkPassword/${userId}`,
              //       {
              //         password: password,
              //       },
              //       { headers: headers }
              //     );
              //     deleteObs.subscribe(
              //       (resData) => {
              this.loadingCtrl
                .create({ keyboardClose: true, message: `deleting account` })
                .then((loadingEl) => {
                  loadingEl.present();
                  let deleteObs2: Observable<any>;
                  deleteObs2 = this.http.delete<any>(
                    `https://${this.connectionString}/api/user/deleteaccount/${userId}`,
                    { headers: headers }
                  );
                  deleteObs2.subscribe(
                    (resData2) => {
                      loadingEl.dismiss();
                      this.onCloseDelete();
                      this.authService.logoutNoCheck();
                      this.alertCtrl
                        .create({
                          header: 'Success',
                          message:
                            'your account has been successfully deleted.',
                          buttons: [
                            {
                              text: 'ok',
                              handler: () => {},
                            },
                          ],
                        })
                        .then((alertEl) => alertEl.present());
                    },
                    (errRes) => {
                      loadingEl.dismiss();
                      this.alertCtrl
                        .create({
                          header: 'Error',
                          message:
                            'Could not delete account at this time. Please try again later.',
                          buttons: [{ text: 'ok' }],
                        })
                        .then((alertEl) => alertEl.present());
                    }
                  );
                });
              // },
              // (errRes) => {
              //   loadingEl.dismiss();
              //   const code = errRes;
              //   let message = `please ensure you are entering your correct login password`;
              //   this.showAlertFail(message);
              // }
              //);
              // });
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

  /*
   * function to allow user to show/hide password
   */
  toggleViewPassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword ? 'eye-off-outline' : 'eye-outline';
  }

  /*
   * links to privacy policy, allowing user to view
   */
  onViewPrivacy() {
    window.location.href = `https://carnsoftware.online/lotterylink-privacy-policy/`;
  }

  /*
   * triggers logout function from the authService
   */
  onLogout() {
    this.authService.logout();
  }

  /*
   * unsubscribes from subscriptions when page is destroyed
   */
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
    if (this.maintenanceSub) {
      this.maintenanceSub.unsubscribe();
    }
  }
}
