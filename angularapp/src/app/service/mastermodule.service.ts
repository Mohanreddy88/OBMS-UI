import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BranchModel } from '../model/branchModel';
import { ClientModel } from '../model/clientModel';
import { ShiftModel } from '../model/shiftModel';
import { SIPModel } from '../model/SIPModel';
import { EPFModel } from '../model/epfModel';
import { SalaryStructure } from '../model/salaryStructure';
import { LeaveSystem } from '../model/leaveSystemModel';
import { SOCSO } from '../model/socsoModel';
import { IncomeTaxModel } from '../model/incomeTaxModel';

@Injectable({
  providedIn: 'root'
})
export class MastermoduleService {
  apiUrl: string = environment.baseUrl;
  constructor(private httpClient: HttpClient) { }

  getBranchMaster(branchCode: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branchCode=" + branchCode }) };
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  getBranchMasterList(): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchMasterAll'
    ).pipe(catchError(this.errorHandle));
  }
  GetBranchListByUserName(userName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchListByUserName', {
      params: { userName: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  GetBankListByUserName(userName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'Register/GetBankListByUserId', {
      params: { name: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateBranchMaster(branchDetails: BranchModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateBranchMaster',
      JSON.stringify(branchDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  //Delete branch master by ID
  deleteBranchMasterByCode(code: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteBranchMasterByCode?code=${encodeURIComponent(code)}`,
      null
    ).pipe(catchError(this.errorHandle));
  }

  getBranchMasterCode(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/GetBranchMasterCode')
      .pipe(catchError(this.errorHandle));
  }
  getClienthMaster(clientCode: string, status: string, currentUser: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetClientMsterList', {
      params: { clientCode: clientCode.toString(), status: status.toString(), currentUser: currentUser }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getClientMsterListByStatus(status: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?status=" + status }) };
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMsterListByStatus', params
    ).pipe(catchError(this.errorHandle));
  }
  getClientMsterListByBranch(branchCode: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branchCode=" + branchCode }) };
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMsterListByBranch', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateClientMaster(clientDetails: ClientModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateClientMaster',
      JSON.stringify(clientDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  //Delete client master by ID
  deleteClientMasterByCode(code: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteClientMasterByCode?code=${encodeURIComponent(code)}`,
      null
    ).pipe(catchError(this.errorHandle));
  }

  getNClientMasterCode(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/GetNClientMasterCode')
      .pipe(catchError(this.errorHandle));
  }
  getShifthMasterList(): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetShiftMsterList'
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateShiftMaster(shiftDetails: ShiftModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateShiftMaster',
      JSON.stringify(shiftDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteShiftMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteShiftMasterById?Id=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }


  getSIPhMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetSIPMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSIPMaster(sipDetails: SIPModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateSIPMaster',
      JSON.stringify(sipDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteSIPMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteSIPMasterById?Id=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }

  getEPFMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<EPFModel[]>(this.apiUrl + 'master/GetEPFMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateEPFMaster(epfDetails: EPFModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateEPFMaster',
      JSON.stringify(epfDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteEPFMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteEPFMasterById?Id=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }


  getIncomeTaxMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<IncomeTaxModel[]>(this.apiUrl + 'master/GetIncomeTaxMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateIncomeTaxMaster(incomeTacDetails: IncomeTaxModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateIncomeTaxMaster',
      JSON.stringify(incomeTacDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteIncomeTaxMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteIncomeTaxMasterById?Id=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }

  getLeaveMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<EPFModel[]>(this.apiUrl + 'master/GetLeaveMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateLeaveMaster(epfDetails: LeaveSystem): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateLeaveMaster',
      JSON.stringify(epfDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteLeaveMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteLeaveMasterById?Id=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }


  getSOCSOMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<SOCSO[]>(this.apiUrl + 'master/GetSOCSOMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSOCSOMaster(socsoDetails: SOCSO): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateSOCSOMaster',
      JSON.stringify(socsoDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteSOCSOMasterById(id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteSOCSOMasterById?socsoId=${id}`,
      null
    ).pipe(catchError(this.errorHandle));
  }


  getSalaryMaster(id: number, status: string): Observable<any> {
    return this.httpClient.get<SalaryStructure[]>(this.apiUrl + 'master/GetSalaryMaster', {
      params: { salaryId: id, status: status.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getSalaryListByStatus(status: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?activeStatus=" + status }) };
    return this.httpClient.get<SalaryStructure[]>(this.apiUrl + 'master/GetSalaryListByStatus', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSalaryMaster(salaryDetails: SalaryStructure): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateSalaryMaster',
      JSON.stringify(salaryDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteSalaryMasterById(salaryId: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}master/DeleteSalaryMasterById?salaryId=${salaryId}`,
      null
    ).pipe(catchError(this.errorHandle));
  }

  getUserAccessRights(userName: string, screenName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'register/GetUserAccessRights', {
      params: { userName: userName, screenName: screenName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getKKDNListView(branch: string, kdnVetting: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetKKDNListView', {
      params: { branch: branch.toString(), kdnVetting: kdnVetting.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getKKDNList(branch: string, Employeetype: string, dtDateJoinFrom: string, dtDateJoinTo: string, kdnVetting: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetKKDNList', {
      params: { branch: branch.toString(), Employeetype, dtDateJoinFrom: dtDateJoinFrom.toString(), dtDateJoinTo: dtDateJoinTo.toString(), kdnVetting: kdnVetting.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getSuppliers(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetSuppliers`, { params });
  }
  getInventoryCategories(cat?: string): Observable<any[]> {
    let params = new HttpParams();
    if (cat) {
      params = params.set('cat', cat);
    }

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetInventoryCategories`, { params });
  }
  getMonthlyInvoices(invoiceStartPeriod: string, invoiceEndPeriod: string): Observable<any> {
    const params = new HttpParams()
      .set('invoiceStartPeriod', invoiceStartPeriod)
      .set('invoiceEndPeriod', invoiceEndPeriod);

    return this.httpClient.get(`${this.apiUrl}Finance/monthly-invoices`, { params });
  }
  getMonthlyInvoiceList(start: Date, end: Date): Observable<any> {
    const normalizeDate = (d: Date) => {
      const onlyDate = new Date(d);
      onlyDate.setHours(0, 0, 0, 0);  // set time to 00:00:00
      return onlyDate.toISOString();  // still ISO, but at 00:00
    };

    let params = new HttpParams()
      .set('Start', normalizeDate(start))
      .set('End', normalizeDate(end));

    return this.httpClient.get<any>(`${this.apiUrl}Finance/GetMonthlyInvoiseList`, { params });
  }
  getList(
    dtSalaryPeriod: string,
    dtEndPeriod: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('dtEndPeriod', dtEndPeriod);
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetList`, { params });
  }
  getListWithBranch(
    dtSalaryPeriod: string,
    dtEndPeriod: string,
    branch: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('dtEndPeriod', dtEndPeriod)
      .set('Branch', branch);
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetListWithBranch`, { params });
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
