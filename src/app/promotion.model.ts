export class Promotion {
  constructor(
    public promotionId: number,
    public title: string,
    public text: string,
    public imageUrl: string,
    public linkUrl: string,
    public date: Date,
    public expiryDate: Date,
    public hasExpired: boolean,
    public read: boolean
  ) {}
}
