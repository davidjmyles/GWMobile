/* eslint-disable no-trailing-spaces */
export class Payment {
  constructor(
    public amount: string,
    public date: Date,
    public method: string,
    public parish: string,
    public fund: string
  ) {}
}
