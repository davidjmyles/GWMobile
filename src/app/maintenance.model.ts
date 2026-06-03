export class Maintenance {
  constructor(
    public maintenanceStartDate: string,
    public maintenanceEndDate: string,
    public showMessageDaysBefore: number,
    public maintenanceMessage: string,
    public showMessage: boolean,
    public lockAccess: boolean
  ) {}
}
