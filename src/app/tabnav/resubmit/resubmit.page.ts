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
  selector: 'app-resubmit',
  templateUrl: './resubmit.page.html',
  styleUrls: ['./resubmit.page.scss'],
  standalone: false,
})
export class ResubmitPage implements OnInit, OnDestroy, ViewWillEnter{

  currentUser: User;
  title;
  firstName;
  surname;
  door;
  address1;
  address2;
  address3; 
  address4;
  postcode;
  username;
  formResubmit: FormGroup;
  titles = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr.', 'Rev.'];
  private userSub: Subscription;
  currentProvider: Provider;
  private providerSub: Subscription;
  providerNumber: string;
  providerEmail: string;
  providerName: string;
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
  submitResubmit;

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
  ) { }

  ngOnInit() {
    this.userSub = this.userService.user.subscribe(async (user) => {
      this.currentUser = user;
      //this.title = 'Mr';
      //this.firstName = 'Steve';
      this.title = this.currentUser.title;
      this.firstName = this.currentUser.firstName;
      this.surname = this.currentUser.surname;
      this.door = this.currentUser.door;
      this.address1 = this.currentUser.address1;
      this.address2 = this.currentUser.address2;
      this.address3 = this.currentUser.address3;
      this.address4 = this.currentUser.address4;
      this.postcode = this.currentUser.postcode;

      this.formResubmit = new FormGroup({
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
        //this.formAddress = new FormGroup({
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
      //});
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



  /*
     * sets data from personal details form to relevant variables & sends to API. also updates relevant subscription
     */
    async onSaveResubmit() {
      if (!this.formResubmit.valid) {
        return;
      }
      this.title = this.formResubmit.value.title;
      this.currentUser.title = this.title;
      this.firstName = this.formResubmit .value.firstName;
      let upperFirstName = _.upperFirst(this.firstName);
      this.currentUser.firstName = upperFirstName;
      this.surname = this.formResubmit.value.surname;
      let upperSurname = _.upperFirst(this.surname);
      this.currentUser.surname = upperSurname;
      this.door = this.formResubmit.value.door;
          this.currentUser.door = this.door;
          let upperDoor = _.upperFirst(this.door);
          this.address1 = this.formResubmit.value.address1;
          this.currentUser.address1 = this.address1;
          let upperAddress1 = _.upperFirst(this.address1);
          let address2 = this.formResubmit.value.address2;
          let upperAddress2;
          if (address2 !== null) {
            upperAddress2 = _.upperFirst(address2);
          }
          let address3 = this.formResubmit.value.address3;
          let upperAddress3;
          if (address3 !== null) {
            upperAddress3 = _.upperFirst(address3);
          }
          let upperAddress4;
          let address4 = this.formResubmit.value.address4;
          if (address4 !== null) {
            upperAddress4 = _.upperFirst(address4);
          }
          this.postcode = this.formResubmit.value.postcode;
          this.currentUser.postcode = this.postcode;
      const playerId = await this.storageService.get('playerId');
      const userId = await this.storageService.get('userId');
      const savedToken: string = await this.storageService.get('token');
      const databaseCode = await this.storageService.get('databaseCode');
      console.log('userId: ', userId);
      console.log('savedToken: ', savedToken);
      console.log('playerId: ', playerId);
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
            `https://${this.connectionString}/api/User/resubmit/${userId}`,
            {
              playerId: playerId,
              title: this.title,
              forename: upperFirstName,
              surname: upperSurname,
              door: upperDoor,
              address1: upperAddress1,
              address2: upperAddress2,
              address3: upperAddress3,
              address4: upperAddress4,
              postcode: this.postcode,
            },
            { headers: headers }
          );
          authObs.subscribe(
            (resData) => {
              let message =
                'your personal details have been successfully changed';
              this.showAlertSuccess(message);
              loadingEl.dismiss();
              this.router.navigate(['/tabnav/landing']);
            },
            (errRes) => {
              loadingEl.dismiss();
              const code = errRes;
              console.log(errRes);
              let message = 'could not update details. please try again';
              this.showAlertFail(message);
            }
          );
        });
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
