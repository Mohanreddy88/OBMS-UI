export class BankMasterModel {
  BankId: number;
  BankCode: string;
  Accname: string;
  Accno: string;
  PREFIX: string;
  AccShortName: string;
  LASTUPDATE: Date;
  LastUpdatedBy: string;

  constructor(data: Partial<BankMasterModel> = {}) {
    this.BankId = data.BankId || 0;
    this.BankCode = data.BankCode || '';
    this.Accname = data.Accname || '';
    this.PREFIX = data.PREFIX || '';
    this.AccShortName = data.AccShortName || '';
    this.Accno = data.Accno || '';
    this.LASTUPDATE = data.LASTUPDATE || new Date();
    this.LastUpdatedBy = data.LastUpdatedBy || '';
  }
}