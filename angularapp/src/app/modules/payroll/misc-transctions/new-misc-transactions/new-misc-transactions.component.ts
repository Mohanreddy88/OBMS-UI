import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, forkJoin } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { MiscTransModel } from 'src/app/model/miscTransModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-misc-transactions',
  templateUrl: './new-misc-transactions.component.html',
  styleUrls: ['./new-misc-transactions.component.css']
})
export class NewMiscTransactionsComponent implements OnInit {
  miscTransForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  miscTransTitleStatus: string = 'new';
  employeeModel!: EmployeeMonthlyAdvance[];
  miscTransModel!: MiscTransModel;
  minDate = new Date();
  branchModel!: BranchModel[];
  currentUser: string = '';
  employeeListModel!: EmployeeAdvanceListModel[];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  StartPeriod!: string;
  EndPeriod!: string;

  employeeSearchSubject = new Subject<string>();
  branchSearchSubject = new Subject<string>();
  employeeSearchString: string = '';
  branchSearchString: string = '';
  filteredEmployeeList: any[] = [];
  filteredBranchList: any[] = [];
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _employeeService: EmployeeService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.miscTransForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      BranchCode: ['', [Validators.required]],
      TransDate: [this.formatDate(new Date)],
      Amount: ['', [Validators.required, twoDecimalPlacesValidator()]],
      Particulars: [''],
      EmployeeType: ['Guard'],
      TransType: ['1'],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
    });

    this.miscTransModel = {
      ID: 0,
      TransDate: new Date(),
      EmployeeID: 0,
      TransType: 0,
      Amount: 0,
      Particulars: '',
      LastUpdate: new Date(),
      LastUpdatedBy: ''
    };
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.staffAdminAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == '1') {
      this.userRole = 'admin'
    } else if (this.userRole == '2') {
      this.userRole = 'superadmin'
    } else {
      this.userRole = 'user'
    }
    // Employee search debounce
    this.employeeSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.employeeSearchString = '';
      this.employeeListModel = this.filteredEmployeeList; // reset list
    });

    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = this.filteredBranchList;
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser);
    // ... after fetching staffAdminAccessModel
    if (!this.staffAdminAccessModel.readAccess && this.miscTransForm.value.EmployeeType === 'Staff') {
      this.miscTransForm.patchValue({ EmployeeType: 'Guard' });
    }
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.miscTransTitleStatus = 'edit';
        this.getMiscTransById(params['id']);
      }
    });
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.miscTransForm.value.TransDate = this.formatDate(`${type}: ${event.value}`);
  }

  // getUserAccessRights(userName: string, screenName: string) {
  //   this.showLoadingSpinner = true;
  //   this._masterService.getUserAccessRights(userName, screenName).subscribe(
  //     (data) => {
  //       if (data != null) {
  //         this.userAccessModel.readAccess = data.Read
  //         this.userAccessModel.deleteAccess = data.Delete;
  //         this.userAccessModel.updateAccess = data.Update;
  //         this.userAccessModel.createAccess = data.Create;

  //         if (this.userAccessModel.readAccess === true) {
  //           this.warningMessage = '';
  //           this.showLoadingSpinner = false;
  //           this.getBranchMasterListByUser(this.currentUser);
  //         } else {
  //           this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                     You do not have permissions to view this page. <br>
  //                     If you feel you should have access to this page, Please contact administrator. <br>
  //                     Thank you`;
  //           this.showLoadingSpinner = false;
  //         }
  //       }

  //     },
  //     (error) => {
  //       this.handleErrors(error);
  //     }
  //   );
  // }

  getUserAccessRights(userName: string) {
    forkJoin({
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Misc Transactions'),
      staffAdminAccess: this._masterService.getUserAccessRights(userName, 'Payroll Staff Admin')
    }).subscribe({
      next: (res: any) => {

        if (res.employeeAccess) {
          this.userAccessModel = {
            readAccess: res.employeeAccess.Read,
            updateAccess: res.employeeAccess.Update,
            deleteAccess: res.employeeAccess.Delete,
            createAccess: res.employeeAccess.Create
          };
        }

        if (res.staffAdminAccess) {
          this.staffAdminAccessModel = {
            readAccess: res.staffAdminAccess.Read,
            updateAccess: res.staffAdminAccess.Update,
            deleteAccess: res.staffAdminAccess.Delete,
            createAccess: res.staffAdminAccess.Create
          };
        }

        if (this.userRole === 'superadmin' || this.userAccessModel.readAccess) {
          this.warningMessage = '';
          this.showLoadingSpinner = false;
          this.getBranchMasterListByUser(this.currentUser!);
        } else {
          this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                    You do not have permissions to view this page. <br>
                    If you feel you should have access to this page, Please contact administrator. <br>
                    Thank you`;
          this.showLoadingSpinner = false;
        }

      },
      error: (error) => {
        this.handleErrors(error);
      }
    });
  }
  getEmployeeMasterList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getMiscTransById(id: number): void {
    this.showLoadingSpinner = true;

    this._payrollService.getMiscTransById(id).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.showLoadingSpinner = false;
          return;
        }

        const record = data[0];

        this.miscTransForm.patchValue({
          ID: record.ID,
          EmployeeID: record.EmployeeID,
          TransDate: this.formatDate(record.TransDate),
          Amount: record.Amount,
          Particulars: record.Particulars,
          TransType: record.TransType == 1 ? '1' : '2',
          LastUpdate: this.formatDate(record.LastUpdate),
          LastUpdatedBy: record.LastUpdatedBy,
        });

        // ✅ Call only after EmployeeID is available
        if (record.EmployeeID) {
          this._employeeService.getEmployeeById(record.EmployeeID).subscribe({
            next: (empData) => {
              const emp = empData?.Result?.employee;
              if (emp) {
                this.miscTransForm.patchValue({
                  BranchCode: emp.EMP_BRANCH_CODE
                });
                this.onBranchSelectionChange(emp.EMP_BRANCH_CODE);
              }
            },
            error: (err) => this.handleErrors(err)
          });
        }

        this.showLoadingSpinner = false;
      },
      error: (err) => {
        this.showLoadingSpinner = false;
        this.handleErrors(err);
      }
    });
  }

  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = this.branchModel
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  radioButtonTypeSelectionChange(event: any) {
    const advanceDate = this.formatDate(this.miscTransForm.get('TransDate')?.value);
    const branchCode = this.miscTransForm.get('BranchCode')?.value;

    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(advanceDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(advanceDate)));

    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, this.miscTransForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.miscTransForm.patchValue({
        EmployeeType: 'None',
      })
    }
  }
  onBranchSelectionChange(event: any) {
    const advanceDate = this.formatDate(this.miscTransForm.get('TransDate')?.value);
    const branchCode = this.miscTransForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(advanceDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(advanceDate)));

    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN' && branchCode != '0') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, this.miscTransForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      //this.errorMessage = 'Please select advance date selection.';
      this.miscTransForm.patchValue({
        EmployeeType: 'Guard',
      });
      this.employeeListModel = [];
    }

  }
  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status).subscribe(
      (data) => {
        // Get current selected EmployeeID
        const selectedEmployeeID = this.miscTransForm.get('EmployeeID')?.value;

        this.employeeListModel = data;
        this.filteredEmployeeList = this.employeeListModel;

        // Check if the previously selected EmployeeID is still in the new list
        if (!this.employeeListModel.some(emp => emp.EMP_ID === selectedEmployeeID)) {
          this.miscTransForm.patchValue({
            EmployeeID: ''  // Reset only if the selected ID is not in the new list
          });
        }
      },
      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.miscTransModel = this.miscTransForm.value;
    this.miscTransModel.TransDate = new Date(this.formatDate(this.miscTransForm.get('TransDate')?.value))
    this.miscTransModel.LastUpdatedBy = this.currentUser;
    this._payrollService.saveAndUpdateMiscTrans(this.miscTransModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/payroll/misc-transactions']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: response.Message,
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
          width: '600px',
          customClass: {
            popup: 'swal-top-offset'
          }
        });
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  clearMiscTransDetails(): void {
    this.miscTransForm.reset();
    this.miscTransTitleStatus = 'new';
    this._router.navigate(['/payroll/new-misc-transactions']);

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
  canSaveEmployee(): boolean {

    const empType = this.miscTransForm.get('EmployeeType')?.value;

    // Superadmin always allowed
    if (this.userRole === 'superadmin') {
      return true;
    }

    // Staff employee → check staff admin access
    if (empType === 'Staff') {
      return !!(this.staffAdminAccessModel?.createAccess || this.staffAdminAccessModel?.updateAccess);
    }

    // Guard or others → check normal access
    return !!(this.userAccessModel?.createAccess || this.userAccessModel?.updateAccess);
  }
  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
