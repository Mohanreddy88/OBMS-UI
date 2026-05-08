import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AgreementService } from "../agreement.service";
import { DatasharingService } from "../../../service/datasharing.service";
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { IItemDetails } from './new-agreement/new-agreement.component';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { Router } from '@angular/router';

export interface IAgreement {
  ID: number,
  WorkPlace: string;
  BranchName: string;
  ClientName: string;
  AgreementDate: string;
}


@Component({
  selector: 'app-agreements',
  templateUrl: './agreements.component.html',
  styleUrls: ['./agreements.component.css']
})
export class AgreementsComponent {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  displayedColumns: string[] = ['BranchName', 'ClientName', 'WorkPlace', 'AgreementDate', 'action'];
  dataSource!: MatTableDataSource<IAgreement>;
  branchList: any;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  pageSizeOptions: number[] = [];

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, public service: AgreementService,
    private _router: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Agreement');
  }
  ngAfterViewInit() {
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getAgreements(this.currentUser, "0", true);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    // const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-01`;
  }

  getAgreements(userId: string, branchId: string, load: boolean = false) {
    this.service.getAgreements(userId, branchId, load).subscribe((d: any) => {
      if (load) {
        this.getBranchMasterListByUser(this.currentUser);
        //this.branchList = d['branches']
      }
      this.dataSource = new MatTableDataSource(d['agreements']['Result']);
      this.pageSizeOptions = [];
      const totalRows = this.dataSource.data.length;
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.hideSpinner();
    })
  }

  changeBranch(value: any) {
    this.getAgreements(this.currentUser, value);
  }

  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchList = data
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  deleteRow(row: any) {
    this.showLoadingSpinner = true;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this agreement?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          if (row.ID != 0) {
            this.service.deleteAgreementById(row.ID + "", this.currentUser).subscribe((d: any) => {
              //this.getAgreements(this.currentUser, "0", true);
              this.showMessage('Successfully deleted Agreement', 'success', 'Success Message')
              this._router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
                this._router.navigate(['/quotation-and-agreement/agreements']);
              });
            })
          } else {
            this.hideSpinner();
          }
        } else {
          this.hideSpinner();
        }
      });

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
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }

}
