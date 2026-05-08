import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getEmployees(name: string = "none") {
    const params = { params: new HttpParams({ fromString: "?name=" + name }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/Employees', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeeMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/GetEmployeeMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeeById(empId: any) {
    const params = { params: new HttpParams({ fromString: "?employeeId=" + empId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/EmployeeById', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientsFromBranchId(branchId: any, empType: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&empType=" + empType }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/GetClientsFromBranchId', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeesByBranchId(branchId: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/EmployeesByBranchId', params
    ).pipe(catchError(this.errorHandle));
  }


  saveEmployee(body: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/SaveAndUpdateEmployee', body);
  }

  updateEmployee(body: any) {
    return this.httpClient.put(this.apiUrl + 'Employee/SaveAndUpdateEmployee', body);
  }

  checkEmployeeInfo(from: any, data: any) {
    const params = { params: new HttpParams({ fromString: "?from=" + from + "&data=" + data }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/CheckEmployeeInfo', params
    ).pipe(catchError(this.errorHandle));
  }

  deleteEmployee(employeeId: number) {
    return this.httpClient.post(`${this.apiUrl}Employee/DeleteEmployee/${employeeId}`, {});
  }
  getLatestSalaryAdvanceDate(empId: number) {
    return this.httpClient.get<Date>(`${this.apiUrl}Employee/latest-salary-advance-date`, {
      params: { employeeId: empId }
    });
  }

  getLastAttendanceDate(empId: number) {
    return this.httpClient.get<Date>(`${this.apiUrl}Employee/last-attendance-date`, {
      params: { employeeId: empId }
    });
  }

  getSalaryProcessed(empId: number, year: number, month: number) {
    return this.httpClient.get<boolean>(`${this.apiUrl}Employee/salary-processed`, {
      params: { employeeId: empId, year, month }
    });
  }

  getLatestSalaryProcessDate(empId: number, year: number, month: number) {
    return this.httpClient.get<Date>(`${this.apiUrl}Employee/latest-salary-process-date`, {
      params: { employeeId: empId, year, month }
    });
  }
  private errorHandle(error: HttpErrorResponse) {
    let errorMessage: string = '';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred Client side: ${error.error}`;
    } else {
      // The backend returned an unsuccessful response code.
      //errorMessage = `An error occurred Server side: ${error.status}, body was: ${error.error}`;
    }
    // Return an observable with a user-facing error message.
    errorMessage += '\n This is the problem with service. We are notified & working on it. Please try again later..';
    return throwError(errorMessage);
  }
}
