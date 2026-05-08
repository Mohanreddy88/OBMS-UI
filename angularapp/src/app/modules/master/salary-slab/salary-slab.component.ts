import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { Router } from '@angular/router';
import { SalaryStructureResponse } from 'src/app/model/salaryStructureResponse';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { SalaryStructure } from 'src/app/model/salaryStructure';
import { MatRadioChange } from '@angular/material/radio';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

@Component({
  selector: 'app-salary-slab',
  templateUrl: './salary-slab.component.html',
  styleUrls: ['./salary-slab.component.css']
})
export class SalarySlabComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  salaryModel!: SalaryStructure[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['employeeType', 'name', 'workingDays', 'workingHours', 'status', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _dataService: DatasharingService) {
    this.userAccessModel = {
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
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Salary Slab');
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
            this.getSalaryMasterList(0, 'Active');
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.showLoadingSpinner = false;
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getSalaryMasterList(id: number, status: string): void {
    this.showLoadingSpinner = true;
    this._masterService.getSalaryMaster(id, status).subscribe(
      (data) => {
        if (data.length > 0) {
          this.dataSource = new MatTableDataSource<SalaryStructure>(data);
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
  statusSelectionChanged(event: MatRadioChange) {
    this._masterService.getSalaryListByStatus(event.value).subscribe(
      (data) => {
        if (data.length > 0) {
          this.errorMessage = '';
          this.dataSource = new MatTableDataSource<SalaryStructure>(data);
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
  onEditClick(data: any): void {
    this._router.navigate(['/master/salary-slab/new-salary-slab'], { queryParams: { id: data.SalaryId, status: data.Status }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(id: number, status: string): void {
    this.showLoadingSpinner = true;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this Salary details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._masterService.deleteSalaryMasterById(id).subscribe((response) => {
            this.getSalaryMasterList(0, status);
            Swal.fire({
              toast: true,
              position: 'top',
              showConfirmButton: false,
              title: 'Success',
              text: response.Headers[0].Value,
              icon: 'success',
              showCloseButton: false,
              timer: 3000,
              width: '600px',
              customClass: {
                popup: 'swal-top-offset'
              }
            });
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.hideSpinner();
        }
      });

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = true;
    }
  }
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
