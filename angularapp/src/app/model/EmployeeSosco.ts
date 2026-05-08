export class EmployeeSosco {
  EmployeeName: string = "";
  EMPICNO: string = "";
  SOCSONO: string = "";
  Salary: string = "";
  EMPJoinDate: Date = new Date();
  SOCSOEmployee: string = "";
  SOCSOEmployer: string = "";
  

  // Method to allow partial initialization
  setEmployeeData(data: Partial<EmployeeSosco>): void {
    Object.assign(this, data);
  }
  }
  