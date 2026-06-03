import { ContactMethod } from './tabnav/contact-method.model';
import { Documents } from './tabnav/documents/documents.model';
import { Payment } from './tabnav/payments/payment.model';


export class Data {
  constructor(
    public userId: number,
    public playerId: number,
    public isVerified: boolean,
    public rejected: boolean,
    public ticketCost: number,
    public lastDrawDate: string,
    public dateJoined: string,
    public contactMethods: ContactMethod[],
    public totalWinnings: number,
    public currentBalance: number,
    public lastPaymentDate: Date,
    public nextPaymentAmount: number,
    public nextPaymentDate: string,
    public paymentsArray: Payment[],
    public documentsArray: Documents[],
    public drawDay: number,
    public drawHour: number,
    public lowBalanceAlert: boolean,
    public memberNumber: number,
    public memberNumberList: number[]
  ) {}
}
