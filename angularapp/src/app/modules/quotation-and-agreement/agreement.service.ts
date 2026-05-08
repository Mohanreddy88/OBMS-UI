import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AgreementService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getAgreementMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementMaster', params).pipe(catchError(this.errorHandle));
  }

  getClientsByBranchID(branchID: any, currentUser: string) {
    const params = new HttpParams()
      .set('branchID', branchID)
      .set('userID', currentUser);
    return this.httpClient.get<any>(
      this.apiUrl + 'Agreement/GetClientsAgreementByBranchID',
      { params }
    ).pipe(catchError(this.errorHandle));
  }


  getClientsOnlyByBranchID(branchID: any, currentUser: string) {
    const params = new HttpParams()
      .set('branchID', branchID)
      .set('currentUser', currentUser);

    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetClientsOnlyByBranchID', { params }
    ).pipe(catchError(this.errorHandle));
  }

  GetClientsAllStatusByBranchID(branchID: any, currentUser: string) {
    const params = new HttpParams()
      .set('branchID', branchID)
      .set('currentUser', currentUser);
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetClientsAllStatusByBranchID', { params }
    ).pipe(catchError(this.errorHandle));
  }

  save(body: any) {
    return this.httpClient.post(this.apiUrl + 'Agreement/SaveAndUpdateAgreement', body);
  }

  getAgreementById(agreementID: any) {
    const params = { params: new HttpParams({ fromString: "?agreementID=" + agreementID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getAgreements(userId: string, branchId: any, load: boolean = false) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&load=" + load + "&userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreements', params
    ).pipe(catchError(this.errorHandle));
  }

  checkClientStatus(branchId: any, clientId: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&clientId=" + clientId + "&status=I" }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/CheckClientStatus', params
    ).pipe(catchError(this.errorHandle));
  }

  getFinalInvoiceDate(agreementId: any) {
    const params = { params: new HttpParams({ fromString: "?agreementId=" + agreementId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetFinalInvoiceDate', params
    ).pipe(catchError(this.errorHandle));
  }


  getAgreementsDiscountReportMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementsDiscountReportMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  getAgreementsDiscountReport(branchId: any, clientId: any, startDate: any, endDate: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&clientId=" + clientId + "&startDate=" + startDate + "&endDate=" + endDate }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementsDiscountReport', params
    ).pipe(catchError(this.errorHandle));
  }

  getAgreementsTermination(branchId: any, userId: string) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementTerminationList', params
    ).pipe(catchError(this.errorHandle));
  }

  GetAgreementListByBranchId(branchId: any, clientId: any, terminationDate: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&clientId=" + clientId + "&terminationDate=" + terminationDate }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementListByBranchId', params
    ).pipe(catchError(this.errorHandle));
  }


  SaveAndUpdateAgreementTermination(body: any) {
    return this.httpClient.post(this.apiUrl + 'Agreement/SaveAndUpdateAgreementTermination', body);
  }

  getAgreementTerminationById(agreementID: any) {
    const params = { params: new HttpParams({ fromString: "?id=" + agreementID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementTerminationByID', params
    ).pipe(catchError(this.errorHandle));
  }

  // deleteAgreementDetailById(id: string): Observable<any> {
  //   const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
  //   return this.httpClient.post(this.apiUrl + 'Agreement/DeleteAgreementDetailById', params
  //   ).pipe(catchError(this.errorHandle));
  // }

  deleteAgreementDetailById(id: number): Observable<void> {
    return this.httpClient.post<void>(
      `${this.apiUrl}Agreement/DeleteAgreementDetailById`,
      null, // 👈 body must be null if you only want query params
      {
        params: new HttpParams().set('Id', id.toString())
      }
    ).pipe(
      catchError(this.errorHandle)
    );
  }

  deleteAgreementById(id: string, currentUser: string): Observable<any> {
    const params = new HttpParams()
      .set('Id', id)
      .set('currentUser', currentUser);

    return this.httpClient.post(
      this.apiUrl + 'Agreement/DeleteAgreementById',
      null,
      { params }
    ).pipe(catchError(this.errorHandle));
  }

  getInvoiceDate(agreementId: number): Observable<Date> {
    return this.httpClient.get<Date>(`${this.apiUrl}Agreement/GetInvoiceDate/${agreementId}`);
  }

  isInvoiceAvailable(agreementId: number): Observable<boolean> {
    return this.httpClient.get<boolean>(`${this.apiUrl}Agreement/IsInvoiceAvailable/${agreementId}`);
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
