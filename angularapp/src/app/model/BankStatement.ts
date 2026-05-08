export class BankStatement {
  AccountNo: string = '';
  Salary: string = '';
  Name: string = '';
  Passport: string = '';
  BranchCode: string = '';

  // Method to allow partial initialization
  setEmployeeData(data: Partial<BankStatement>): void {
    Object.assign(this, data);
  }
}
