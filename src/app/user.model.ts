import { Promotion } from './promotion.model';
import { ContactMethod } from './tabnav/contact-method.model';
import { Payment } from './tabnav/payments/payment.model';


/* eslint-disable no-trailing-spaces */

/*
sets structure for a user, to be populated with data from the back-end
*/
export class User {
  constructor(
    public userId: number,
    public playerId: string,
    public isVerified: boolean,
    public rejected: boolean,
    public gadRef: number | null,
    public parishCode: string,
    public lastDrawDate: string,
    public dateJoined: string,
    public username: string,
    public password: string,
    public confirmPassword: string,
    public title: string,
    public firstName: string,
    public surname: string,
    public door: string,
    public address1: string,
    public address2: string,
    public address3: string,
    public address4: string,
    public postcode: string,
    public contactMethods: ContactMethod[],
    public totalWinnings: number,
    public currentBalance: number,
    public lastPaymentDate: Date,
    public nextPaymentAmount: number,
    public nextPaymentDate: string,
    public paymentsArray: Payment[],
    public hash: string,
    public hasBiometrics: boolean,
    private _token: string,
    public promotion: Promotion,
    public promotionRead: boolean,
    public deviceNotificationsPermission: boolean,
    public platform: string,
    public appVersion: number
  ) {}

  get token() {
    // if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
    //   return null;
    // }
    return this._token;
  }
}
