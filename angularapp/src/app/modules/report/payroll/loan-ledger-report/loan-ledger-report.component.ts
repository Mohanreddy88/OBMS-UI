import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { InventoryService } from 'src/app/service/inventory.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, catchError, debounceTime, finalize, Observable, of, shareReplay, Subject, switchMap, take, tap } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-loan-ledger-report',
  templateUrl: './loan-ledger-report.component.html',
  styleUrls: ['./loan-ledger-report.component.css']
})
export class LoanLedgerReportComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;

  frm!: FormGroup;
  branchList: any = [];
  itemList: any = [];
  currentUser: string = "";
  empList: any = [];
  empListDummy: any = [];
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  userAccessModel!: UserAccessModel;
  employeeListModel!: EmployeeAdvanceListModel[];
  dtAdvanceDate!: string;
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
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);
    //let milliseconds = ('00' + d.getMilliseconds()).slice(-3);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService,
    private empService: EmployeeService, private fb: FormBuilder, private router: Router,
    private _dataService: DatasharingService, private _payrollService: PayrollModuleService) {
    this.frm = fb.group({
      Branch: [""],
      EmployeeType: ["Guard", Validators.required],
      ReportType: ["3"],
      Employee: [""],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required]
    })

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
  onBranchSelectionChange(event: any) {
    let dtAdvanceDate = new Date(this.frm.value.EndDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const peridFrom = this.formatDate(this.firstOfMonth(new Date(this.frm.get('StartDate')?.value)));
    const peridTo = this.formatDate(this.lastOfMonth(new Date(this.frm.get('StartDate')?.value)));
    const branchCode = event.value;
    if (peridFrom != null && peridFrom != 'NaN-NaN-NaN' && branchCode != ''
      && peridTo != null && peridTo != 'NaN-NaN-NaN'
    ) {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, this.frm.value.EmployeeType, peridFrom, peridTo, 'Active');
    } else {
      this.errorMessage = 'Please select advance date selection.';
      this.frm.patchValue({
        EmployeeType: 'Guard',
      })
    }
  }
  radioButtonTypeSelectionChange(event: any) {
    let dtAdvanceDate = new Date(this.frm.value.EndDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const employeeSelectedType = event.value;
    const peridFrom = this.formatDate(this.firstOfMonth(new Date(this.frm.get('StartDate')?.value)));
    const peridTo = this.formatDate(this.lastOfMonth(new Date(this.frm.get('StartDate')?.value)));
    const branchCode = this.frm.get('Branch')?.value;
    if (branchCode != null && branchCode != 'NaN-NaN-NaN' && branchCode != '' &&
      peridFrom != null && peridFrom != 'NaN-NaN-NaN' && peridTo != null && peridTo != 'NaN-NaN-NaN') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, employeeSelectedType, peridFrom, peridTo, 'Active');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.frm.patchValue({
        EmployeeType: 'Guard',
      })
    }
  }
  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status).subscribe(
      (data) => {
        this.frm.patchValue({
          EmployeeID: ''
        })
        this.employeeListModel = data;
        this.filteredEmployeeList = [...this.employeeListModel];

        this._payrollService.getIsSalaryProcessDoneForCurrentPeriod(branchCode, employeeType, this.dtAdvanceDate).subscribe(
          (salaryprocess) => {
            this.salaryProcessStatus = salaryprocess;
          });
        this._payrollService.getEmployeeAttendanceList(this.dtAdvanceDate, branchCode).subscribe(
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
  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  showDetailsReportClick() {
    if (this.frm.invalid) {
      return;
    }
    this.url = environment.baseReportUrl;
    this.url += 'Payroll/LoanLedgerReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&Branch=" + this.frm.get("Branch")?.value
    this.url += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
    this.url += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
    this.url += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
    this.url += "&Employee=" + this.frm.get("Employee")?.value
    this.url += "&AdvanceType=" + this.frm.get("ReportType")?.value
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
  showOutsatndingReportClick() {
    if (this.frm.invalid) {
      return;
    }
    this.url = environment.baseReportUrl;
    this.url += 'Payroll/LoanTotalOustandingLedger.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&Branch=" + this.frm.get("Branch")?.value
    this.url += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
    this.url += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
    this.url += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
    this.url += "&Employee=" + this.frm.get("Employee")?.value
    this.url += "&AdvanceType=" + this.frm.get("ReportType")?.value
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
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
  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  // Cache to store ongoing requests for de-duplication
  private inProgressRequests: Map<string, Observable<boolean>> = new Map();
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }

}
