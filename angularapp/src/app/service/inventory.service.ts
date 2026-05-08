import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  saveCategory(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateCategory', body);
  }

  getCategories() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetInventoryCategories'
    ).pipe(catchError(this.errorHandle));
  }

  getCategoryByID(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetInventoryCategoryByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getCategoryByCat(cat: string) {
    const params = { params: new HttpParams({ fromString: "?cat=" + cat }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetCategoriesByCat', params
    ).pipe(catchError(this.errorHandle));
  }

  saveItem(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateItem', body);
  }

  getItems() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetInventoryItems'
    ).pipe(catchError(this.errorHandle));
  }

  getItemByID(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetInventoryItemByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getBranchList() {
    return this.httpClient.get<any>(this.apiUrl + 'Master/GetBranchMasterAll',
    ).pipe(catchError(this.errorHandle));
  }

  saveAsset(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateAssetMaster', body);
  }

  getAssets() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetAssetMasters'
    ).pipe(catchError(this.errorHandle));
  }

  getAssetByID(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetInventoryAssetByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getSuppliers() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetSuppliers'
    ).pipe(catchError(this.errorHandle));
  }

  getSupplierCode() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetSupplierCode'
    ).pipe(catchError(this.errorHandle));
  }

  saveSupplier(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateSupplier', body);
  }

  getSupplierByID(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetSupplierByID', params
    ).pipe(catchError(this.errorHandle));
  }

  GetPaytoByCategory(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetPaytoByCategory', params
    ).pipe(catchError(this.errorHandle));
  }

  getRecipientMaster() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetRecipientMaster'
    ).pipe(catchError(this.errorHandle));
  }

  saveRecipient(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateRecipient', body);
  }

  getRecipients() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetRecipients'
    ).pipe(catchError(this.errorHandle));
  }

  getRecipientByID(id: string) {
    const params = { params: new HttpParams({ fromString: "?ID=" + id }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetRecipientByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getUtilityMaster(invCat: string, supplierCat: string, userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?invCat=" + invCat + "&supplierCat=" + supplierCat + "&userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetUtilityMasterList', params
    ).pipe(catchError(this.errorHandle));
  }

  GetUtilityDetailsByID(ID: any): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?ID=" + ID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetUtilityDetailsByID', params
    ).pipe(catchError(this.errorHandle));
  }

  GetUtilitySearchList(branch: string, supplier: string, Itype: string) {
    const params = { params: new HttpParams({ fromString: "?branch=" + branch + "&supplier=" + supplier + "&Itype=" + Itype }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetUtilitySearchList', params
    ).pipe(catchError(this.errorHandle));
  }


  saveUtility(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateUtility', body);
  }

  GetUtilityDetailListByInvoiceId(InvoiceID: string) {
    const params = { params: new HttpParams({ fromString: "?InvoiceID=" + InvoiceID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetUtilityDetailListByInvoiceId', params
    ).pipe(catchError(this.errorHandle));
  }


  DeleteUtilityDetailById(id: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.post(this.apiUrl + 'Inventory/DeleteUtilityDetailById', params
    ).pipe(catchError(this.errorHandle));
  }

  GetItemByCategoryId(categoryId: string) {
    const params = { params: new HttpParams({ fromString: "?categoryId=" + categoryId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetItemByCategoryId', params
    ).pipe(catchError(this.errorHandle));
  }

  GetMaterialMasterList(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetMaterialMasterList', params
    ).pipe(catchError(this.errorHandle));
  }

  GetMaterialInvoiceByBranch(branchID: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branchID=" + branchID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetMaterialInvoiceByBranch', params
    ).pipe(catchError(this.errorHandle));
  }

  GetMaterialInvoiceItemByCategoryID(ID: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?ID=" + ID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetMaterialInvoiceItemByCategoryID', params
    ).pipe(catchError(this.errorHandle));
  }

  saveMaterial(body: any) {
    return this.httpClient.post(this.apiUrl + 'Inventory/SaveAndUpdateMaterial', body);
  }

  GetMaterialSearchList(branch: string) {
    const params = { params: new HttpParams({ fromString: "?branch=" + branch }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetMaterialSearchList', params
    ).pipe(catchError(this.errorHandle));
  }

  GetMaterialDetailListByInvoiceId(InvoiceID: string) {
    const params = { params: new HttpParams({ fromString: "?InvoiceID=" + InvoiceID }) };
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetMaterialDetailListByInvoiceId', params
    ).pipe(catchError(this.errorHandle));
  }
  GetReportHQMaster() {
    return this.httpClient.get<any>(this.apiUrl + 'Inventory/GetReportHQMaster'
    ).pipe(catchError(this.errorHandle));
  }

  // deleteItem(id: number, currentUser: string): Observable<any> {
  //   return this.httpClient.post<any>(`${this.apiUrl}Inventory/DeleteItem/${id}?currentUser=${currentUser}`);
  // }

  // deleteAssetType(id: number): Observable<any> {
  //   return this.httpClient.post(`${this.apiUrl}Inventory/DeleteAsset/${id}`);
  // }

  // deleteRecipientType(id: number): Observable<any> {
  //   return this.httpClient.post(`${this.apiUrl}Inventory/DeleteRecipient/${id}`);
  // }

  // deleteCategory(id: number, currentUser: string): Observable<any> {
  //   return this.httpClient.post<any>(`${this.apiUrl}Inventory/DeleteCategory/${id}?currentUser=${currentUser}`);
  // }

  // deleteSupplierType(id: number): Observable<any> {
  //   return this.httpClient.post(`${this.apiUrl}Inventory/DeleteSupplier/${id}`);
  // }

  deleteItem(id: number, currentUser: string): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}Inventory/DeleteItem/${id}?currentUser=${encodeURIComponent(currentUser)}`,
      null
    );
  }

  deleteAssetType(id: number): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}Inventory/DeleteAsset/${id}`,
      null
    );
  }

  deleteRecipientType(id: number): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}Inventory/DeleteRecipient/${id}`,
      null
    );
  }

  deleteCategory(id: number, currentUser: string): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}Inventory/DeleteCategory/${id}?currentUser=${encodeURIComponent(currentUser)}`,
      null
    );
  }

  deleteSupplierType(id: number): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}Inventory/DeleteSupplier/${id}`,
      null
    );
  }

  isCreditorInvoice(invoiceID: number): Observable<boolean> {
    return this.httpClient.get<boolean>(`${this.apiUrl}Inventory/CreditorInvoice_CheckOnBranchPayments/${invoiceID}`);
  }

  deleteExpensesById(id: number, currentUser: string): Observable<boolean> {
    const params = new HttpParams()
      .set('currentUser', currentUser);

    return this.httpClient.get<boolean>(
      `${this.apiUrl}Inventory/DeleteExpensesByID/${id}`,
      { params }
    );
  }

  getUtilitySearchList(payload: any) {
    return this.httpClient.get<any[]>(
      `${this.apiUrl}Inventory/GetUtilityBillSearchList`,
      {
        params: {
          branch: payload.branch,
          supplier: payload.supplier,
          invoiceType: 'U',
          invoiceNo: payload.invoiceNo || '',
          invoiceDate: payload.invoiceDate || '',
          paymentDate: payload.paymentDate || ''
        }
      }
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
