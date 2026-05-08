import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EmployeeService } from '../../../service/employee.service';
import { SearchEmployeeComponent } from '../employee-master/search-employee/search-employee.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { EmployeeTransferService } from 'src/app/service/employee-transfer.service';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-history',
  templateUrl: './employee-history.component.html',
  styleUrls: ['./employee-history.component.css']
})
export class EmployeeHistoryComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  frm!: FormGroup;
  employees: any = [];
  dataSource!: MatTableDataSource<IEmployee>;
  displayedColumns: string[] = ['EMP_CODE', 'EMP_NAME', 'HasTransfered', 'TransferDate', 'EMP_ROLE', 'EMP_BRANCH_CODE', 'OldBranch'];
  branchList: any = [];
  currentUser: string = '';
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  errorMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];

  constructor(private fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog, public service: EmployeeService,
    private _dataService: DatasharingService, private _masterService: MastermoduleService, private _employeeTransfer: EmployeeTransferService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = fb.group({
      BranchCode: ['']
    });
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
  }

  ngOnInit(): void {
    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchList = [...this.filteredBranchList];
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Employee Master');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.showLoadingSpinner = true;
            forkJoin({
              branchResult: this.service.getEmployees(this.currentUser)
            }).subscribe({
              next: ({ branchResult }) => {
                this.branchList = branchResult['branchList'];
                this.filteredBranchList = [...this.branchList];

                // Example: use the first branch's code if needed
                const selectedBranch = this.branchList[0]?.branchCode;


                this._employeeTransfer.getEmployeeHistoryDetails(selectedBranch).subscribe({
                  next: employeeResult => {
                    this.dataSource = new MatTableDataSource(employeeResult);
                    this.dataSource.sort = this.sort;
                    this.dataSource.paginator = this.paginator;
                    this.hideSpinner();
                  },
                  error: err => this.handleErrors(err)
                });
              },
              error: err => {
                this.handleErrors(err)
              }
            });
            this.warningMessage = '';
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
            this.hideSpinner();

          }
        }
      }
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  branchChange(value: any) {
    this._employeeTransfer.getEmployeeHistoryDetails(value).subscribe({
      next: employeeResult => {
        this.dataSource = new MatTableDataSource(employeeResult);
        this.pageSizeOptions = [];
        const totalRows = employeeResult.length;
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptions.push(i);
        }
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptions.push(totalRows);
        }
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
      error: err => this.handleErrors(err)
    });
  }
  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString',
    listProp: 'branchList',
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

export interface IEmployee {
  EMP_CODE: string;
  EMP_NAME: string;
  HasTransfered: string;
  TransferDate: string;
  EMP_ROLE: string;
  EMP_BRANCH_CODE: string;
  OldBranch: string;
  EMPPAY_DATE_JOINED: Date;
}
