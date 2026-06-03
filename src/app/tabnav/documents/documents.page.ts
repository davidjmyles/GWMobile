import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Documents } from './documents.model';
import { DocumentsPageModule } from './documents.module';
import { Router } from '@angular/router';

import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  ViewDidLeave,
  ViewWillEnter,
} from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { DataService } from 'src/app/data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConnectionService } from 'src/app/connection.service';
import { StorageService } from 'src/app/storage.service';
//import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
//import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
import { File } from '@ionic-native/file/ngx/index';
import {
  FileTransfer,
  FileTransferObject,
} from '@ionic-native/file-transfer/ngx/index';
import { Capacitor } from '@capacitor/core';
import { User } from 'src/app/user.model';
import { Data } from 'src/app/data.model';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { NotificationsService } from 'src/app/notifications.service';
import { MaintenanceService } from 'src/app/maintenance.service';
import { App } from '@capacitor/app';

declare let cordova: any;

@Component({
  selector: 'app-documents',
  templateUrl: './documents.page.html',
  styleUrls: ['./documents.page.scss'],
  standalone: false,
})
export class DocumentsPage implements OnInit, ViewDidLeave, ViewWillEnter {
  private documentsSub: Subscription;
  private dataSub: Subscription;
  private providerSub: Subscription;
  currentData: Data;
  currentProvider: Provider;
  connectionString;
  apiKey;
  connectionSub: Subscription;
  hideOpenedDocs = false;
  documentArray: Documents[];
  unreadDocumentsArray: Documents[] = [];
  documentsAvailable = true;
  noUnreadDocuments;
  memberNumber;
  playerId;
  displayDoc = false;
  downloadTest = '././assets/img/36995d1.pdf';
  documentClicked = false;
  providerNumber;
  providerEmail;
  providerName;
  docsEditMode = false;
  notificationsMembershipIdSub: Subscription;
  notificationMembershipId: number;
  private maintenanceSub: Subscription;
  maintenanceStartDate;
  maintenanceEndDate;
  showMessageDaysBefore;
  maintenanceMessage;
  showMessage;
  lockAccess;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private modalCtrl: ModalController,
    private dataService: DataService,
    private http: HttpClient,
    private connectionService: ConnectionService,
    //private inAppBrowser: InAppBrowser,
    private fileOpener: FileOpener,
    //private document: DocumentViewer,
    private file: File,
    private transfer: FileTransfer,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private changeDetectorRef: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private providerService: ProviderService,
    private notificationsService: NotificationsService,
    private maintenanceService: MaintenanceService
  ) {
    //this.setupListener();
  }

  async setupListener() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        //this.router.navigateByUrl('tabnav/tabs/dashboard');
        // App went to background
        // Save anything you fear might be lost
      } else {
        this.dataService.getLatestData(this.memberNumber);
        setTimeout(() => {
          this.dataService.getLatestData(this.memberNumber);
          this.updateDocuments();
        }, 1500);
        // App went to foreground
        // restart things like sound playing
      }
    });
  }

  ngOnInit() {
    this.documentsSub = this.dataService.data.subscribe((data) => {
      this.currentData = data;
      this.documentArray = this.currentData.documentsArray;
    });
    this.updateDocuments();
    // this.documentArray.sort((a, b) => {
    //   return <any>new Date(b.date) - <any>new Date(a.date);
    // });
    // if (this.documentArray.length > 0) {
    //   this.documentsAvailable = true;
    // }
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    this.dataSub = this.dataService.data.subscribe((data) => {
      this.memberNumber = data.memberNumber;
      //this.playerId = data.playerId;
    });
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerNumber = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      this.providerName = this.currentProvider.name;
    });
    //this.getDocuments();
    this.notificationsMembershipIdSub =
      this.notificationsService.notificationMembershipId.subscribe((data) => {
        this.notificationMembershipId = data;
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
    this.dataService.getLatestData(this.memberNumber);
    setTimeout(() => {
      this.dataService.getLatestData(this.memberNumber);
      this.updateDocuments();
    }, 1500);
  }

  updateDocuments() {
    this.documentArray = this.currentData.documentsArray;
    if (this.documentArray.length > 0) {
      this.documentsAvailable = true;
    } else {
      this.documentsAvailable = false;
    }
    this.unreadDocumentsArray.length = 0;
    this.documentArray.forEach((res) => {
      if (res.read == false) {
        this.unreadDocumentsArray.push(res);
      }
    });
    if (this.unreadDocumentsArray.length == 0) {
      this.noUnreadDocuments = true;
    } else {
      this.noUnreadDocuments = false;
    }
  }

  toggleReadUnread() {
    this.hideOpenedDocs = !this.hideOpenedDocs;
    this.updateDocuments();
  }

  toggleEditMode() {
    this.docsEditMode = !this.docsEditMode;
  }

  /* retrieves latest data when pull-down is triggered by user */
  doRefresh(event) {
    this.dataService.getLatestData(this.memberNumber);
    setTimeout(() => {
      this.dataService.getLatestData(this.memberNumber);
      this.updateDocuments();
      event.target.complete();
    }, 1500);
  }

  resetDocClick() {
    this.documentClicked = false;
  }

  async openDocument(event: any) {
    this.documentClicked = true;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: 'Loading, Please Wait',
        duration: 2000,
      })
      .then(async (loadingEl) => {
        loadingEl.present();
        var index = this.documentArray.findIndex((x) => x.documentId == event);
        var filename = this.documentArray[index].filename;
        var documentId = this.documentArray[index].documentId;
        var personal = this.documentArray[index].personal;
        const userId = await this.storageService.get('userId');
        const savedToken: string = await this.storageService.get('token');
        const databaseCode = await this.storageService.get('databaseCode');
        const playerId = await this.storageService.get('playerId');
        var headers2 = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + savedToken,
          dbCode: databaseCode,
          ApiKey: this.apiKey,
        });
        let docObs: Observable<any>;
        docObs = this.http.get<any>(
          `https://${this.connectionString}/api/user/documentlink/${userId}/${event}/${filename}/${playerId}/${personal}`,
          // { emptyString: '' },
          { headers: headers2 }
        );
        docObs.subscribe(
          async (resData) => {
            console.log(resData);
            var url = resData.link;
            this.openPDF(url);
            this.documentArray[index].read = true;
            this.updateDocumentRead(documentId);
            this.currentData.documentsArray[index].read = true;
            this.dataService.updateData(this.currentData);
            this.updateDocuments();
            //this.loadingCtrl.dismiss();
          },
          (errRes) => {
            this.loadingCtrl.dismiss();
            this.alertCtrl
              .create({
                header: 'Error',
                cssClass: 'custom-alert',
                message: 'Unable to open document',
                buttons: [{ text: 'ok', cssClass: 'alert-button-ok' }],
              })
              .then((alertEl) => alertEl.present());
          }
        );
        this.displayDoc = true;
        //try {
      });
  }

  async openPDF(url: string) {
    const transfer: FileTransferObject = this.transfer.create();
    transfer.download(url, this.file.dataDirectory + 'file.pdf').then(
      (entry) => {
        this.fileOpener.open(
          this.file.dataDirectory + 'file.pdf',
          'application/pdf'
        );
      },
      (error) => {
        // handle error
      }
    );
  }

  ionViewDidLeave() {
    let platform = Capacitor.getPlatform();
    if (platform != 'web') {
      this.deletePDF(this.file.dataDirectory, 'file.pdf');
    }
  }

  deletePDF(path: string, filename: string) {
    this.file
      .checkFile(this.file.dataDirectory, 'file.pdf')
      .then(() => {
        this.file.removeFile(path, filename).catch((err) => {});
      })
      .catch((err) => {});
  }

  // async openModal() {
  //   const modal = await this.modalCtrl.create({
  //     component: DocumentsPage,
  //     breakpoints: [0.75],
  //     initialBreakpoint: 0.75,
  //   });
  //   modal.present();
  // }

  async updateDocumentRead(documentId: number) {
    const userId = await this.storageService.get('userId');
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + savedToken,
      dbCode: databaseCode,
      ApiKey: this.apiKey,
    });
    let obs: Observable<any>;
    obs = this.http.put<any>(
      `https://${this.connectionString}/api/User/documents/${userId}/${documentId}`,
      { emptystring: '' },
      { headers: headers }
    );
    obs.subscribe(
      async (resData) => {},
      (errRes) => {}
    );
  }

  async deleteDocument(documentId: number) {
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: 'deleting document...',
        duration: 2000,
      })
      .then(async (loadingEl) => {
        loadingEl.present();
        var index = this.documentArray.findIndex(
          (x) => x.documentId == documentId
        );
        const userId = await this.storageService.get('userId');
        const savedToken: string = await this.storageService.get('token');
        const databaseCode = await this.storageService.get('databaseCode');
        var headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + savedToken,
          dbCode: databaseCode,
          ApiKey: this.apiKey,
        });
        let obs: Observable<any>;
        obs = this.http.delete<any>(
          `https://${this.connectionString}/api/User/document/${userId}/${documentId}`,
          { headers: headers }
        );
        obs.subscribe(
          async (resData) => {
            this.documentArray.splice(index, 1);
            this.unreadDocumentsArray.splice(index, 1);
            this.dataService.getLatestData(this.memberNumber);
            this.updateDocuments();
            //.dismiss();
          },
          (errRes) => {
            //loadingEl.dismiss();
          }
        );
      });
  }

  navigateToDashboard() {
    this.router.navigateByUrl('/tabnav/tabs/dashboard');
  }

  onCloseAbout() {
    this.modalCtrl.dismiss();
  }
}
