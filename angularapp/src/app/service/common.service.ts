import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UserRegistration } from '../model/userregistration';
import { Observable, catchError, throwError } from 'rxjs';
import { LoginModel } from '../model/loginModel';
import { BankListModel } from '../model/bankListModel';
import { BankMasterModel } from '../model/bankMasterModel';
import { ChequeMaster } from '../model/ChequeMaster';
import { OBMSPermissions } from '../model/OBMSPermissions';
import { OBMSBranchesModel } from '../model/OBMSBranchesModel';
import { OBMSBanksModel } from '../model/OBMSBanksModel';
import { ChangePasswordRequest } from '../model/ChangePasswordRequest';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  apiUrl: string = environment.baseUrl;
  //apiUrl: string = "https://localhost:7296/";

  user!: UserRegistration;

  constructor(private httpClient: HttpClient) {
  }

  addUser(userDetails: UserRegistration): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'Register/UserRegistration',
      JSON.stringify(userDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  loginUser(userLoginDetails: LoginModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'Register/LoginUser',
      JSON.stringify(userLoginDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  changePassword(passwordDetails: ChangePasswordRequest): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'Register/changepassword', JSON.stringify(passwordDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  getLocalUser(): UserRegistration {
    if (!this.user) {
      this.user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    }
    return this.user;
  }

  // Get all users
  getUsers(): Observable<any> {
    return this.httpClient.get<UserRegistration[]>(this.apiUrl + 'register/GetObmsusers');
  }
  // Get user by ID
  getUserById(userId: string): Observable<UserRegistration> {
    const params = { params: new HttpParams({ fromString: "?userId=" + userId }) };
    return this.httpClient.get<UserRegistration>(this.apiUrl + 'register/GetObmsuserById', params);
  }

  // Get user by ID
  getUserByName(userName: string): Observable<UserRegistration> {
    const params = { params: new HttpParams({ fromString: "?userName=" + userName }) };
    return this.httpClient.get<UserRegistration>(this.apiUrl + 'register/GetObmsuserByName', params);
  }
  // Delete user by ID  
  deleteUser(userId: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}register/DeleteObmsuser?userId=${userId}`,
      null
    );
  }

  getBankList(): Observable<any> {
    return this.httpClient.get<UserRegistration[]>(this.apiUrl + 'register/GetBankList');
  }
  getUserBankList(user: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?user=" + user }) };
    return this.httpClient.get<any>(this.apiUrl + 'register/GetUserBankList', params)
      .pipe(catchError(this.errorHandle));
  }
  GetBankListById(Id: number): Observable<BankListModel> {
    const params = { params: new HttpParams({ fromString: "?Id=" + Id }) };
    return this.httpClient.get<BankListModel>(this.apiUrl + 'register/GetBankListById', params);
  }
  saveAndUpdateBankDetails(bankDetails: any): Observable<any> {
    return this.httpClient.post<BankListModel[]>(this.apiUrl + 'Register/saveAndUpdateBankDetails',
      JSON.stringify(bankDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteBank(Id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}register/DeleteBank?Id=${Id}`,
      null
    );
  }
  getBankMasterList(): Observable<any> {
    return this.httpClient.get<BankMasterModel[]>(this.apiUrl + 'register/GetBankMasterList');
  }
  getUserBankMaster(user: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?user=" + user }) };
    return this.httpClient.get<any>(this.apiUrl + 'register/GetUserBankMaster', params)
      .pipe(catchError(this.errorHandle));
  }
  getBankMasterById(Id: number): Observable<BankMasterModel> {
    const params = { params: new HttpParams({ fromString: "?Id=" + Id }) };
    return this.httpClient.get<BankMasterModel>(this.apiUrl + 'register/GetBankMasterById', params);
  }
  saveAndUpdateBankMasterDetails(bankMasterDetails: BankMasterModel): Observable<any> {
    return this.httpClient.post<BankListModel[]>(this.apiUrl + 'Register/saveAndUpdateBankMasterDetails',
      JSON.stringify(bankMasterDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteBankMaster(Id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}register/DeleteBankMaster?Id=${Id}`,
      null
    );
  }
  getBankPrefixNoByBankID(BankCode: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?BankCode=" + BankCode }) };
    return this.httpClient.get<string>(this.apiUrl + 'register/GetBankPrefixNoByBankID', params);
  }

  getChequeList(): Observable<any> {
    return this.httpClient.get<ChequeMaster[]>(this.apiUrl + 'register/GetChequeList');
  }
  getUserChequeList(user: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?user=" + user }) };
    return this.httpClient.get<any>(this.apiUrl + 'register/GetUserChequeList', params)
      .pipe(catchError(this.errorHandle));
  }
  getChequeListById(Id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + Id }) };
    return this.httpClient.get<ChequeMaster>(this.apiUrl + 'register/GetChequeListById', params);
  }
  saveAndUpdateChequeMasterDetails(chequeMasterDetails: ChequeMaster): Observable<any> {
    return this.httpClient.post<ChequeMaster[]>(this.apiUrl + 'Register/saveAndUpdateChequeMasterDetails',
      JSON.stringify(chequeMasterDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteChequeMaster(Id: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}register/DeleteChequeMaster?Id=${Id}`,
      null
    );
  }
  getScreensByCategory(categoryName: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?categoryName=" + categoryName }) };
    return this.httpClient.get<any>(this.apiUrl + 'register/GetScreensByCategory', params);
  }
  getPermissionsWithScreens(categoryName: string, userName: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'register/GetPermissionsWithScreens', {
      params: { categoryName: categoryName, userName: userName }
    });
  }
  saveAndUpdateObmsPermissions(obmsDetails: OBMSPermissions[]): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'register/SaveAndUpdateObmsPermissions',
      JSON.stringify(obmsDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  getObmsBranchesPermission(): Observable<any> {
    return this.httpClient.get<OBMSBranchesModel[]>(this.apiUrl + 'register/GetObmsBranchesPermission'
    ).pipe(catchError(this.errorHandle));
  }
  getObmsBranchesPermissionByUser(userName: string): Observable<any> {
    return this.httpClient.get<OBMSBranchesModel[]>(this.apiUrl + 'register/GetObmsBranchesPermissionByUser', {
      params: { userName: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  SaveAndUpdateObmsBranches(obmsBranchDetails: OBMSBranchesModel[]): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'register/SaveAndUpdateObmsBranches',
      JSON.stringify(obmsBranchDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  getObmsBanksPermission(userName: string): Observable<any> {
    return this.httpClient.get<OBMSBranchesModel[]>(this.apiUrl + 'register/GetObmsBanksPermission', {
      params: { userName: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getObmsBankMasterPwrmission(userName: string): Observable<any> {
    return this.httpClient.get<OBMSBranchesModel[]>(this.apiUrl + 'register/GetObmsBankMasterPwrmission', {
      params: { userName: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateObmsBanks(obmsBankDetails: OBMSBanksModel[]): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'register/SaveAndUpdateObmsBanks',
      JSON.stringify(obmsBankDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  //to handle got any error from server response
  private errorHandle(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = error.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
