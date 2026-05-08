import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { BranchResponseModel } from 'src/app/model/branchResponseModel';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BranchModel } from 'src/app/model/branchModel';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';


@Component({
  selector: 'app-branch-master',
  templateUrl: './branch-master.component.html',
  styleUrls: ['./branch-master.component.css']
})
export class BranchMasterComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  branchModel!: BranchModel[];
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  errorMessage: string = '';
  displayedColumns: string[] = ['code', 'ubsCode', 'name', 'address1', 'personIncharge', 'action'];
  dataSource: any;
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router
    , private _dataService: DatasharingService) {
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
    console.log(this.dataSource);
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
  ngOnInit() {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Branch Master');
  }
  getBranchMasterList() {
    this.showLoadingSpinner = true;
    this._masterService.getBranchMasterList().subscribe(
      (data) => {
        this.handleDataBinding(data);
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.handleDataBinding(data);
      },
      (error) => {
        this.handleErrors(error);
      }
    );
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

          if (this.currentUser == 'superadmin') {
            this.getBranchMasterList();
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
              this.getBranchMasterListByUser(this.currentUser);
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
              this.showLoadingSpinner = false;
            }
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  handleDataBinding(data: any) {
    if (data.length > 0) {
      this.dataSource = new MatTableDataSource<BranchModel>(data);
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

  }
  onEditClick(data: any): void {
    this._router.navigate(['/master/branch-master/new-branch'], { queryParams: { code: data.Code }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(code: string): void {
    this.showLoadingSpinner = true;
    this.branchCode = code;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this branch details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._masterService.deleteBranchMasterByCode(this.branchCode).subscribe((response) => {
            this.getBranchMasterListByUser(this.currentUser);
            this._dataService.setUsername(this.currentUser);
            Swal.fire({
              toast: true,
              position: 'top',
              showConfirmButton: false,
              title: 'Success',
              text: response.headers[0].value,
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
      this.hideSpinner();
    }
  }
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}