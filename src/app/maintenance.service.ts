import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ConnectionService } from './connection.service';
import { Maintenance } from './maintenance.model';
import { StorageService } from './storage.service';

const currentMaintenance = new Maintenance('', '', 0, '', false, false);

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService implements OnDestroy {
  private _maintenance = new BehaviorSubject<any>(currentMaintenance);
  connectionString;
  apiKey;
  connectionSub: Subscription;

  get maintenance() {
    return this._maintenance.asObservable();
  }

  constructor(
    private http: HttpClient,
    private connectionService: ConnectionService,
    private storageService: StorageService
  ) {}

  async getMaintenance() {
    this.connectionSub = this.connectionService.connection.subscribe((data) => {
      this.connectionString = data.connectionString;
      this.apiKey = data.apiKey;
    });
    const savedToken: string = await this.storageService.get('token');
    const databaseCode = await this.storageService.get('databaseCode');
    var headers = new HttpHeaders({
      dbCode: databaseCode,
      ApiKey: this.apiKey,
      'x-api-version': '3.0',
      //ApiKey: 'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH',
    });
    let maintenanceObs: Observable<Maintenance>;
    maintenanceObs = this.http.get<Maintenance>(
      `https://${this.connectionString}/api/setup/maintenance`,
      { headers: headers }
    );
    maintenanceObs.subscribe(
      (resData) => {
        currentMaintenance.maintenanceStartDate = resData.maintenanceStartDate;
        currentMaintenance.maintenanceEndDate = resData.maintenanceEndDate;
        currentMaintenance.showMessageDaysBefore =
          resData.showMessageDaysBefore;
        currentMaintenance.maintenanceMessage = resData.maintenanceMessage;
        currentMaintenance.showMessage = resData.showMessage;
        currentMaintenance.lockAccess = resData.lockAccess;
        //currentMaintenance.lockAccess = true;
      },
      (errRes) => {}
    );
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }
}
