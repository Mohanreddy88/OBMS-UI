import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeService } from "../../../service/employee.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import Swal from 'sweetalert2';

export interface IEmployee {
  EMP_CODE: string;
  EMP_NAME: string;
  EMP_SEX: string;
  EMP_IC_NEW: string;
  EMP_IC_OLD: string;
  EMP_PASSPORT_NO: string;
  EMP_TOWN: string;
  EMPPAY_DATE_JOINED: Date;
  EMPPAY_CATEGORY: string;
  EMP_ROLE: string;
}

@Component({
  selector: 'app-employee-master',
  templateUrl: './employee-master.component.html',
  styleUrls: ['./employee-master.component.css']
})
export class EmployeeMasterComponent implements OnInit {
  employees: any = [];
  dataSource!: MatTableDataSource<IEmployee>;
  branchList: any = [];
  displayedColumns: string[] = ['EMP_CODE', 'EMP_BRANCH_CODE', 'EMP_ROLE', 'EMP_NAME', 'EMP_SEX', 'EMP_IC_NEW', 'EMP_PASSPORT_NO', 'EMP_TOWN', 'action'];
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  currentUser: string = '';
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog, public service: EmployeeService, private _dataService: DatasharingService,
    private _masterService: MastermoduleService
  ) {
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }

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
    this.getUserAccessRights(this.currentUser);
  }

  // getUserAccessRights(userName: string, screenName: string) {
  //   this._masterService.getUserAccessRights(userName, screenName).subscribe(
  //     (data) => {
  //       if (data != null) {
  //         this.userAccessModel.readAccess = data.Read
  //         this.userAccessModel.deleteAccess = data.Delete;
  //         this.userAccessModel.updateAccess = data.Update;
  //         this.userAccessModel.createAccess = data.Create;
  //         if (this.currentUser == 'superadmin') {
  //            this.getBranchMasterListByUser(this.currentUser);
  //         } else {
  //           if (this.userAccessModel.readAccess === true) {
  //              this.getBranchMasterListByUser(this.currentUser);
  //             this.warningMessage = '';
  //           } else {
  //             this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                       You do not have permissions to view this page. <br>
  //                       If you feel you should have access to this page, Please contact administrator. <br>
  //                       Thank you`;

  //           }
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Employee Master'),
      staffAdminAccess: this._masterService.getUserAccessRights(userName, 'Employee Master Staff Admin')
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
          this.getBranchMasterListByUser(this.currentUser);
          this.service.getEmployees(sessionStorage.getItem('username')!).subscribe((d: any) => {

            // map & sanitize EMP_NAME
            this.employees = d['employees'].map((e: any) => {
              const employeeData = {
                ...e.Employee,
                EMPPAY_DATE_JOINED: e.EMPPAY_DATE_JOINED,
                EMPPAY_CATEGORY: e.EMPPAY_CATEGORY
              };

              if (employeeData.EMP_NAME) {
                employeeData.EMP_NAME = employeeData.EMP_NAME.replace(/''/g, "'");
              }

              return employeeData;
            });

            //  FILTER STAFF RECORDS
            this.employees = this.filterStaffEmployees(this.employees);

            // assign cleaned data to dataSource
            this.dataSource = new MatTableDataSource(this.employees);
            this.pageSizeOptions = [];
            const totalRows = this.employees.length;
            for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
              this.pageSizeOptions.push(i);
            }
            if (totalRows > 0 && totalRows < 10) {
              this.pageSizeOptions.push(totalRows);
            }
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;

            this.setFilterPredicate();
            // optional: if you have filter/search

          });
        } else {
          this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
          You do not have permissions to view this page. <br>
          If you feel you should have access to this page, Please contact administrator. <br>
          Thank you`;
        }

      },
      error: (error) => {
        this.handleErrors(error);
      }
    });
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchList = data
        this.filteredBranchList = [...this.branchList];
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  branchChange(value: any) {
    if (value != '' && value != undefined) {
      this.service.getEmployeesByBranchId(value).subscribe((d: any) => {
        this.employees = this.filterStaffEmployees(d);
        this.dataSource = new MatTableDataSource(d);
        this.pageSizeOptions = [];
        const totalRows = d.length;
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptions.push(i);
        }
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptions.push(totalRows);
        }
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.setFilterPredicate();
      })
    } else {
      this.service.getEmployees(sessionStorage.getItem('username')!).subscribe((d: any) => {
        this.employees = d['employees'].map((e: any) => {
          return {
            ...e.Employee, // spread all employee fields
            EMPPAY_DATE_JOINED: e.EMPPAY_DATE_JOINED,
            EMPPAY_CATEGORY: e.EMPPAY_CATEGORY
          };
        });
        this.employees = this.filterStaffEmployees(this.employees);
        this.branchList = d['branchList'];
        this.filteredBranchList = [...this.branchList];
        this.dataSource = new MatTableDataSource(this.employees);
        this.pageSizeOptions = [];
        const totalRows = this.employees.length;
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptions.push(i);
        }
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptions.push(totalRows);
        }
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      })
    }

  }
  onDeleteClick(empID: number): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this employee?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this.service.deleteEmployee(empID).subscribe({
            next: (res: any) => {
              Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                title: 'Success',
                text: 'Successfully deleted employee',
                icon: 'success',
                showCloseButton: false,
                timer: 3000,
                width: '600px',
                customClass: {
                  popup: 'swal-top-offset'
                }
              });
              this.getUserAccessRights(this.currentUser);
              this.hideSpinner();
            },
            error: (err) => {
              console.error(err);
              alert('Error deleting employee');
            }
          });
        } else {
          this.hideSpinner();
        }
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
  canRead(): boolean {
    return this.isSuperAdmin() ||
      !!this.userAccessModel?.readAccess ||
      !!this.staffAdminAccessModel?.readAccess;
  }

  canDelete(): boolean {
    return this.isSuperAdmin() ||
      !!this.userAccessModel?.deleteAccess ||
      !!this.staffAdminAccessModel?.deleteAccess;
  }

  isSuperAdmin(): boolean {
    return this.userRole === 'superadmin';
  }
  private setFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const search = filter.trim().toLowerCase();

      return (
        (data.EMP_CODE || '').toLowerCase().includes(search) ||
        (data.EMP_BRANCH_CODE || '').toLowerCase().includes(search) ||
        (data.EMP_NAME || '').toLowerCase().includes(search) ||
        (data.EMP_ROLE || '').toLowerCase().includes(search) ||
        (data.EMP_IC_NEW || '').toLowerCase().includes(search) ||
        (data.EMP_PASSPORT_NO || '').toLowerCase().includes(search) ||
        (data.EMP_TOWN || '').toLowerCase().includes(search)
      );
    };
  }
  private filterStaffEmployees(list: any[]) {

    if (this.userRole === 'superadmin') {
      return list; // always show everything
    }

    if (!this.staffAdminAccessModel?.readAccess) {
      return list.filter(emp => emp.EMP_ROLE !== 'Staff');
    }

    return list;
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
