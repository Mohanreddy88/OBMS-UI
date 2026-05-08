import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { catchError, forkJoin, Observable, throwError } from "rxjs";
import { AnyARecord } from 'dns';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getInvoiceMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetInvoiceMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  getClients(branchId: string, invoicePeriod: string) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&invoicePeriod=" + invoicePeriod }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetInvoiceClientByBranchAndInvoiceDate', params
    ).pipe(catchError(this.errorHandle));
  }

  getBatchInvoiceClients(branchId: string, invoicePeriod: string) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&invoicePeriod=" + invoicePeriod }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetBatchInvoiceClientByBranchAndInvoiceDate', params
    ).pipe(catchError(this.errorHandle));
  }

  getAgreement(branchId: string, invoicePeriod: string, clientId: string) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&invoicePeriod=" + invoicePeriod + "&clientId=" + clientId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetAgreementAndDetailsByBranchInvoicePeriodAndClient', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientInvoiceById(invoiceId: string) {
    const params = { params: new HttpParams({ fromString: "?invoiceId=" + invoiceId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetInvoiceAndDetailsByInvoiceId', params
    ).pipe(catchError(this.errorHandle));
  }

  GetBranchListByUserName(userName: string) {
    const params = { params: new HttpParams({ fromString: "?userName=" + userName }) };
    return this.httpClient.get<any>(this.apiUrl + 'Master/GetBranchListByUserName', params
    ).pipe(catchError(this.errorHandle));
  }

  saveInvoice(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/SaveAndUpdateInvoice', body);
  }

  saveBatchInvoice(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/SaveAndUpdateBatchInvoice', body);
  }

  deleteInvoice(id: string): Observable<any> {
    return this.httpClient.get(
      `${this.apiUrl}Finance/DeleteInvoiceById?Id=${id}`
    ).pipe(catchError(this.errorHandle));
  }

  DeletedInvoiceListByBranchId(id: string): Observable<any> {
    return this.httpClient.get(
      `${this.apiUrl}Finance/DeletedInvoiceListByBranchId?Id=${id}`
    ).pipe(catchError(this.errorHandle));
  }


  SaveAndUpdateInvoiceDetail(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/SaveAndUpdateInvoiceDetail', body);
  }

  DeleteInvoiceDetailById(body: any) {
    return this.httpClient.post(
      `${this.apiUrl}Finance/DeleteInvoiceDetailById`,
      body
    );
  }


  RestoreInvoices(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/RestoreInvoices', body);
  }

  getInvoice(branchId: string, invoicePeriod: string, clientId: string) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&invoicePeriod=" + invoicePeriod + "&clientId=" + clientId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Finance/GetAgreementAndDetailsByBranchInvoicePeriodAndClient', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPaymentMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userId=" + userId }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetPaymentMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPaymentMasterCategoryType(cat: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?cat=" + cat }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetPaymentMasterCategoryType', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPaymentMasterCategoryTypeChangePayTo(cat: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?cat=" + cat }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetPaymentMasterCategoryTypeChangePayTo', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPaymentSupplierInvoices(supplier: string, userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?supplier=" + supplier + "&userId=" + userId }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetPaymentSupplierInvoices', params
    ).pipe(catchError(this.errorHandle));
  }

  saveAndUpdatePayment(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/SaveAndUpdatePayment', body);
  }

  GetReceiptMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userId=" + userId }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetReceiptMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  GetClientByBranch(branch: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branch=" + branch }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetClientByBranch', params
    ).pipe(catchError(this.errorHandle));
  }

  GetReceiptInvoiceByClient(branch: string, client: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branch=" + branch + "&client=" + client }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetReceiptInvoiceByClient', params
    ).pipe(catchError(this.errorHandle));
  }

  GetReceiptDetailRowAmount(ReceiptDetailsID: string, ReceiptID: string, InvoiceID: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?ReceiptDetailsID=" + ReceiptDetailsID + "&ReceiptID=" + ReceiptID + "&InvoiceID=" + InvoiceID }) };
    return this.httpClient.get(this.apiUrl + 'Finance/GetReceiptDetailRowAmount', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPrintInvoice(InvoiceID: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?invoiceID=" + InvoiceID }) };
    return this.httpClient.get(this.apiUrl + 'Finance/PrintInvoice', params
    ).pipe(catchError(this.errorHandle));
  }

  SaveAndUpdateReceipt(body: any) {
    return this.httpClient.post(this.apiUrl + 'Finance/SaveAndUpdateReceipt', body);
  }
  getByDateAndBranch(receiptDate: string, branch: string): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}Finance/GetByDateAndBranch`, {
      params: { receiptDate, branch },
    });
  }

  getByBankAndCheque(bankCode: string, chequeNo: string, branch: string): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}Finance/GetByBankAndCheque`, {
      params: { bankCode, chequeNo, branch },
    });
  }
  getBoth(receiptDate: string, branch: string, bankCode: string, chequeNo: string): Observable<any[]> {
    return forkJoin([
      this.getByDateAndBranch(receiptDate, branch),
      this.getByBankAndCheque(bankCode, chequeNo, branch),
    ]);
  }
  getReceipt(id: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}Finance/${id}`);
  }

  getListByDate(paymentDate: string): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}Finance/byDate`, { params: { paymentDate } });
  }

  getListByBankAndCheque(bankId: number, chequeNo: string): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}Finance/byBankAndCheque`, {
      params: { bankId: bankId.toString(), chequeNo },
    });
  }

  getBothPayments(paymentDate: string, bankId: number, chequeNo: string): Observable<any[]> {
    return forkJoin([
      this.getListByDate(paymentDate),
      this.getListByBankAndCheque(bankId, chequeNo),
    ]);
  }

  getBranchPayment(id: number): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}Finance/byPaymentID/${id}`);
  }

  getBankShortName(id: number): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}register/GetBankShortName/${id}`, { responseType: 'text' as 'json' });
  }

  deletePayment(id: number, currentUser: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}Finance/delete`,
      { id, currentUser }
    );
  }

  deleteReceipt(id: number, currentUser: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}Finance/receipt/delete`,
      { id, currentUser }
    );
  }

  getNextChequeNumber(account: number): Observable<any> {
    const params = new HttpParams()
      .set('account', account);
    return this.httpClient.get<any>(`${this.apiUrl}Finance/GetNextChequeNumber`, { params });
  }
  getNoOfCheques(account: number): Observable<any> {
    const params = new HttpParams()
      .set('account', account);
    return this.httpClient.get<any>(`${this.apiUrl}Finance/GetNoOfCheques`, { params });
  }

  getInventoryCategoryList(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/InventoryCategoryList`);
  }

  getDeletedPayments(paymentDate: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/PaymentRecycleBin`, {
      params: new HttpParams().set('paymentDate', paymentDate)
    });
  }

  restoreBranchPayments(ids: number[], currentUser: string): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}Finance/restore-multiple`, {
      ids,
      currentUser
    });
  }
  restoreChequeStatus(ids: number[], currentUser: string, transType: string, chequeStatus: string, clearence_date: string): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}Finance/restore-chequeStatus`, {
      ids,
      currentUser,
      transType,
      chequeStatus,
      clearence_date
    });
  }
  getChequeStatuses(startDate: string, endDate: string, chequeStatus: string, bankCode: string, transType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('chequeStatus', chequeStatus)
      .set('bankCode', bankCode)
      .set('transType', transType);

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/cheque-status`, { params });
  }

  getLegalDemandList(branch?: string, client?: string, actionTaken?: string): Observable<any[]> {
    let params = new HttpParams();

    if (branch) params = params.set('branch', branch);
    if (client) params = params.set('client', client);
    if (actionTaken) params = params.set('actionTaken', actionTaken);

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetLegalDemandList`, { params });
  }

  saveOrUpdateLegalDemand(action: any): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}Finance/saveOrUpdateLegalDemand`, action);
  }

  deleteLegalDemand(id: number, currentUser: string, deleteRemarks: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}Finance/DeleteLegalDemand/${id}?currentUser=${encodeURIComponent(currentUser)}&deleteRemarks=${encodeURIComponent(deleteRemarks)}`,
      null
    );
  }
  getLegalDemandByID(id: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}Finance/GetLegalDemandByID/${id}`);
  }

  getPaymentListByCategory(categoryId: string, startDate: string, endDate: string): Observable<{ message: string, data: any[] }> {
    const params = new HttpParams()
      .set('categoryId', categoryId)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.httpClient.get<{ message: string, data: any[] }>(`${this.apiUrl}Finance/GetPaymentListByCategory`, { params });
  }

  getBranchPaymentsTotalAmountByCategory(categoryId: string, startDate: string, endDate: string): Observable<number> {
    const params = new HttpParams()
      .set('categoryId', categoryId)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.httpClient.get<number>(`${this.apiUrl}Finance/GetBranchPaymentsTotalAmountByCategory`, { params });
  }

  getNewClientInvoiceNo(branchCode: string, invoiceDate: string): Observable<any> {
    const params = new HttpParams()
      .set('branchCode', branchCode)
      .set('invoiceDate', invoiceDate);

    return this.httpClient.get(`${this.apiUrl}Finance/NewClientInvoiceNo`, { params });
  }

  getListByBranchAndInvoice(branch: string, invoiceNo: string): Observable<any[]> {
    return this.httpClient.get<any[]>(
      `${this.apiUrl}Finance/GetListByBranchAndInvoice`,
      {
        params: {
          branch: branch,
          invoiceNo: invoiceNo
        }
      }
    );
  }

  getInvoiceDetails(branch: string, client: string, receiptId?: number): Observable<any[]> {

    const params = new HttpParams()
      .set('branch', branch)
      .set('client', client)
      .set('receiptId', receiptId?.toString() ?? '-1');

    return this.httpClient.get<any[]>(
      `${this.apiUrl}Finance/invoice-details`,
      { params }
    );
  }

  // 1️⃣ Branch payment list
  getBranchPaymentList(userId: string, paymentId: number): Observable<any[]> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('paymentId', paymentId.toString());

    return this.httpClient.get<any[]>(
      `${this.apiUrl}Finance/branch-payment-details`,
      { params }
    );
  }

  // 2️⃣ Creditor invoice payment list
  getCreditorInvoicePaymentList(userId: string, paymentId: number): Observable<any[]> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('paymentId', paymentId.toString());

    return this.httpClient.get<any[]>(
      `${this.apiUrl}Finance/creditor-invoice-payment-details`,
      { params }
    );
  }

  getCreditorInvoicePaymentListBySupplier(userId: string, paymentId: number, supplier: number): Observable<any[]> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('paymentId', paymentId.toString())
      .set('supplier', supplier.toString());

    return this.httpClient.get<any[]>(
      `${this.apiUrl}Finance/creditor-invoice-payment-details-by-supplier`,
      { params }
    );
  }
  generateClientStatement(payload: any) {
    return this.httpClient.post(`${this.apiUrl}Finance/client-statement`, payload);
  }

  executeSupplierReport(payload: any) {
    return this.httpClient.post(`${this.apiUrl}Finance/supplier-report`, payload);
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
