export class SalaryProcessModel {
    ID: number;
    Period: Date;
    Branch: string;
    EmployeeType: string;
    IsLocked: boolean;
    Remarks: string;
    LastUpdate: Date;
    LastUpdatedBy: string;
  
    constructor(data: Partial<SalaryProcessModel> = {}) {
        this.ID = data.ID || 0;
        this.Period = data.Period || new Date();
        this.Branch = data.Branch || '';
        this.EmployeeType = data.EmployeeType || '';
        this.IsLocked = data.IsLocked || false;
        this.Remarks = data.Remarks || '';
        this.LastUpdate = data.LastUpdate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
  }
  