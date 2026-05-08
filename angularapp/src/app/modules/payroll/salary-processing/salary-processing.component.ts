import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { BranchModel } from 'src/app/model/branchModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { MatDateFormats } from '@angular/material/core';
import { Observable } from 'rxjs/internal/Observable';
import Swal from 'sweetalert2';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-salary-processing',
  templateUrl: './salary-processing.component.html',
  styleUrls: ['./salary-processing.component.css']
})
export class SalaryProcessingComponent implements OnInit {
  salaryProcessingForm!: FormGroup;
  errorMessage: string = '';
  currentUser: string = '';
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  bValue: boolean = false;
  bReturn: boolean = false;
  AttendanceDate!: Date;
  dtAttendanceDate!: Date;
  dateObj!: Date;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  dtSalaryProcessDate!: string;
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
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

  constructor(private fb: FormBuilder, private _masterService: MastermoduleService,
    private _dataService: DatasharingService, private _payrollService: PayrollModuleService) {
    this.salaryProcessingForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      SalaryPeriod: [''],
      BranchCode: [''],
      EmployeeType: ['None'],
      LastProcessedDate: [''],
      LastRemarks: [''],
      lockChecked: [false],
      unprocessedChecked: [false],
      Remarks: [''],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = [...this.filteredBranchList];
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Salary Processing');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true ||
            (this.currentUser.toLocaleLowerCase() == 'superadmin')) {
            this.warningMessage = '';
            this.getBranchMasterListByUser(this.currentUser);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  changeSalaryPeriod(type: string, event: MatDatepickerInputEvent<Date>) {
    this.salaryProcessingForm.value.SalaryPeriod = this.formatDate(`${type}: ${event.value}`);
    if (this.salaryProcessingForm.get('BranchCode')?.value != '' && this.salaryProcessingForm.get('BranchCode')?.value != undefined) {
      this.ShowLastProcessedDate();
      this.ShowLastRemarks();
    }
  }

  onBranchSelectionChange() {
    if (this.salaryProcessingForm.get('SalaryPeriod')?.value != '' && this.salaryProcessingForm.get('SalaryPeriod')?.value != undefined) {
      this.ShowLastProcessedDate();
      this.ShowLastRemarks();
    }
  }
  radioButtonTypeSelectionChange(event: any) {
    if (this.salaryProcessingForm.get('BranchCode')?.value != '' && this.salaryProcessingForm.get('BranchCode')?.value != undefined
      && this.salaryProcessingForm.get('SalaryPeriod')?.value != '' && this.salaryProcessingForm.get('SalaryPeriod')?.value != undefined) {
      this.ShowLastProcessedDate();
      this.ShowLastRemarks();
    }
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

  ShowLastProcessedDate() {
    const employeeType = this.salaryProcessingForm.get('EmployeeType')?.value;
    const branchCode = this.salaryProcessingForm.get('BranchCode')?.value;
    this._payrollService.getLastprocessedDate(branchCode, employeeType).subscribe(dtProcessDate => {
      const dateObj = new Date(dtProcessDate.LastProcessedDate);
      if (dateObj.getFullYear() !== 1) {
        this.salaryProcessingForm.patchValue({
          LastProcessedDate: dateObj.toLocaleString('default', { month: 'short' }) + '-' + dateObj.getFullYear()
        });
      } else {
        this.salaryProcessingForm.patchValue({
          LastProcessedDate: ''
        });
      }
    })
  }
  ShowLastRemarks() {
    let dtSalaryProcessDate = this.salaryProcessingForm.value.SalaryPeriod;
    this.dtSalaryProcessDate = this.formatDate(
      new Date(dtSalaryProcessDate.getFullYear(), dtSalaryProcessDate.getMonth() + 1, 0)
    );

    const employeeType = this.salaryProcessingForm.get('EmployeeType')?.value;
    const branchCode = this.salaryProcessingForm.get('BranchCode')?.value;
    this._payrollService.getLastSalaryProcessRemarks(this.dtSalaryProcessDate, branchCode, employeeType).subscribe(response => {
      if (response != null) {
        const remarks = response.remarks == 'null' ? '' : response.remarks;
        this.salaryProcessingForm.patchValue({
          LastRemarks: remarks,
          Remarks: ''
        });
      } else {
        this.salaryProcessingForm.patchValue({
          LastRemarks: '',
          Remarks: ''
        });
      }
    })

  }
  IsFullySalaryProcessEmployeesForLastPeriod() {

    const employeeType = this.salaryProcessingForm.get('EmployeeType')?.value;
    const branchCode = this.salaryProcessingForm.get('BranchCode')?.value;

    this._payrollService.getLastprocessedDate(branchCode, employeeType).subscribe(dtProcessDate => {
      this.dateObj = new Date(dtProcessDate.LastProcessedDate);
      if (this.dateObj.getFullYear() !== 1) {
        this.AttendanceDate = new Date(this.dateObj.getFullYear(), this.dateObj.getMonth(), new Date(this.dateObj.getFullYear(), this.dateObj.getMonth() + 1, 0).getDate());

        this.dtAttendanceDate = new Date(this.salaryProcessingForm.value.SalaryPeriod);
        if (this.dtAttendanceDate.getTime() === dtProcessDate.getTime()) {
          this.bReturn = false;
        }
      }
    })
    this._payrollService.getEmployeeAttendanceList(this.AttendanceDate.toString(), branchCode).subscribe(nameList => {
      this._payrollService.getList(branchCode, employeeType, this.formatDate(this.firstOfMonth(this.dateObj)), this.formatDate(this.firstOfMonth(this.dateObj)), this.dtAttendanceDate.toString(), 'Active').subscribe((oEmployeeList) => {
        this.bReturn = false;
        for (const employee of oEmployeeList) {
          let bValue = false;
          for (const name of nameList) {
            if (employee.Code === name) {
              bValue = true;
              break;
            }
            this._payrollService.getIsSalaryProcessDoneForCurrentPeriod(branchCode, employeeType, this.dateObj.toString()).subscribe(data => {
              if (!data) {
                this.bReturn = true;
              }
            })
            this._payrollService.getIsTemporaryEmployee(oEmployeeList.Code).subscribe(data => {
              if (!data) {
                this.bReturn = true;
              }
            })
          }
        }
      })
    })

  }
  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString',
    listProp: 'branchModel',
    filteredListProp: 'filteredBranchList',
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
  onProcessClick(): void {
    this.showLoadingSpinner = true;
    const employeeType = this.salaryProcessingForm.get('EmployeeType')?.value;
    const branchCode = this.salaryProcessingForm.get('BranchCode')?.value;
    let remarks = this.salaryProcessingForm.get('Remarks')?.value;
    const lockChecked = (this.salaryProcessingForm.get('lockChecked')?.value == null
      ? false : this.salaryProcessingForm.get('lockChecked')?.value);

    if (employeeType == 'None') {
      this.showMessage(`Please select Employee Type is mandatory fields.`, 'warning', 'Warning Message');
    } else if (remarks == '' || remarks == null) {
      this.showMessage(`Please select  Remarks is mandatory fields.`, 'warning', 'Warning Message');
    }
    else {
      remarks = this.salaryProcessingForm.get('LastRemarks')?.value + ' ' + remarks;
      // Prepare the API call in forkJoin
      forkJoin([
        this._payrollService.salaryProcess(branchCode, employeeType, remarks, this.dtSalaryProcessDate, lockChecked,
          this.currentUser, environment.CompanyCode),
      ]).subscribe(
        ([response]) => {
          const message = response?.result?.Message || 'Unknown response';

          if (message === 'Unknown response') {
            this.salaryProcessingForm.reset();
            this.showMessage(`Salary processing completed successfully.`, 'success', 'Success Message');
          } else {
            this.showMessage(`${message}`, 'warning', 'Warning Message');
          }
        },
        (error) => {
          this.handleErrors(error);
        }
      );

    }
  }

  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px',
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideSpinner();
    return;
  }
  firstOfMonth(dt: Date): Date {
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  }

  lastOfMonth(dt: Date): Date {
    return new Date(new Date(dt.getFullYear(), dt.getMonth() + 1, 1).getTime() - 1);
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showMessage(`${error}`, 'error', 'Error Message');
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
