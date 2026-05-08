export class SalaryMonthlyAdvance {
    ID!: number;
    EmployeeID!: number;
    AdvanceTakenDate!: Date;
    AdvanceDate!: Date;
    VoucherNo?: string;
    Amount!: number;
    NoOfInstallments?: number;
    PaymentType?: string;
    Particulars?: string;
    TransType?: number;
    IsDeleted?: boolean;
    LastUpdate?: Date;
    LastUpdatedBy?: string;

    constructor(data: Partial<SalaryMonthlyAdvance> = {}) {
      // Initialize properties with provided data or default values
      this.ID = data.ID || 0;
      this.EmployeeID = data.EmployeeID || 0;
      this.AdvanceTakenDate = data.AdvanceTakenDate || new Date();
      this.AdvanceDate = data.AdvanceDate || new Date();
      this.VoucherNo = data.VoucherNo || '';
      this.Amount = data.Amount || 0;
      this.NoOfInstallments = data.NoOfInstallments || 0;
      this.PaymentType = data.PaymentType || '';
      this.Particulars = data.Particulars || '';
      this.TransType = data.TransType || 1;
      this.IsDeleted = data.IsDeleted || false;
      this.LastUpdate = data.LastUpdate || new Date();
      this.LastUpdatedBy = data.LastUpdatedBy || '';
    }
  }