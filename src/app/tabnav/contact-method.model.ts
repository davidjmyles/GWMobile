export class ContactMethod {
  [x: string]: any;
  playerId: number;
  contactMethodId: number;
  name: string;
  value: string;
  methodType: number;
  section: number;
  requiredId: number;
  contactMethodFoxProId: number;

  constructor(
    playerId: number,
    contactMethodId: number,
    name: string,
    value: string,
    methodType: number,
    section: number,
    requiredId: number,
    contactMethodFoxProId: number,
    oldValue: string
  ) {}
}
