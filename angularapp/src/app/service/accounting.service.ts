import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { catchError, forkJoin, Observable, throwError } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getList(processYear: number, branch: string): Observable<any> {
    let params = new HttpParams()
      .set('processYear', processYear)
      .set('branch', branch);
    return this.httpClient.get(`${this.apiUrl}Accounting/GetList`, { params });
  }

  getListWithType(processYear: number, branch: string, type: string): Observable<any> {
    let params = new HttpParams()
      .set('processYear', processYear)
      .set('branch', branch)
      .set('type', type);
    return this.httpClient.get(`${this.apiUrl}Accounting/GetListWithType`, { params });
  }

  checkRecordExists(year: number, branch: string): Observable<boolean> {
    const params = new HttpParams()
      .set('year', year)
      .set('branch', branch);

    return this.httpClient.get<boolean>(`${this.apiUrl}Accounting/exists`, { params });
  }

  checkRecordExistsWithType(year: number, branch: string, type: string): Observable<boolean> {
    const params = new HttpParams()
      .set('year', year)
      .set('branch', branch)
      .set('type', type);

    return this.httpClient.get<boolean>(`${this.apiUrl}Accounting/exists-with-type`, { params });
  }
  addGLRecord(currentUser: string, accountGLReportDto: any[]): Observable<any> {
    const params = new HttpParams().set('currentUser', currentUser);
    return this.httpClient.post(`${this.apiUrl}Accounting/add`, accountGLReportDto, { params });
  }

  deleteGLRecord(processYear: number, branch: string, currentUser: string): Observable<any> {
    const params = new HttpParams()
      .set('processYear', processYear.toString())
      .set('branch', branch)
      .set('currentUser', currentUser);

    return this.httpClient.post(
      `${this.apiUrl}Accounting/delete`,
      null,
      { params }
    );
  }

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