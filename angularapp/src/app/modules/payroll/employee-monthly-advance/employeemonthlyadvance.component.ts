import { Component, OnInit, ViewChild } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { SalaryStructure } from 'src/app/model/salaryStructure';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-employeemonthlyadvance',
  templateUrl: './employeemonthlyadvance.component.html',
  styleUrls: ['./employeemonthlyadvance.component.css']
})
export class EmployeemonthlyadvanceComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  monthlyAdvance!: EmployeeMonthlyAdvance[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['EmployeeName', 'EmployeeRole', 'ICNo', 'Bank', 'AccountNo', 'Amount', 'PaymentType', 'Particulars', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;
  year!: number;
  month!: number;

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
  //           this.getSalaryMasterList(1);
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Monthly Salary Advance'),
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
          this.getSalaryMasterList(1);
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

          // Role-based filtering
          if (this.userRole !== 'superadmin' && !this.staffAdminAccessModel?.readAccess) {
            filteredData = data.filter((emp: any) => emp.EMP_ROLE !== 'Staff');
          }

         
          

          // ✅ Assign to datasource
          this.dataSource = new MatTableDataSource<EmployeeMonthlyAdvance>(filteredData);

          // Pagination
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
  onDeleteClick(data: any): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this employee monthly advance details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          // ✅ SUPERADMIN → direct delete (skip all validations)
          if (this.userRole?.toLowerCase() === 'superadmin') {
            this._payrollService.deleteSalaryAdvance(data.ID, this.currentUser)
              .subscribe(
                (deleteResult: any) => {
                  if (deleteResult.success) {
                    this.showMessage(deleteResult.message, 'success', 'Success Message');
                    this.getSalaryMasterList(1);
                  }
                },
                (error) => this.handleErrors(error)
              );

            return;
          }
          // EXISTING LOGIC CONTINUES FOR OTHER USERS
          const advanceDate = this.formatDate(data.AdvanceDate);

          if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
            const requests = [
              this._payrollService.getSalaryAdvances(advanceDate, data.EMP_ID.toString(), '1')
            ];
            forkJoin(requests).subscribe(
              (responses: any[]) => {
                if (responses[0]?.length > 0) {
                  const response = responses[0];
                  var dateYear = new Date(response[0].AdvanceDate);
                  this.year = dateYear.getFullYear();
                  var dateMonth = new Date(response[0].AdvanceDate);
                  this.month = dateMonth.getMonth() + 1;

                  forkJoin({
                    salaryProcessed: this._payrollService.getSalaryProcessDate(response[0].EmployeeID, this.year, this.month).pipe(
                      catchError(() => of(false)) // Handle errors and fallback to false
                    )
                  }).subscribe({
                    next: ({ salaryProcessed }) => {
                      if (salaryProcessed) {
                        this.showMessage(
                          `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
                          'warning',
                          'Warning Message'
                        );
                      } else {
                        forkJoin({
                          deleteResult: this._payrollService.deleteSalaryAdvance(data.ID, this.currentUser),
                        }).subscribe(
                          ({ deleteResult }) => {
                            if (deleteResult.success == true) {
                              this.showMessage(`${deleteResult.message}`, 'success', 'Success Message')
                              this.getSalaryMasterList(1)
                            }
                          },
                          (error) => {
                            error: (error: any) => this.handleErrors(error)
                          }
                        );
                      }
                    },
                    error: (error) => this.handleErrors(error)
                  });
                }
              },
              (error) => {
                this.handleErrors(error);
              }
            );
          } else {
            this.showMessage(
              `Please select Advance Process. Data is a mandatory field.`,
              'warning',
              'Warning Message'
            );
          }
        } else {
          this.hideSpinner();
        }
      })

  }
  onEditClick(data: any): void {
    this._router.navigate(['/payroll/new-employee-monthly-advance'], { queryParams: { empid: data.EMP_ID, id: data.ID }, queryParamsHandling: 'merge' });
  }
  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
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
