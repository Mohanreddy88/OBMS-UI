import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';

@Component({
  selector: 'app-search-employee-uniform-loan',
  templateUrl: './search-employee-uniform-loan.component.html',
  styleUrls: ['./search-employee-uniform-loan.component.css']
})
export class SearchEmployeeUniformLoanComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  monthlyAdvance!: EmployeeMonthlyAdvance[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['EmployeeName', 'EmployeeRole','ICNo', 'Bank', 'AccountNo', 'Amount', 'PaymentType', 'Particulars', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _payrollService: PayrollModuleService, private _router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
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

  onAmountInput(event: any, element: any) {
    element.Amount = event.target.value;
  }

  onParticularsInput(event: any, element: any) {
    element.Particulars = event.target.value;
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
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser);
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
  //           this.getSalaryMasterList(4);
  //         } else {
  //           this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                        You do not have permissions to view this page. <br>
  //                        If you feel you should have access to this page, Please contact administrator. <br>
  //                        Thank you`;
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Employee Uniform'),
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
          this.getSalaryMasterList(4);
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
  getSalaryMasterList(transType: number): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeListBySalaryAdvance(transType, this.currentUser).subscribe(
      (data) => {
        if (data.length > 0) {

          let filteredData = data;

          if (this.userRole !== 'superadmin' && !this.staffAdminAccessModel?.readAccess) {
            filteredData = data.filter((emp: any) => emp.EMP_ROLE !== 'Staff');
          }

          this.dataSource = new MatTableDataSource<EmployeeMonthlyAdvance>(filteredData);

          this.pageSizeOptions = [];
          const totalRows = filteredData.length;

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
  onEditClick(data: any): void {
    this._router.navigate(['/payroll/new-employee-uniform-loan'], { queryParams: { id: data.ID }, queryParamsHandling: 'merge' });
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
