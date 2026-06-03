import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  private _appVersion = new BehaviorSubject<number>(1.0);

  constructor() {}

  get appVersion() {
    return this._appVersion.asObservable();
  }
}
