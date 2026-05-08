import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { FinanceService } from 'src/app/service/finance.service';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { Router } from '@angular/router';

export interface PeriodicElement {
  ID: number,
  client_name: string,
  action: string,
  date_issue: string,
  reason: string,
  created_by: string,
  created_date: string,
  updated_by: string,
  updated_date: string,
}

@Component({
  selector: 'app-legal-demand-action',
  templateUrl: './legal-demand-action.component.html',
  styleUrls: ['./legal-demand-action.component.css']
})
export class LegalDemandActionComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  displayedColumns: string[] = ['client_name', 'action', 'date_issue', 'reason', 'created_by', 'created_date', 'updated_by', 'updated_date', 'actions'];
  dataSource = new MatTableDataSource<PeriodicElement>();
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  pageSizeOptions: number[] = [];

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private _financeService: FinanceService,
    private _dataService: DatasharingService, private _masterService: MastermoduleService, private route: Router) {
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
  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Legal Demand Action');
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
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
            this.showLoadingSpinner = false;
            this.loadLegalDemand('', '', '');
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

  loadLegalDemand(branch?: string, client?: string, actionTaken?: string) {
    this._financeService.getLegalDemandList(branch, client, actionTaken).subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource(data)
        this.pageSizeOptions = [];
        const totalRows = data.length;
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptions.push(i);
        }
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptions.push(totalRows);
        }
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;

      },
      error: (err) => console.error(err)
    });
  }

  deleteClickButton(id: number): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: { showRemarks: true, message: 'Are you sure you want to delete this item?' }
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean, remarks: string | null }) => {
        if (result?.confirmDialog) {
          const deletionRemarks = result.remarks ?? '';

          this._financeService.deleteLegalDemand(id, this.currentUser, deletionRemarks).subscribe({
            next: res => {
              this.showMessage(`Item deleted successfully.`, 'success', 'Success Message');
              this.route.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
                this.route.navigate(['/finance/legal-demand-action']);
              });
            },
            error: err => {
              this.showMessage(`Item failed to delete due to ${err}`, 'error', 'Error Message');
            }
          });

        } else {
          this.hideLoadingSpinner();
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
      icon: icon,
      showCloseButton: false,
      timer: 5000,
      width: '600px',
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideLoadingSpinner();
    return;
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
