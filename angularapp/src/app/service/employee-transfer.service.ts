import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EmployeeTransferService {
  apiUrl: string = environment.baseUrl;
  constructor(private httpClient: HttpClient) { }

  getEmployees() {
    return this.httpClient.get<any>(this.apiUrl + 'Master/GetBranchMasterAll',
    ).pipe(catchError(this.errorHandle));
  }

  setEmployeeTransfer(body: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/UpdateEmployeeTransfer', body);
  }

  getEmployeeHistoryDetails(branch?: string): Observable<any[]> {
    const params = branch ? { params: { branch } } : {};
    return this.httpClient.get<any[]>(`${this.apiUrl}Employee/GetAllEmployeesWithHistory`, params);
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
