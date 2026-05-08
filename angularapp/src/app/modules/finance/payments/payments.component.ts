import { AfterViewInit, Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SearchPaymentsComponent } from './search-payments/search-payments.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { FinanceService } from "../../../service/finance.service";
import { BehaviorSubject, forkJoin } from "rxjs";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';


export interface IBranchAmount {
  ID: number;
  PaymentID: number;
  Code: string;
  Name: string;
  BName: string;
  Amount: number;
}

export interface ISupplierInvoice {
  ID: number;
  PaymentID: number;
  Code: string;
  Name: string;
  InvoiceID: string;
  InvoiceNo: string;
  Total: string;
  Amount: string;
  PaidAmount: string;
  Balance: string;
  BranchUserName: string;
  Supplier: string;
}


@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements AfterViewInit {
  frm!: FormGroup
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  bankList: any = [];
  categoryList: any = [];
  supplierList: any = [];
  payToList: any = [];
  paymentID: number = 0
  displayedColumns: string[] = ['BankName', 'Amount'];
  dataSource!: MatTableDataSource<IBranchAmount>;
  displayedColumnsSupplier: string[] = ['InvoiceNo', 'PaidAmount', 'CurrentPayment', 'Balance', 'BranchName'];
  dataSourceSupplier!: MatTableDataSource<ISupplierInvoice>;
  rows: FormArray = this.fb.array([]);
  supplierRows: FormArray = this.fb.array([]);
  otherList: any = [];
  isSupplierEnable = false;
  paymentTypeDisplay = "Cheque No.";
  checklistItems = [

    { value: 1, label: 'Commission' },
    { value: 2, label: 'Fund Transfer' },
    { value: 3, label: 'Against Budget' },

  ];
  hasInvalidPayment = false;
  catrgoryName: string = '';
  accShortName: string = '';
  lblNoOfCheques: any;
  selectedPaymentType: string = '1';
  existingPaymentType: string = '';
  existingChequeNo: string = '';
  showDataSourceTable: boolean = false;


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private _dataService: DatasharingService, private cdr: ChangeDetectorRef,
    private _masterService: MastermoduleService, private _financeService: FinanceService, private _activatedRoute: ActivatedRoute, private route: Router) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.frmInitialization();
    this.checklistItems.forEach((item) => {
      this.frm.addControl(`purposeListItem_${item.value}`, new FormControl(false));
    });

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }


  ngAfterViewInit() {
  }

  ngOnInit(): void {

    this.frm.get("Supplier")?.disable({ onlySelf: true });

    // 1️⃣ FIRST: Load master data
    this._financeService.GetPaymentMaster(this.currentUser)
      .subscribe((d: any) => {

        // ---- master data loaded ----
        this.bankList = d['banks'];
        this.categoryList = d['categories'];
        this.supplierList = d['suppliers'];
        this.otherList = d['other'];

        d['other'].forEach((x: IBranchAmount) => {
          x.Amount = 0;
          x.ID = 0;
          x.PaymentID = 0;
          this.addBranchAmount(x);
        });

        // 2️⃣ AFTER master data → get user access
        if (!this.currentUser || this.currentUser === 'null') {
          this._dataService.getUsername().subscribe(username => {
            this.currentUser = username;
            this.getUserAccessRights(this.currentUser, 'Payments');
            this.processRouteParams(); // 🔑
          });
        } else {
          this.getUserAccessRights(this.currentUser, 'Payments');
          this.processRouteParams(); // 🔑
        }
      });
  }
  private processRouteParams(): void {

    this._activatedRoute.queryParams.subscribe(params => {

      if (params['id']) {
        this.showLoadingSpinner = true;
        this.paymentID = params['id'];
        this.getPaymentData(this.paymentID);

      } else {
        this.paymentID = 0;

        if (this.bankList?.length) {
          const defaultBankId = this.bankList[0].BankId;
          this.frm.get('BankID')?.setValue(defaultBankId);
          this.bankSelectionChange(defaultBankId);
        }
      }
    });
  }


  frmInitialization() {
    this.frm = this.fb.group({
      ID: [0],
      PaymentDate: ['', Validators.required],
      CreditorType: ["2"],
      Supplier: [null],
      PaymentType: ['1'],
      BankID: [''],
      ChequeNo: [''],
      cheque_status: [''],
      PaymentToD: [''],
      category_type: ['U'],
      ItemCategory: ['', Validators.required],
      PaymentTo: ['', Validators.required],
      Particulars: ['', Validators.required],
      Amount: [''],
      current_payment: [''],
      balance: [''],
      branchAmount: this.rows,
      SupplierInvoice: this.supplierRows
    });

  }
  getPaymentData(id: number) {
    forkJoin({
      branchPayment: this._financeService.getBranchPayment(id)
    }).subscribe({
      next: (results) => {
        const branchPayment = results.branchPayment;
        this.frm.patchValue({
          ID: branchPayment.ID,
          PaymentDate: branchPayment.PaymentDate,
          CreditorType: branchPayment.CreditorType?.toString() || '',
          Supplier: branchPayment.Supplier,
          PaymentType: branchPayment.PaymentType?.toString() || '',
          BankID: branchPayment.BankID,
          ChequeNo: branchPayment.ChequeNo,
          cheque_status: branchPayment.ChequeStatus,
          PaymentToD: branchPayment.PaymentTo,
          category_type: 'U',
          ItemCategory: branchPayment.ItemCategory,
          PaymentTo: branchPayment.PaymentTo,
          Particulars: branchPayment.Particulars,
          Amount: branchPayment.Amount
        });

        if (branchPayment.Supplier) {
          this.supplierChange(branchPayment.Supplier);
        }
        if (branchPayment.ItemCategory) {
          this.GetPaymentMasterCategoryTypeChangePayTo(branchPayment.ItemCategory);
        }
        if (branchPayment.BankID) {
          this.frm.get('BankID')?.setValue(branchPayment.BankID);
          this.bankSelectionChange(branchPayment.BankID);
        }
        if (branchPayment.CreditorType) {
          this.creditorChange(branchPayment.CreditorType?.toString());
        }
        if (branchPayment.PaymentType) {
          this.paymentTypeChange(branchPayment.PaymentType?.toString());
        }

        this.existingPaymentType = branchPayment.PaymentType?.toString();
        this.existingChequeNo = branchPayment.ChequeNo;

        this.hideSpinner(); // Stop loading spinner after all updates
      },
      error: (err) => {
        this.showMessage(`Error loading data: ${err}`, 'error', 'Error Message');
        this.hideSpinner();
      }
    });
  }


  addBranchAmount(d?: IBranchAmount) {
    const row = this.fb.group({
      ID: [d?.ID],
      PaymentID: [d?.PaymentID],
      Code: [d && d.Code ? d.Code : null],
      Name: [d && d.Name ? d.Name : null],
      BName: [d && d.BName ? d.BName : null],
      Amount: [d && d.Amount ? d.Amount : null]
    });

    this.rows.push(row);

  }

  addSupplierInvoiceAmount(d?: ISupplierInvoice) {
    // Parse values and fix 2 decimals
    const total = d?.Total != null ? Number(Number(d.Total).toFixed(2)) : null;
    const paid = d?.PaidAmount != null ? Number(Number(d.PaidAmount).toFixed(2)) : null;
    const amount = d?.Amount != null ? Number(Number(d.Amount).toFixed(2)) : null;

    const balance =
      total !== null && paid !== null
        ? Number((total - paid).toFixed(2))
        : null;

    const row = this.fb.group({
      ID: [d?.ID],
      PaymentID: [d?.PaymentID],
      Code: [d?.Code ?? null],
      Name: [d?.Name ?? null],
      InvoiceID: [d?.InvoiceID ?? null],
      InvoiceNo: [d?.InvoiceNo ?? null],
      Total: [total],
      Amount: [this.paymentID === 0 ? null : amount],
      PaidAmount: [paid],
      BranchUserName: [d?.BranchUserName ?? null],
      Balance: [balance],
      Supplier: [d?.Supplier ?? null]
    });

    this.supplierRows.push(row);
  }

  searchPayment() {
    const dialogRef = this.dialog.open(SearchPaymentsComponent, {
      disableClose: true,
      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
      //  position: { right: '0'}
    });
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
  branchAmountTable() {
    const dataSource = new BehaviorSubject<AbstractControl[]>([]);
    let d = this.frm.get('branchAmount') as FormArray;
    dataSource.next(d.controls);
    return dataSource;
  }

  supplierInvoiceTable() {
    const dataSource = new BehaviorSubject<AbstractControl[]>([]);
    let d = this.frm.get('SupplierInvoice') as FormArray;
    dataSource.next(d.controls);
    return dataSource;
  }

  creditorChange(value: any) {

    this.isSupplierEnable = value == 1;
    this.frm.get("PaymentToD")?.setValue("");
    this.frm.get("PaymentTo")?.setValue("");
    if (value == 1) {
      this.frm.get("Supplier")?.enable({ onlySelf: true });

    } else {
      this.frm.get("Supplier")?.setValue("");
      this.frm.get("Supplier")?.disable({ onlySelf: true });
    }
  }

  onSubmit() {
    let data = this.frm.getRawValue();
    if (this.frm.invalid) {
      return;
    }
    if (this.frm.get('PaymentType')?.value == '1') {
      if (this.frm.get('ChequeNo')?.value == '' && this.frm.get('ChequeNo')?.value == undefined) {
        this.showMessage(`Please enter cheque no.`, 'warning', 'Warning Message')
        return;
      }
    }
    if (this.frm.get('PaymentType')?.value == '2') {
      if (this.frm.get('ChequeNo')?.value == '' && this.frm.get('ChequeNo')?.value == undefined) {
        this.showMessage(`Please enter Voucher no.`, 'warning', 'Warning Message')
        return;
      }
    }
    if (this.frm.get('PaymentType')?.value == '3') {
      this.frm.patchValue({
        ChequeNo: 'Contra'
      })
      data['BankID'] = 0;
    }
    if (this.frm.get('PaymentType')?.value == '4') {
      this.frm.patchValue({
        ChequeNo: 'OFT'
      })
    }
    this.showLoadingSpinner = true;

    data['BankID'] = data['BankID'] != '' ? data['BankID'] : 0;
    if (data['BankID'] == 0) {
      this.accShortName = 'Contra';
    }

    if (!data['details']) {
      data['details'] = [];
    }
    let totalAmount = 0;
    if (this.frm.get("CreditorType")?.value == "2") {
      if (data['branchAmount'].length > 0) {
        data['branchAmount'].forEach((d: any) => {
          if (d['Amount'] != null || d['Amount'] != "0") {
            d['Amount'] = Number(d['Amount']);
            d['Branch'] = d['Code'];
            //data['details'].push(d);
            data['details'].push({
              ...d,
              ID: d['ID'] ? Number(d['ID']) : 0,
            });
            totalAmount = totalAmount + Number(d['Amount']);
          }
        })
      }
    } else {
      if (data['SupplierInvoice'].length > 0) {
        data['SupplierInvoice'].forEach((d: any) => {
          if (d['Amount'] != null || d['Amount'] != "0") {
            d['Amount'] = Number(d['Amount']);
            d['Branch'] = d['Code'];
            //data['details'].push(d);
            data['details'].push({
              ...d,
              ID: d['ID'] ? Number(d['ID']) : 0,
              PaymentID: d['PaymentID'] ? Number(d['PaymentID']) : 0,
            });
            totalAmount = totalAmount + Number(d['Amount']);
          }
        })
      }
    }

    data['Amount'] = Number(totalAmount);
    if (!(Number(data['Amount']) > 0)) {
      this.showMessage('Current payment must be greater than zero', 'warning', 'Warning Message');
      return;
    }
    data['PaymentDate'] = this.returnDate(this.frm.get('PaymentDate')?.value);
    let total = 0;
    this.checklistItems.forEach((item) => {
      const formControl = this.frm.get(`purposeListItem_${item.value}`);

      if (formControl && formControl.value) {
        total += Math.pow(2, item.value);
      }
    });
    data['PaymentPurpose'] = total;
    data['userId'] = this.currentUser;

    // this._financeService.saveAndUpdatePayment(data).subscribe((d: any) => {
    //   this.showMessage("Payment Saved/Updated Successfully", 'success', 'Success Message');
    //   this.frm.reset();
    //   this.route.navigate(['/report/finance/print-voucher-report'], { queryParams: { Category: this.catrgoryName, ASN: this.accShortName }, queryParamsHandling: 'merge' });
    //   //this.route.navigate(['/finance/search-payments']);
    // })

    this._financeService.saveAndUpdatePayment(data).subscribe({
      next: (response: any) => {
        console.log('Response from API:', response);

        if (response && response.PaymentID) {
          const paymentId = response.PaymentID;

          this.showMessage("Payment Saved/Updated Successfully", 'success', 'Success Message');
          if (this.paymentID > 0) {
            this.route.navigate(['/report/finance/print-voucher-report'], { queryParams: { Category: this.catrgoryName, ASN: this.accShortName }, queryParamsHandling: 'merge' });
          } else {
            this.route.navigate(['/report/finance/print-voucher-report'], { queryParams: { id: paymentId, Category: this.catrgoryName, ASN: this.accShortName }, queryParamsHandling: 'merge' });
          }
          this.frm.reset();
        }
      },
      error: (err) => {
        this.showMessage('Error saving payment', 'error', 'Error Message');
      }
    });

  }

  onPrint() {
    this.route.navigate(['/report/finance/print-voucher-report'], { queryParams: { Category: this.catrgoryName, ASN: this.accShortName }, queryParamsHandling: 'merge' });
  }

  deleteClickButton(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure you want to delete this payment?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._financeService.deletePayment(this.paymentID, this.currentUser).subscribe({
            next: res => {
              this.showMessage(`Payment deleted successfully.`, 'success', 'Success Message');
            },
            error: err => {
              this.showMessage(`Payment Failed to delete records due to ${err}`, 'error', 'Error Message');
            }
          });

        } else {
          this.hideSpinner();
        }
      });

  }

  cancelButtonClick() {
    this.frmInitialization();
    this.catrgoryName = '';
    this.accShortName = '';
    this.paymentID = 0;
    this.route.navigate(['/finance/payments']);
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

  categoryChange(value: any) {
    this.frm.get("pay_to")?.setValue("");
    this._financeService.GetPaymentMasterCategoryType(value).subscribe((d: any) => {
      this.categoryList = d;
    })
  }

  GetPaymentMasterCategoryTypeChangePayTo(value: any) {
    this._financeService.GetPaymentMasterCategoryTypeChangePayTo(value).subscribe((d: any) => {
      this.payToList = d;

      // ✅ Find and extract the selected category name
      const selected = this.categoryList.find((item: any) => item.ID == value);
      if (selected) {
        this.catrgoryName = selected.Name;
      }
    })
  }

  bankSelectionChange(value: any): void {
    // Get bank short name
    this._financeService.getBankShortName(value).subscribe({
      next: (response: any) => {
        this.accShortName = response;
      },
      error: (error) => this.handleErrors(error)
    });

    const paymentType = this.frm.get('PaymentType')?.value;

    if (paymentType === '1') {
      // Get next cheque number
      this._financeService.getNextChequeNumber(value).subscribe({
        next: (chequeNo: any) => {
          if (chequeNo !== null && chequeNo !== undefined) {
            const finalChequeNo = chequeNo.toString();
            this.frm.patchValue({ ChequeNo: finalChequeNo });
            // If cheque number is not zero, get number of cheques
            if (finalChequeNo != 0) {
              this._financeService.getNoOfCheques(value).subscribe({
                next: (lblchequeNo: any) => {
                  this.lblNoOfCheques = lblchequeNo;
                },
                error: (error) => this.handleErrors(error)
              });
            }
          }
        },
        error: (error) => this.handleErrors(error)
      });
    } else if (paymentType === '4' || paymentType === '5') {
      this.frm.patchValue({ ChequeNo: '' });
      this.lblNoOfCheques = '';
    }
  }


  paymentTypeChange(value: any) {
    this.selectedPaymentType = value;
    if (this.existingPaymentType == value) {
      this.frm.patchValue({ ChequeNo: this.existingChequeNo || '' });
    } else {
      this.frm.patchValue({ ChequeNo: '' });
    }
    if (value == 1) {
      this.paymentTypeDisplay = "Cheque No.";
    } else if (value == 2) {
      this.lblNoOfCheques = '';
      this.paymentTypeDisplay = "Voucher No.";
    } else if (value == 3) {
      this.lblNoOfCheques = '';
      this.paymentTypeDisplay = "Contra.";
    } else if (value == 4) {
      this.paymentTypeDisplay = "Account No.";
    }

  }

  // supplierChange(value: any) {
  //   this.supplierRows.clear();
  //   const paymentId = this.paymentID > 0 ? this.paymentID : 0;
  //   if(paymentId > 0){
  //      this._financeService.getCreditorInvoicePaymentList(this.currentUser, paymentId).subscribe((d: any) => {
  //     if (d?.length > 0) {
  //       this.showDataSourceTable = true;
  //     } else {
  //       this.showDataSourceTable = false;
  //     }
  //     d.forEach((d: ISupplierInvoice) => {
  //       // d.Amount = "0";
  //       // d.ID = 0;
  //       // d.PaymentID = 0;
  //       this.addSupplierInvoiceAmount(d);
  //     });

  //     // ✅ Set PaymentToD *after* invoices are loaded
  //     const selectedSupplier = this.supplierList.find((x: any) => x.Id == value);
  //     if (selectedSupplier) {
  //       this.frm.get("PaymentTo")?.setValue(selectedSupplier.Name);
  //       this.frm.get("PaymentToD")?.setValue(selectedSupplier.Name);
  //       this.frm.get("PaymentToD")?.disable({ onlySelf: true });
  //     }
  //   });
  //   }else{


  //   // this._financeService.GetPaymentSupplierInvoices(value, this.currentUser).subscribe((d: any) => {
  //   // this._financeService.getCreditorInvoicePaymentList(this.currentUser, paymentId).subscribe((d: any) => {
  //    this._financeService.getCreditorInvoicePaymentListBySupplier(this.currentUser, paymentId,value).subscribe((d: any) => {
  //     if (d?.length > 0) {
  //       this.showDataSourceTable = true;
  //     } else {
  //       this.showDataSourceTable = false;
  //     }
  //     d.forEach((d: ISupplierInvoice) => {
  //       // d.Amount = "0";
  //       // d.ID = 0;
  //       // d.PaymentID = 0;
  //       this.addSupplierInvoiceAmount(d);
  //     });

  //     // ✅ Set PaymentToD *after* invoices are loaded
  //     const selectedSupplier = this.supplierList.find((x: any) => x.Id == value);
  //     if (selectedSupplier) {
  //       this.frm.get("PaymentTo")?.setValue(selectedSupplier.Name);
  //       this.frm.get("PaymentToD")?.setValue(selectedSupplier.Name);
  //       this.frm.get("PaymentToD")?.disable({ onlySelf: true });
  //     }
  //   });
  //   }
  // }

  supplierChange(value: any) {
    this.supplierRows.clear();

    const paymentId = this.paymentID > 0 ? this.paymentID : 0;

    let apiCall$;

    if (paymentId > 0) {
       apiCall$ = this._financeService.getCreditorInvoicePaymentList(this.currentUser, paymentId);
      //apiCall$ = this._financeService.getCreditorInvoicePaymentListBySupplier(this.currentUser, paymentId, value);
    } else {
      // this._financeService.GetPaymentSupplierInvoices(value, this.currentUser).subscribe((d: any) => {
      // this._financeService.getCreditorInvoicePaymentList(this.currentUser, paymentId).subscribe((d: any) => {
      apiCall$ = this._financeService.getCreditorInvoicePaymentListBySupplier(this.currentUser, paymentId, value);
    }

    apiCall$.subscribe((d: any) => {
      if (d?.length > 0) {
        this.showDataSourceTable = true;
      } else {
        this.showDataSourceTable = false;
      }

      d.forEach((d: ISupplierInvoice) => {
        // d.Amount = "0";
        // d.ID = 0;
        // d.PaymentID = 0;
        this.addSupplierInvoiceAmount(d);
      });

      // ✅ Set PaymentToD *after* invoices are loaded
      const selectedSupplier = this.supplierList.find((x: any) => x.Id == value);
      if (selectedSupplier) {
        this.frm.get("PaymentTo")?.setValue(selectedSupplier.Name);
        this.frm.get("PaymentToD")?.setValue(selectedSupplier.Name);
        this.frm.get("PaymentToD")?.disable({ onlySelf: true });
      }
    });
  }


  validatePayments() {
    const invoiceArray = this.frm.get('SupplierInvoice') as FormArray;

    setTimeout(() => {
      this.hasInvalidPayment = invoiceArray.controls.some(ctrl => {
        const current = +ctrl.get('Amount')?.value || 0;
        const balance = +ctrl.get('Balance')?.value || 0;
        const paidAmount = +ctrl.get('PaidAmount')?.value || 0;

        // 🔑 Take the highest of Balance or PaidAmount
        const maxAllowed = Math.max(balance, paidAmount);

        return current > maxAllowed;
      });
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

