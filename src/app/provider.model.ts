export class Provider {
  constructor(
    public parameterId: number,
    public name: string,
    public blurb: string,
    public iconUrl: string,
    public appVersion: number,
    public minAppVersion: number,
    public dbCode: string,
    public cssVars: Object,
    public appleLinkUrl: string,
    public googleLinkUrl: string,
  ) {}
}
