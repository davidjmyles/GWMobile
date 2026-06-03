import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Connection } from './connection.model';

// const currentConnection = new Connection(
//   'lotterylinkapp.azurewebsites.net',
//   'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH'
// );

// const currentConnection = new Connection(
//   'lotterylinkapp-staging.azurewebsites.net',
//   'rGNpksJ9&eEt6cMSoijaVZ@xz39Fn5^RXY6c7cbPsdLGSgJK$nvJ8Ciw5oYH'
// );

const currentConnection = new Connection(
  'giftwiseparishwebwebtest.azurewebsites.net',
  'AgKcmML5YOuM3pD4g1oxn0jJNgsK1LCL'
);

// const currentConnection = new Connection(
//   'localhost:7125',
//   'AgKcmML5YOuM3pD4g1oxn0jJNgsK1LCL'
// );

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private _currentConnection = new BehaviorSubject<any>(currentConnection);

  get connection() {
    return this._currentConnection.asObservable();
  }

  constructor() {}
}
