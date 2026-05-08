import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { forkJoin, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
export interface PeriodicElement {
  receipt_date: string;
  type: string;
  bank_code: string;
  bank_branch: string;
  cheque_no: string;
  amount: string;
  particulars: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { receipt_date: '14-Nov-2022', type: 'others', bank_code: 'Online fund Transfer', bank_branch: 'CIMB-OFT', cheque_no: '7235.00', amount: '	KWSP (Supplier)', particulars: '	KWSP (Supplier)' }
];
@Component({
  selector: 'app-search-receipts',
  templateUrl: './search-receipts.component.html',
  styleUrls: ['./search-receipts.component.css']
})
export class SearchReceiptsComponent implements OnInit {
  frm!: FormGroup;
  currentUser: string = '';
  branchList: any = [];
  bankList: any = [];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  searchOption: string = 'Payment Date';
  displayedColumns: string[] = ['ID', 'ReceiptDate', 'ReceiptType', 'BankCode', 'ChequeNo', 'ReceiptAmount', 'Particulars', 'action'];
  dataSource: any;
  dtReceiptDate!: string;
  accShortName: string = '';

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


  constructor(private fb: FormBuilder, public dialog: MatDialog, private service: FinanceService, private route: Router,
    private _liveAnnouncer: LiveAnnouncer,
    private _dataService: DatasharingService, private _masterService: MastermoduleService, private _financeService: FinanceService) {
    this.frm = this.fb.group({
      Branch: [''],
      search_option: ['Payment Date'],
      receipt_date: [''],
      bank: [''],
      cheque_no: [''],
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

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Receipts');
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
            this.warningMessage = '';
            forkJoin({
              branchList: this.service.GetBranchListByUserName(this.currentUser),
              bankList: this._masterService.GetBankListByUserName(this.currentUser)
            }).subscribe(

              (results: { branchList: any; bankList: any }) => {
                // Handle the responses
                this.branchList = results.branchList;
                this.bankList = results.bankList;
              },
              (error) => {
                this.handleErrors(error);
              }
            );
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;

          }
          this.hideSpinner()
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  searchOptionCahnge(event: any) {
    this.searchOption = event.value;
  }

  onSearchClick() {
    this.showLoadingSpinner = true;
    this.dtReceiptDate = this.formatDate(new Date(this.frm.value.receipt_date));
    this._financeService
      .getBoth(this.dtReceiptDate, this.frm.value.Branch, this.frm.value.bank, this.frm.value.cheque_no)
      .subscribe(
        ([dateAndBranchData, bankAndChequeData]) => {
          // Initialize an empty array for the data source
          let finalDataSource = [...dateAndBranchData];

          // Check if cheque number is provided and add bankAndChequeData
          if (this.frm.value.cheque_no && this.frm.value.cheque_no.trim() !== '') {
            finalDataSource = [...bankAndChequeData];
          }

          // Bind the filtered data to the dataSource
          this.dataSource = finalDataSource;
          this.hideSpinner();
        },
        (error) => {
          this.handleErrors(error);
        }
      );
  }

  onPrint(data: any) {
    this.getReceiptData(data.ID);
  }
  onEditClick(data: any): void {
    this.route.navigate(['/finance/receipts/new-receipt'], { queryParams: { id: data.ID }, queryParamsHandling: 'merge' });
  }

  deleteClickButton(data: any): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure you want to delete this Receipt?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          if (data.ID > 0) {
            this._financeService.deleteReceipt(data.ID, this.currentUser).subscribe({
              next: res => {
                this.showMessage(`Receipt deleted successfully.`, 'success', 'Success Message');
                this.route.navigate(['/finance/receipts/search-receipt']);
              },
              error: err => {
                this.showMessage(`Receipt Failed to delete records due to ${err}`, 'error', 'Error Message');
              }
            });
          }

        } else {
          this.hideSpinner();
        }
      });

  }

  getReceiptData(id: number): void {
    forkJoin({
      receipt: this._financeService.getReceipt(id),
      // You can add more service calls here in parallel if needed
    }).subscribe({
      next: (data) => {
        // run both calls in parallel if values exist
        const calls: any = {};

        if (data.receipt.BankID) {
          calls.bank = this._financeService.getBankShortName(data.receipt.BankID);
        }

        if (Object.keys(calls).length > 0) {
          forkJoin(calls).subscribe({
            next: (res: any) => {
              if (res.bank) {
                this.accShortName = res.bank;
              }

              this.route.navigate(
                ['/report/finance/receipt-voucher-report'],
                { queryParams: { id: id, ASN: this.accShortName }, queryParamsHandling: 'merge' }
              );
            },
            error: (err) => {
              this.showMessage(`Error loading details: ${err}`, 'error', 'Error Message');
            }
          });
        } else {
          this.hideSpinner();
        }

      },
      error: (err) => {
        this.handleErrors(err);
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
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
