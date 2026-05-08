import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import Swal from 'sweetalert2';
export interface PeriodicElement {
  payment_date: string;
  creditor_type: string;
  payment_type: string;
  cheque_bank: string;
  amount: string;
  pay_to: string;
  LastUpdated_by: string;
}

@Component({
  selector: 'app-payments-recycle-bin',
  templateUrl: './payments-recycle-bin.component.html',
  styleUrls: ['./payments-recycle-bin.component.css']
})
export class PaymentsRecycleBinComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  currentUser: string = '';
  frm!: FormGroup
  displayedColumns: string[] = ['action', 'payment_date', 'creditor_type', 'payment_type', 'cheque_bank', 'pay_to', 'amount', 'LastUpdated_by'];
  dataSource: any;
  selectedIds: number[] = [];

  constructor(private fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _dataService: DatasharingService, private _masterService: MastermoduleService, private _financeService: FinanceService) {
    this.frm = this.fb.group({
      payment_date: [''],
    })
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngAfterViewInit() {

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
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Payments Recycle Bin');
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

  onSearchClick() {
    const paymentdate = this.returnDate(this.frm.get('payment_date')?.value);
    this.loadDeletedPayments(paymentdate);

  }

  loadDeletedPayments(date: string) {
    this._financeService.getDeletedPayments(date)
      .subscribe({
        next: (data) => {
          this.dataSource = data;
        },
        error: (err) => console.error('Failed to load deleted payments', err)
      });
  }
  toggleSelection(id: number, isChecked: boolean) {
    if (isChecked) {
      this.selectedIds.push(id);
    } else {
      this.selectedIds = this.selectedIds.filter(x => x !== id);
    }
  }
  restoreSelectedPayments() {
    if (this.selectedIds.length === 0) {
      this.showMessage("Please select at least one payment to restore.", 'warning', 'Warning Message');
      return;
    }

    this._financeService.restoreBranchPayments(this.selectedIds, this.currentUser).subscribe({
      next: () => {
        this.showMessage("Payments restored Successfully", 'success', 'Success Message');
        this.selectedIds = [];
        this.loadDeletedPayments(this.returnDate(this.frm.get('payment_date')?.value));
      },
      error: (err) => {
        this.showMessage(`Restore failed: ${err}`, 'error', 'Error Message');
      }
    });
  }

  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
