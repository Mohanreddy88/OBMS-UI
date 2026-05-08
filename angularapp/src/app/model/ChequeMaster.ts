export class ChequeMaster {
    ID!: number;
    BankID!: number;
    AccountName?:string;
    ChequeStart?: number;
    ChequeEnd?: number;
    IsActive!: boolean;
    LastUpdate?: Date;
    LastUpdatedBy?: string;

    constructor(data: Partial<ChequeMaster> = {}) {
        this.ID = data.ID || 0;
        this.BankID = data.BankID || 0;
        this.ChequeStart = data.ChequeStart || 0;
        this.ChequeEnd = data.ChequeEnd || 0;
        this.IsActive = data.IsActive || false;
        this.LastUpdate = data.LastUpdate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
  }