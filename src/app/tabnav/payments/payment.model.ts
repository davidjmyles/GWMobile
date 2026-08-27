/* eslint-disable no-trailing-spaces */
export class Payment {
  constructor(
    public paymentId: number,
    public gadId: number,
    public gadNumber: number, 
    public playerId: number, 
    public parishName: string,
    public parishId: number,
    public taxYear: number,
    public paymentDate: Date, 
    public paymentAmount: number, 
    public paymentTax: number, 
    public paymentMethod: string,
    public paymentFund: string
  ) {}
}
