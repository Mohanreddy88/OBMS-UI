import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cheque-status',
  templateUrl: './cheque-status.component.html',
  styleUrls: ['./cheque-status.component.css']
})
export class ChequeStatusComponent implements OnInit {
  frm!: FormGroup;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['select', 'chequeDate', 'chequeNo', 'amount', 'particulars'];
  dataSource: any;
  bankList: any = [];
  selectedIds: number[] = [];

  constructor(private _dataService: DatasharingService, private _masterService: MastermoduleService, private fb: FormBuilder,
    private _liveAnnouncer: LiveAnnouncer, private _financeService: FinanceService,private route: Router
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      ReceiptStartDate: ['', Validators.required],
      ReceiptEndDate: ['', Validators.required],
      chequeStatus: ['D'],
      transType: ['R'],
      bankName: [''],
      clearence_date: [null]
    });
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Cheque Status');
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
            this._financeService.GetPaymentMaster(this.currentUser).subscribe((d: any) => {
              this.bankList = d['banks'];
            })

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

  toggleSelection(id: number, isChecked: boolean) {
    if (isChecked) {
      this.selectedIds.push(id);
    } else {
      this.selectedIds = this.selectedIds.filter(x => x !== id);
    }
  }
  onSearchClick() {
    this.loadChequeStatuses();
  }
  loadChequeStatuses() {
    const form = this.frm.value;
    this._financeService.getChequeStatuses(
      this.returnDate(form.ReceiptStartDate),
      this.returnDate(form.ReceiptEndDate),
      form.chequeStatus,
      form.bankName,
      form.transType
    ).subscribe({
      next: (data) => {
        this.dataSource = data;
        console.log(data);
      },
      error: (err) => {
        console.error('Failed to fetch cheque statuses', err);
      }
    });
  }
  onSubmitClick() {
    const transType = this.frm.get('transType')?.value;
    const chequeStatus = this.frm.get('chequeStatus')?.value;
    const text = chequeStatus === 'D' ? 'Return' : 'Deposite'; 
    const clearence_date = this.returnDate(this.frm.get('clearence_date')?.value);

    if (this.selectedIds.length === 0) {
      this.showMessage("Please select at least one payment to restore.", 'warning', 'Warning Message');
      return;
    }
    if (chequeStatus == 'P') {
      if (clearence_date == null || clearence_date == '') {
        this.showMessage("Please select Clearence Date.", 'warning', 'Warning Message');
        return;
      }
    }   

    this._financeService.restoreChequeStatus(this.selectedIds, this.currentUser, transType, text.charAt(0), clearence_date).subscribe({
      next: () => {
        this.showMessage("Cheque Status restored Successfully", 'success', 'Success Message');
        this.selectedIds = [];
        this.frm.reset();
        this.route.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
        this.route.navigate(['/finance/cheque-status']);
      });

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
