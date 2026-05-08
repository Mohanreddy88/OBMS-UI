import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, catchError, debounceTime, finalize, Observable, of, shareReplay, Subject, switchMap, take, tap } from 'rxjs';

@Component({
  selector: 'app-income-tax-form',
  templateUrl: './income-tax-form.component.html',
  styleUrls: ['./income-tax-form.component.css']
})
export class IncomeTaxFormComponent implements OnInit {
  taxYears: number[] = [];
  selectedYear!: number;
  currentMonth!: number;
  currentDay!: number;
  advanceDate!: string;
  payslipForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  currentUser: string = '';
  advanceType: string = '';
  paymentType: string = '';
  employeeListModel!: EmployeeAdvanceListModel[];
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  errorMessage: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  StartPeriod!: string;
  EndPeriod!: string;
  nameList: string[] = [];
  salaryProcessStatus: boolean = false;
  temporaryEmployeeStatus$: BehaviorSubject<Map<string, boolean>> = new BehaviorSubject(new Map()); // Caches temporary employee statuses.
  employeeSearchSubject = new Subject<string>();
  branchSearchSubject = new Subject<string>();
  employeeSearchString: string = '';
  branchSearchString: string = '';
  filteredEmployeeList: any[] = [];
  filteredBranchList: any[] = [];

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _payrollService: PayrollModuleService, private router: Router) {
    this.payslipForm = this.fb.group({
      BranchCode: [''],
      EmployeeCode: [''],
      EmployeeType: ['Guard'],
      Year: ['2025'],
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    // Employee search debounce
    this.employeeSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.employeeSearchString = '';
      this.employeeListModel = [...this.filteredEmployeeList]; // reset list
    });

    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = [...this.filteredBranchList];
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    const currentYear = new Date().getFullYear();
    this.taxYears = [];

    for (let i = currentYear; i >= 2000; i--) {
      this.taxYears.push(i);
    }
    this.selectedYear = currentYear;

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Pay Slip Report');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getBranchMasterListByUser(this.currentUser);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onYearChange(event: any) {
    this.selectedYear = event.value;
  }
  onBranchSelectionChange(event: any) {
    this.currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-based month
    this.currentDay = new Date().getDate();
    this.advanceDate = this.selectedYear + '-' + this.currentMonth + '-' + this.currentDay;

    const startDate = this.selectedYear + '-01-01'; // January 1st
    const endDate = this.selectedYear + '-12-31';  // December 31st

    const advanceDate = this.advanceDate;
    const branchCode = this.payslipForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(startDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(endDate)));

    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, this.payslipForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      this.errorMessage = '';
      this.payslipForm.patchValue({
        EmployeeType: 'Guard',
      })
    }
  }
  radioButtonTypeSelectionChange(event: any) {
    this.currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-based month
    this.currentDay = new Date().getDate();
    this.advanceDate = this.selectedYear + '-' + this.currentMonth + '-' + this.currentDay;

    const startDate = this.selectedYear + '-01-01'; // January 1st
    const endDate = this.selectedYear + '-12-31';  // December 31st

    const advanceDate = this.advanceDate;
    const branchCode = this.payslipForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(startDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(endDate)));
    if (branchCode != undefined && branchCode != 'NaN-NaN-NaN' && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, event.value, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.payslipForm.patchValue({
        EmployeeType: 'FGuard',
      })
    }
  }
  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status).subscribe(
      (data) => {
        this.payslipForm.patchValue({
          EmployeeID: ''
        })
        this.employeeListModel = data;
        this.filteredEmployeeList = [...this.employeeListModel];

        this._payrollService.getIsSalaryProcessDoneForCurrentPeriod(branchCode, employeeType, this.advanceDate).subscribe(
          (salaryprocess) => {
            this.salaryProcessStatus = salaryprocess;
          });
        this._payrollService.getEmployeeAttendanceList(this.advanceDate, branchCode).subscribe(
          (nameList) => {
            this.nameList = nameList;
          });
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
        this.showLoadingSpinner = false;
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  // Function to check if EMP_CODE is in nameList
  isEmployeeInNameList(empCode: string): boolean {
    return this.nameList && this.nameList.includes(empCode);
  }

  isEmployeeProcessList(empCode: string): boolean {
    if (!this.salaryProcessStatus) {
      return false; // Return false if salary process isn't done.
    }

    let status = false;

    this.temporaryEmployeeStatus$.pipe(take(1)).subscribe((cache) => {
      if (cache.has(empCode)) {
        // If empCode is in cache, return the cached value.
        status = cache.get(empCode)!;
      } else if (this.inProgressRequests.has(empCode)) {
        // If a request is already in progress for this empCode, subscribe to it.
        this.inProgressRequests.get(empCode)!.subscribe((isTemporary) => {
          status = isTemporary;
        });
      } else {
        // Otherwise, make a new API call.
        const request$ = this._payrollService.getIsTemporaryEmployee(empCode).pipe(
          tap((isTemporary) => {
            // Update the cache with the API response.
            const updatedCache = new Map(cache);
            updatedCache.set(empCode, isTemporary);
            this.temporaryEmployeeStatus$.next(updatedCache);

            // Remove the completed request from the in-progress map.
            this.inProgressRequests.delete(empCode);
          }),
          finalize(() => {
            // Ensure cleanup in case of errors or completion.
            this.inProgressRequests.delete(empCode);
          }),
          shareReplay(1) // Ensure the same Observable is shared among all subscribers.
        );

        // Add the new request to the in-progress map.
        this.inProgressRequests.set(empCode, request$);

        // Subscribe to the API call to trigger it.
        request$.subscribe((isTemporary) => {
          status = isTemporary;
        });
      }
    });

    return status;
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'employeeSearchString' | 'branchSearchString',
    listProp: 'employeeListModel' | 'branchModel',
    filteredListProp: 'filteredEmployeeList' | 'filteredBranchList',
    keyName: string,
    subject: Subject<string>
  ) {
    const key = event.key;

    this[searchStringProp] = this[searchStringProp] || '';

    if (key.length === 1) {
      this[searchStringProp] += key.toLowerCase();
    } else if (key === 'Backspace') {
      this[searchStringProp] = this[searchStringProp].slice(0, -1);
    } else if (key === 'Escape') {
      this[searchStringProp] = '';
    }

    // Apply filter immediately
    this[listProp] = this.searchDropdown(this[searchStringProp], this[filteredListProp], keyName);

    // Trigger debounce to reset after 2s of inactivity
    subject.next(this[searchStringProp]);
  }
  // Cache to store ongoing requests for de-duplication
  private inProgressRequests: Map<string, Observable<boolean>> = new Map();
  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  generateExcelFileClick() {

  }
  getIncomeTaxReportClick(): void {
    this.url = environment.baseReportUrl;
    this.url += 'Payroll/IncomeTaxFormReport.aspx?';
    this.url += "Branch=" + this.payslipForm.get("BranchCode")?.value
    this.url += "&Period=" + this.selectedYear;
    this.url += "&EmployeeType=" + this.payslipForm.get("EmployeeType")?.value
    this.url += "&Employee=" + this.payslipForm.get("EmployeeCode")?.value
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
  getNewPayslipReportClick(): void {
    this.url = environment.baseReportUrl;
    this.url += 'Payroll/PaySlipNewReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&Branch=" + this.payslipForm.get("BranchCode")?.value
    this.url += "&Period=" + this.advanceDate;
    this.url += "&EmployeeType=" + this.payslipForm.get("EmployeeType")?.value
    this.url += "&Employee=" + this.payslipForm.get("EmployeeCode")?.value
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
