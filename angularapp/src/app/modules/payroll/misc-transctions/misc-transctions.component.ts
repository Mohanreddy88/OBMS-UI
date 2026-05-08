import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MiscTransModel } from 'src/app/model/miscTransModel';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { BranchModel } from 'src/app/model/branchModel';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-misc-transctions',
  templateUrl: './misc-transctions.component.html',
  styleUrls: ['./misc-transctions.component.css']
})
export class MiscTransctionsComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  frm!: FormGroup;
  miscTrans!: MiscTransModel[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['TransDate', 'TransType', 'Amount', 'Particulars', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];
  branchModel!: BranchModel[];
  employeeListModel!: EmployeeAdvanceListModel[];
  dtAdvanceDate!: string;
  StartPeriod!: string;
  EndPeriod!: string;
  employeeId: number = 0;

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
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);
    //let milliseconds = ('00' + d.getMilliseconds()).slice(-3);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  constructor(private fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _payrollService: PayrollModuleService, private _router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.frm = this.fb.group({
      AdvanceDate: [],
      BranchCode: [0],
      EmployeeID: [0],
      EmployeeType: ['Guard']
    });
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
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  ngAfterViewInit() {
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
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
    if (!this.staffAdminAccessModel.readAccess && this.frm.value.EmployeeType === 'Staff') {
      this.frm.patchValue({ EmployeeType: 'Guard' });
    }
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

  //         if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
  //           this.warningMessage = '';
  //           this.getMiscTransList();
  //           this.getBranchMasterListByUser(this.currentUser!);
  //         } else {
  //           this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                     You do not have permissions to view this page. <br>
  //                     If you feel you should have access to this page, Please contact administrator. <br>
  //                     Thank you`;
  //           this.hideSpinner();
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
          this.hideSpinner();
          this.getMiscTransList();
          this.getBranchMasterListByUser(this.currentUser!);
        } else {
          this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                  You do not have permissions to view this page. <br>
                  If you feel you should have access to this page, Please contact administrator. <br>
                  Thank you`;
          this.hideSpinner();
        }

      },
      error: (error) => {
        this.handleErrors(error);
      }
    });
  }

  getMiscTransList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getMiscTransList(this.currentUser).subscribe(
      (data) => {
        if (data.length > 0) {
          this.dataSource = new MatTableDataSource<MiscTransModel>(data);
          this.pageSizeOptions = [];
          const totalRows = data.length;
          for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
            this.pageSizeOptions.push(i);
          }
          if (totalRows > 0 && totalRows < 10) {
            this.pageSizeOptions.push(totalRows);
          }
          this.ngAfterViewInit();
        } else {
          this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
        }
        this.hideSpinner();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getBranchMasterListByUser(userName: string) {
    forkJoin({
      branchList: this._masterService.GetBranchListByUserName(userName)
    }).subscribe(
      ({ branchList }) => {
        this.branchModel = branchList;
        this.filteredBranchList = this.branchModel;
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.frm.patchValue({
      AdvanceDate: this.formatDate(`${type}: ${event.value}`)
    });
    this.onEmployeeChange(this.employeeId);
  }

  onBranchSelectionChange(event: any) {
    this.warningMessage = '';
    if (event.value != 0) {
      this.showLoadingSpinner = true;

      let dtAdvanceDate = new Date();
      if (this.frm.value.AdvanceDate == null || this.frm.value.AdvanceDate == '' || this.frm.value.AdvanceDate == undefined) {
        dtAdvanceDate = new Date();
      } else {
        dtAdvanceDate = new Date(this.frm.value.AdvanceDate)
      }

      this.dtAdvanceDate = this.formatDate(
        new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
      );

      // this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.frm.get('AdvanceDate')?.value)));
      // this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.frm.get('AdvanceDate')?.value)));

      this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(dtAdvanceDate)));
      this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(dtAdvanceDate)));

      if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && event.value != '') {
        this.errorMessage = '';
        this.getEmployeeListByEmployeeType(event.value, this.frm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
        setTimeout(() => {
          this.hideSpinner();
        }, 200);
      } else {
        this.errorMessage = 'Please select advance date selection.';
        setTimeout(() => {
          this.hideSpinner();
        }, 200);
      }
    } else {
      this.employeeListModel = [];
      this.dataSource = new MatTableDataSource<MiscTransModel>([]);
      this.ngAfterViewInit();
    }
  }
  onEmployeeChange(empID: any) {
    if (empID > 0) {
      this.employeeId = empID;
      let dtAdvanceDate = new Date();
      if (this.frm.value.AdvanceDate == null || this.frm.value.AdvanceDate == '' || this.frm.value.AdvanceDate == undefined) {
        dtAdvanceDate = new Date();
      } else {
        dtAdvanceDate = new Date(this.frm.value.AdvanceDate)
      }
      this.dtAdvanceDate = this.formatDate(
        new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
      );
      if (this.dtAdvanceDate == null && this.dtAdvanceDate == '' && this.dtAdvanceDate == undefined) {
        this.dtAdvanceDate = this.formatDate(new Date())
      }
      forkJoin({
        miscTrans: this._payrollService.getMiscTransListByEmployee(this.dtAdvanceDate, empID)
      }).subscribe({
        next: (res) => {
          this.warningMessage = '';
          this.pageSizeOptions = [];
          var data = res.miscTrans;
          if (data.length > 0) {
            this.dataSource = new MatTableDataSource(data);
            const totalRows = data.length;
            for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
              this.pageSizeOptions.push(i);
            }
            if (totalRows > 0 && totalRows < 10) {
              this.pageSizeOptions.push(totalRows);
            }
            this.ngAfterViewInit();
          } else {
            this.warningMessage = 'No data is available for this employee';
            this.dataSource = new MatTableDataSource<MiscTransModel>([]);
            this.ngAfterViewInit();
          }
        },
        error: (err) => {
          console.error('Error loading data', err);
        }
      });
    } else {
      this.employeeId = 0;
      this.dataSource = new MatTableDataSource<MiscTransModel>([]);
      this.ngAfterViewInit();
    }
  }

  radioButtonTypeSelectionChange(event: any) {
    this.warningMessage = '';
    let dtAdvanceDate = new Date();
    if (this.frm.value.AdvanceDate == null || this.frm.value.AdvanceDate == '' || this.frm.value.AdvanceDate == undefined) {
      dtAdvanceDate = new Date();
    } else {
      dtAdvanceDate = new Date(this.frm.value.AdvanceDate)
    }
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    if (this.dtAdvanceDate == null && this.dtAdvanceDate == '' && this.dtAdvanceDate == undefined) {
      this.dtAdvanceDate = this.formatDate(new Date())
    }
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(dtAdvanceDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(dtAdvanceDate)));

    let branchCode = this.frm.get('BranchCode')?.value;

    if (branchCode != null && branchCode != 'NaN-NaN-NaN' && branchCode != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(branchCode, event.value, this.StartPeriod, this.EndPeriod, 'Active');

    } else {
      this.errorMessage = 'Please select trans date and branch selection.';
    }
  }
  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this.errorMessage = '';
    this.showLoadingSpinner = true;
    forkJoin({
      employeeList: this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status),
      salaryProcessStatus: this._payrollService.getIsSalaryProcessDoneForCurrentPeriod(branchCode, employeeType, this.dtAdvanceDate),
      nameList: this._payrollService.getEmployeeAttendanceList(this.dtAdvanceDate, branchCode)
    }).subscribe(
      ({ employeeList, salaryProcessStatus, nameList }) => {
        // Handle successful response
        this.employeeListModel = employeeList;
        this.filteredEmployeeList = this.employeeListModel;
        this.dataSource = new MatTableDataSource<MiscTransModel>([]);
        this.ngAfterViewInit();
        this.hideSpinner();
      },
      (error) => this.handleErrors(error) // Handle errors
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/payroll/new-misc-transactions'], { queryParams: { id: data.ID }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(data: any): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this misc transaction details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._payrollService.deleteMiscTrans(data.ID).subscribe((response) => {
            this.showMessage(`Successfully deleted Misc Transaction detail.`, 'success', 'Success Message')
            this.getMiscTransList();
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.hideSpinner();
        }
      })

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
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
