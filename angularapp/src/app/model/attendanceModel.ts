export class AttendanceModel {
  ID: number;
  Period: string;
  Branch?: string;
  EmployeeID: number;
  Shift2Type: number;
  Shift2Rate: number;
  AllowanceDeduction: number;
  SpecialAllowanceDeduction: number;
  Bonus: number;
  KPIDeduction: number;
  LastUpdate: Date;
  LastUpdatedBy?: string;

  constructor(data: Partial<AttendanceModel> = {}) {
    this.ID = data.ID || 0;
    this.Period = data.Period || '';
    this.Branch = data.Branch || '';
    this.EmployeeID = data.EmployeeID || 0;
    this.Shift2Type = data.Shift2Type || 0;
    this.Shift2Rate = data.Shift2Rate || 0;
    this.AllowanceDeduction = data.AllowanceDeduction || 0;
    this.SpecialAllowanceDeduction = data.SpecialAllowanceDeduction || 0;
    this.Bonus = data.Bonus || 0;
    this.KPIDeduction = data.KPIDeduction || 0;
    this.LastUpdate = data.LastUpdate || new Date;
    this.LastUpdatedBy = data.LastUpdatedBy || '';
  }
}
