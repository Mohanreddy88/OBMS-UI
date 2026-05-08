import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { EmployeeMonthlyAdvance } from "../model/employeeMonthlyAdvance";
import { SalaryMonthlyAdvance } from "../model/salaryMonthlyAdvance";
import { InventoryCategory } from "../model/inventoryCategory";
import { ItemMasterModel } from "../model/itemMasterModel";
import { MiscTransModel } from "../model/miscTransModel";
import { AttendanceModel } from "../model/attendanceModel";
import { BankStatement } from "../model/BankStatement";

@Injectable({
  providedIn: 'root'
})
export class PayrollModuleService {
  apiUrl: string = environment.baseUrl;
  constructor(private httpClient: HttpClient) { }

  getEmployeeList(): Observable<any> {
    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeList'
    ).pipe(catchError(this.errorHandle));
  }
  getEmployeeListBySalaryAdvance(transType: number, currentUser: string): Observable<any> {
    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListBySalaryAdvance', {
      params: { TransType: transType, currentUser: currentUser }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getInventoryCategories(): Observable<any> {
    return this.httpClient.get<InventoryCategory[]>(this.apiUrl + 'payroll/GetInventoryCategories'
    ).pipe(catchError(this.errorHandle));
  }
  getEmployeeListByBranchCode(branchCode: string): Observable<any> {
    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListByBranchCode', {
      params: { branchCode: branchCode }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getEmployeeListByAdvanceID(Id: number): Observable<any> {
    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListByAdvanceID', {
      params: { Id: Id }
    }
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSalaryMonthlyAdvance(salaryAdvanceDetails: SalaryMonthlyAdvance): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/GetSalaryAdvanceByDateAndEmployee',
      JSON.stringify(salaryAdvanceDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSalaryDailyAdvances(salaryAdvanceDetails: SalaryMonthlyAdvance[]): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/SaveAndUpdateSalaryDailyAdvances',
      JSON.stringify(salaryAdvanceDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  getSalaryAdvanceById(employeeId: number, id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: `?employeeId=${employeeId}&id=${id}` }) };
    return this.httpClient.get<SalaryMonthlyAdvance>(this.apiUrl + 'payroll/GetSalaryAdvanceById', params
    ).pipe(catchError(this.errorHandle));
  }
  getEmployeeById(employeeId: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?employeeId=" + employeeId }) };
    return this.httpClient.get<SalaryMonthlyAdvance>(this.apiUrl + 'payroll/GetEmployeeById', params
    ).pipe(catchError(this.errorHandle));
  }
  getListByEmplyeeType(advanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetListByEmplyeeType',
      { params: { advanceDate: advanceDate.toString(), branch: branchCode, employeeType: employeeType, transType: transType, advanceAmount: advanceAmount, race: race } }
    ).pipe(catchError(this.errorHandle));
  }
  getEmployeeAdvanceList(advanceDate: string, branchCode: string, employeeType: number, client: string, transType: number, advanceAmount: number, race: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeAdvanceList',
      { params: { advanceDate: advanceDate.toString(), branch: branchCode, employeeType: employeeType, client: client, transType: transType, advanceAmount: advanceAmount, race: race } }
    ).pipe(catchError(this.errorHandle));
  }
  getNewVoucherNumber(transType: number): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetNewVoucherNumberAsync', {
      params: { transType: transType }
    }).pipe(catchError(this.errorHandle));
  }
  getSalaryProcessDate(employeeID: number, year: number, month: number): Observable<boolean> {
    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/GetSalaryProcessDateByEmployeeID', {
      params: { employeeID: employeeID.toString(), year: year.toString(), month: month.toString() }
    }).pipe(catchError(this.errorHandle));
  }
  getResignDateByEmployeeID(employeeID: number): Observable<Date> {
    return this.httpClient.get<Date>(this.apiUrl + 'payroll/GetResignDate', {
      params: { employeeID: employeeID.toString() }
    }).pipe(catchError(this.errorHandle));
  }
  getUniformItemRows(advanceId: number, category: number): Observable<ItemMasterModel[]> {
    return this.httpClient.get<ItemMasterModel[]>(this.apiUrl + 'payroll/GetUniformItemRows', {
      params: { AdvanceID: advanceId.toString(), Category: category.toString() }
    })
      .pipe(catchError(this.errorHandle));
  }
  getMiscTransList(currentUser: string): Observable<MiscTransModel[]> {
    const params = new HttpParams().set('currentUser', currentUser);

    return this.httpClient.get<MiscTransModel[]>(
      `${this.apiUrl}payroll/GetMiscTrans`,
      { params }
    );
  }
  getMiscTransById(id: number): Observable<any> {
    return this.httpClient.get<MiscTransModel>(this.apiUrl + 'payroll/GetMiscTransById', {
      params: { id: id }
    });
  }
  saveAndUpdateMiscTrans(miscTrans: MiscTransModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/SaveAndUpdateMiscTrans',
      JSON.stringify(miscTrans),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteMiscTrans(id: number): Observable<void> {
    return this.httpClient.post<void>(
      `${this.apiUrl}payroll/DeleteMiscTransById?id=${id}`,
      null
    );
  }
  getDailyAdvanceList(advanceDate: Date, employeeID: number, advanceType: number): Observable<any[]> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetDailyAdvanceList', {
      params: { advanceDate: formattedDate, employeeID: employeeID, advanceType: advanceType }
    }).pipe(catchError(this.errorHandle));
  }
  getClients(advanceDate: string, branchCode: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetClients', {
      params: { period: advanceDate, branchCode: branchCode }
    }).pipe(catchError(this.errorHandle));
  }
  getEmployeeDetails(branchCode: string, employeeNo: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetEmployeeDetails', {
      params: { branchCode: branchCode.toString(), employeeNo: employeeNo }
    })
      .pipe(catchError(this.errorHandle));
  }
  calculateAge(birthDate: Date): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/CalculateAge', {
      params: { birthDate: birthDate.toString() }
    })
      .pipe(catchError(this.errorHandle));
  }
  attendanceByEmployeeID(dtAdvanceDate: string, id: number): Observable<any> {
    return this.httpClient.get<AttendanceModel>(this.apiUrl + 'payroll/AttendanceByEmployeeID', {
      params: { period: dtAdvanceDate, employeeID: id }
    });
  }
  attendanceDetailsByID(id: number): Observable<any> {
    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/AttendanceDetailsByID', {
      params: { Id: id }
    });
  }
  getAnnualLeave(employeeID: number, advanceDate: Date): Observable<any> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetAnnualLeave', {
      params: { employeeID: employeeID, Period: formattedDate.toString() }
    }).pipe(catchError(this.errorHandle));
  }
  getMedicalLeave(employeeID: number, advanceDate: Date): Observable<any> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetMedicalLeave', {
      params: { employeeID: employeeID, Period: formattedDate }
    }).pipe(catchError(this.errorHandle));
  }
  getMaternityLeave(employeeID: number, advanceDate: Date): Observable<any> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetMaternityLeave', {
      params: { employeeID: employeeID, Period: formattedDate }
    }).pipe(catchError(this.errorHandle));
  }
  getPaternityLeave(employeeID: number, advanceDate: Date): Observable<any> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetPaternityLeave', {
      params: { employeeID: employeeID, Period: formattedDate }
    }).pipe(catchError(this.errorHandle));
  }
  getHospitalizationLeave(employeeID: number, advanceDate: Date): Observable<any> {
    const formattedDate = advanceDate.toISOString().split('T')[0];
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetHospitalizationLeave', {
      params: { employeeID: employeeID, Period: formattedDate }
    }).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateAttendance(attendanceModel: AttendanceModel, attendanceDetails: any[]): Observable<any> {
    const payload = {
      attendanceModel: attendanceModel,
      attendanceDetails: attendanceDetails
    };

    return this.httpClient.post<any>(this.apiUrl + 'payroll/SaveAndUpdateAttendance',
      JSON.stringify(payload),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteAttendance(id: number): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}payroll/DeleteAttendance?id=${id}`,
      null
    );
  }
  getList(branch: string, employeeType: number, resignedDate: string, joinDate: string, attendancePeriod: string, status: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetList',
      { params: { branch: branch, employeeType: employeeType, resignedDate: resignedDate, joinDate: joinDate, attendancePeriod: attendancePeriod, status: status } }
    ).pipe(catchError(this.errorHandle));
  }
  getListByEmployee(branch: string, employeeType: string, resignedDate: string, joinDate: string, status: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/getListByEmployee',
      { params: { branch: branch, employeeType: employeeType, resignedDate: resignedDate, joinDate: joinDate, status: status } }
    ).pipe(catchError(this.errorHandle));
  }
  getListEmployeeByClient(branch: string, employeeType: string, resignedDate: string, joinDate: string, status: string, empClient: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/getListEmployeeByClient',
      { params: { branch: branch, employeeType: employeeType, resignedDate: resignedDate, joinDate: joinDate, status: status, empClient: empClient } }
    ).pipe(catchError(this.errorHandle));
  }
  getLastprocessedDate(branchCode: string, employeeType: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/LastprocessedDate', {
      params: { branchCode: branchCode, employeeType: employeeType }
    }).pipe(catchError(this.errorHandle));
  }
  getLastSalaryProcessRemarks(period: string, branchCode: string, employeeType: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/LastSalaryProcessRemarks', {
      params: { period: period, branchCode: branchCode, employeeType: employeeType }
    }).pipe(catchError(this.errorHandle));
  }
  getEmployeeAttendanceList(period: string, branch: string): Observable<any[]> {
    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetEmployeeAttendanceList', {
      params: { period: period, branch: branch }
    }).pipe(catchError(this.errorHandle));
  }
  getIsSalaryProcessDoneForCurrentPeriod(branchCode: string, employeeType: string, period: string): Observable<boolean> {
    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/IsSalaryProcessDoneForCurrentPeriod', {
      params: { branch: branchCode, employeeType: employeeType, dtPeriod: period }
    }).pipe(catchError(this.errorHandle));
  }
  getIsTemporaryEmployee(employeeCode: string): Observable<boolean> {
    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/IsTemporaryEmployee', {
      params: { employeeCode: employeeCode }
    });
  }
  salaryProcess(branch: string, employeeType: string, remarks: string, period: string, lockProcess: boolean, currentUser: string, companyCode: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/Process', {
      params: { branch: branch, employeeType: employeeType, remarks: remarks, period: period, lockProcess: lockProcess, currentUser: currentUser, companyCode: companyCode }
    }).pipe(catchError(this.errorHandle));
  }
  // Method 1: GetListWithBlankRow(dtSalaryPeriod)
  getListWithBlankRow(dtSalaryPeriod: string): Observable<BankStatement[]> {
    const params = new HttpParams().set('dtSalaryPeriod', dtSalaryPeriod);
    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRow`, { params });
  }
  // Method 2: GetListWithBlankRow(dtSalaryPeriod, Branch)
  getListWithBlankRowWithBranch(
    dtSalaryPeriod: string,
    branch: string
  ): Observable<BankStatement[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('Branch', branch);
    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranch`, { params });
  }
  // Method 3: GetListWithBlankRow(dtSalaryPeriod, Branch, EmployeeType)
  getListWithBlankRowWithBranchAndEmployeeType(
    dtSalaryPeriod: string,
    branch: string,
    employeeType: string
  ): Observable<BankStatement[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('Branch', branch)
      .set('EmployeeType', employeeType);
    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranchAndEmployeeType`, { params });
  }
  // Method 4: GetListWithBlankRow(dtSalaryPeriod, Branch, EmployeeType, Bank)
  getListWithBlankRowWithAllParams(
    dtSalaryPeriod: string,
    branch: string,
    employeeType: string,
    bank: string
  ): Observable<BankStatement[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('Branch', branch)
      .set('EmployeeType', employeeType)
      .set('Bank', bank);
    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranchEmployeeTypeAndBank`, { params });
  }
  getEPFToExcel(branch: string, dtSalaryPeriod: string, employeeType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branch', encodeURIComponent(branch))
      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))
      .set('employeeType', encodeURIComponent(employeeType));

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEPFToExcel`, { params })
      .pipe(catchError(this.errorHandle));
  }
  getSOCSOToExcel(dtSalaryPeriod: string, branch: string): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('Branch', branch)
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeSocsoList`, { params });
  }
  getSIPToExcel(companyCode: string, SSM: string, dtSalaryPeriod: string, branch: string): Observable<any[]> {
    const params = new HttpParams()
      .set('CompanyCode', companyCode)
      .set('SSM', SSM)
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('Branch', branch)
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeSIPList`, { params });
  }
  getConfig(KeyValue: string, branch: string): Observable<any[]> {
    const params = new HttpParams()
      .set('KeyValue', KeyValue)
      .set('Branch', branch)
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetConfig`, { params });
  }
  // Service method for GetEPFToCIMBList
  getEPFToCIMBList(branch: string, period: string, employeeType: string, companyEPF: string, companyPIC: string, companyPICContact: string): Observable<string[]> {
    const params = new HttpParams()
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('CompanyEPF', companyEPF)
      .set('CompanyPIC', companyPIC)
      .set('CompanyPICContact', companyPICContact);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEPFToCIMBList`, { params });
  }
  // Service method for GetSocsoToCIMBList
  getSocsoToCIMBList(companyRegNumber: string, socsoCompanyCode: string, branch: string, period: string, employeeType: string, empTempType: string): Observable<string[]> {
    const params = new HttpParams()
      .set('CompanyRegNumber', companyRegNumber)
      .set('SocsoCompanyCode', socsoCompanyCode)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('EmpTempType', empTempType);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetSocsoToCIMBList`, { params });
  }
  // Service method for GetSIPToCIMBList
  getSIPToCIMBList(companyRegNumber: string, sipCompanyCode: string, branch: string, period: string, employeeType: string): Observable<string[]> {
    const params = new HttpParams()
      .set('CompanyRegNumber', companyRegNumber)
      .set('SIPCompanyCode', sipCompanyCode)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetSIPToCIMBList`, { params });
  }
  getEmployeeSalaryAdvanceList(period: string, employeeType: string, bankCode: string, type: string,
    company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceList`, { params });
  }
  getEmployeeSalaryAdvanceListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,
    type: string, company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceListWithBranch`, { params });
  }
  getEmployeeSalaryAdvanceTotalList(period: string, employeeType: string, bankCode: string, type: string,
    company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceTotalList`, { params });
  }
  getEmployeeSalaryAdvanceTotalListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,
    type: string, company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceTotalListWithBranch`, { params });
  }
  getEmployeeSalaryAdvanceHashTotalList(period: string, employeeType: string, bankCode: string, type: string,
    company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceHashTotalList`, { params });
  }
  getEmployeeSalaryAdvanceHashTotalListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,
    type: string, company: string, source: string): Observable<string[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceHashTotalListWithBranch`, { params });
  }
  clientInvoiceCalculation(branch: string, client: string, agreementPeriod: string): Observable<any> {
    const url = `${this.apiUrl}payroll/ClientInvoiceCalculation`;
    return this.httpClient.get<any>(url, {
      params: { branch, client, agreementPeriod },
    });
  }
  getMonthlyInvoiceStatusList(
    startDate: string,
    endDate: string,
    branch: string
  ): Observable<BankStatement[]> {
    const params = new HttpParams()
      .set('Start', startDate)
      .set('End', endDate)
      .set('Branch', branch);
    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/GetMonthlyInvoiceStatusList`, { params });
  }
  checkExistAdvance(employeeId: number, advanceDate: string, loanType: number): Observable<boolean> {
    const params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('advanceDate', advanceDate)
      .set('loanType', loanType.toString());

    return this.httpClient.get<boolean>(`${this.apiUrl}payroll/CheckExistAdvance`, { params });
  }
  getEmployeeNo(employeeId: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEmployeeNo/${employeeId}`);
  }
  getAdvanceVoucherNo(branch: string, transType: string): Observable<any> {
    const params = new HttpParams()
      .set('Branch', branch)
      .set('TransType', transType);
    return this.httpClient.get<any>(`${this.apiUrl}payroll/NewAdvanceVoucherNo`, { params });
  }
  getSalaryAdvances(advanceDate: string, employeeId: string, transType: string): Observable<any> {
    const params = new HttpParams()
      .set('advanceDate', advanceDate)
      .set('employeeId', employeeId)
      .set('transType', transType);

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetSalaryAdvances`, { params });
  }
  deleteSalaryAdvance(id: number, currentUser: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}payroll/Delete/${id}?currentUser=${encodeURIComponent(currentUser)}`,
      null
    );
  }

  getLatestAttendancePeriod(employeeId: number, year: number, month: number): Observable<string> {
    return this.httpClient.get<string>(
      `${this.apiUrl}payroll/latest-period?employeeId=${employeeId}&year=${year}&month=${month}`
    );
  }
  getEmployeeLoanList(period: string, branch: string, employeeType: string, transType: number): Observable<any[]> {
    let params = new HttpParams()
      .set('Period', period) // ISO format for DateTime
      .set('Branch', branch)
      .set('EmployeeType', employeeType)
      .set('TransType', transType.toString());

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeLoanList`, { params });
  }
  getSalaryList(period: string, branch: string, client: string, bank: string, paymentType: string,
    employeeType: string, empTempType: string, source: string
  ): Observable<any[]> {
    let params = new HttpParams()
      .set('Period', period)
      .set('Branch', branch)
      .set('Client', client)
      .set('Bank', bank)
      .set('PaymentType', paymentType)
      .set('EmployeeType', employeeType)
      .set('EmpTempType', empTempType)
      .set('Source', source);

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetSalaryList`, { params });
  }
  getEmployeeLoanById(id: number, transType: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEmployeeLoanById?id=${id}&transType=${transType}`);
  }
  getMiscTransListByEmployee(transDate: string, employeeId: number): Observable<any[]> {
    const params = new HttpParams()
      .set('transDate', transDate)
      .set('employeeId', employeeId.toString());

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/misc-trans`, { params });
  }
  saveEmployeeItems(items: any[]) {    
    return this.httpClient.post<any>(
      `${this.apiUrl}payroll/SaveEmployeeItemIssues`,
      items
    );
  }

  getAttendanceDetails(employeeId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/details/${employeeId}`);
  }

  //to handle got any error from server response
  private errorHandle(error: HttpErrorResponse) {
    let errorMessage: string = '';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred Cleint side: ${error.error}`;
    } else {
      // The backend returned an unsuccessful response code.
      //errorMessage = `An error occurred Server side: ${error.status}, body was: ${error.error}`;
    }
    // Return an observable with a user-facing error message.
    errorMessage += '\n This is the problem with service. We are notified & working on it. Please try again later..';
    return throwError(errorMessage);
  }
}