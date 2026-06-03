import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
/* service providing app-wide functionality related to device local storage */
export class StorageService {
  private _storage: Storage;

  constructor(private storage: Storage) {
    this.init();
  }

  /* initialises storage functionality */
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  /*
   * sets to local storage using key/value pair
   *
   * @param key - key of item to be stored
   * @param value - value of item to be stored
   *
   */
  set(key: string, value: any) {
    this._storage.set(key, value);
  }

  /*
   * retrieves from local storage using key
   *
   * @param key - key of item to be retrieved
   
   */
  async get(key: string): Promise<any> {
    try {
      const result = await this.storage.get(key);
      if (result != null) {
        return result;
      }
      return null;
    } catch (reason) {
      return null;
    }
  }

  /* clears all items in local storage */
  clear() {
    this.storage.clear();
  }
}
