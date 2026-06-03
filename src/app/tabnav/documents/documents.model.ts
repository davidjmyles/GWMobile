export class Documents {
  constructor(
    public documentId: number,
    public title: string,
    public filename: string,
    public filetype: string,
    public date: Date,
    public read: boolean,
    public locked: boolean,
    public personal: boolean
  ) {}
}
