import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SearchReceiptsComponent } from '../search-receipts/search-receipts.component';
import { FinanceService } from "../../../../service/finance.service";
import { MatTableDataSource } from "@angular/material/table";
import { BehaviorSubject, catchError, forkJoin, from, mapTo, Observable, of, switchMap, tap } from "rxjs";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';

export interface IInvoiceAmount {
  ID: number;
  ReceiptID: number;
  InvoiceID: number;
  InvoiceNo: string;
  InvoiceAmount: number;
  InvoiceDate: string;
  PaidAmount: number;
  Branch: string;
  Client: string;
  Balance: number
}

@Component({
  selector: 'app-new-receipt',
  templateUrl: './new-receipt.component.html',
  styleUrls: ['./new-receipt.component.css']
})
export class NewReceiptComponent implements OnInit {
  frm!: FormGroup
  currentUser: string = '';
  branchList: any = [];
  bankList: any = [];
  bankInList: any = [];
  clientList: any = [];
  displayedColumns: string[] = ['Action', 'InvoiceNO', 'Amount', 'Balance', 'InvoiceDate'];
  dataSource!: MatTableDataSource<IInvoiceAmount>;
  rows: FormArray = this.fb.array([]);
  rowCheckedState: boolean[] = [];
  invoiceList: any = [];
  isAdjustment: boolean = false;
  receiptTypeID = '1';

  taxPercentage: number = 0;
  hqPercentage: number = 0;
  chequeAmount: number = 0;
  cashAmount: number = 0;
  ibgAmount: number = 0;
  taxAmount: number = 0;
  hqAmount: number = 0;
  branchAmount: number = 0;

  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  receiptID: number = 0;
  accShortName: string = '';
  showInvoiceTable = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private service: FinanceService,
    private route: Router, private _activatedRoute: ActivatedRoute, private _financeService: FinanceService,
    private _dataService: DatasharingService, private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

    let test = {
      "ID": 0,
      "VoucherNo": "string",

      "": "string",

      "InvoiceNumbers": "string",

      "ChequeStatus": "string",
      "IsDeleted": true,
      "LastUpdate": "2024-05-06T22:54:37.941Z",
      "LastUpdatedBy": "string"
    }
    this.frm = this.fb.group({
      ID: [0],
      ReceiptDate: ['', [Validators.required]],
      Branch: ['', [Validators.required]],
      PaymentFrom: ['', [Validators.required]],
      ReceiptType: ['1'],
      IsInvoiceAdjustment: [''],
      BankCode: [''],
      BankBranch: [''],
      ChequeNo: [''], // also IBG_no ReceiptType == 5
      ReceiptAmount: [0],//ChequeAmount || CashAmount
      ChequeAmount: [0, [Validators.required]],
      CashAmount: [0, [Validators.required]],
      ibgNo: [''],
      ibgAmount: [0, [Validators.required]],
      client: [''],
      total_invoice_amount: [''],
      balance_amount: [''],
      balance_status: ['1'],
      TaxPercentage: [''],
      TaxAmount: [''],
      HQPercentage: [''],
      HQAmount: [''],
      BranchCollection: [''], //oReceipts.ReceiptAmount - oReceipts.TaxAmount - oReceipts.HQAmount;
      CreditNoteAmount: [0],
      DebitNoteAmount: [0],
      SuspendAmount: [0],
      Particulars: [''],
      BankID: ['', [Validators.required]],
      branchAmount: this.rows,
    });
  }

  toggleRowCheckbox(index: number) {
    this.rowCheckedState[index] = !this.rowCheckedState[index];
    this.calculation();
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    this.getUserAccessRights(this.currentUser, 'Receipts').subscribe(() => {
      this._activatedRoute.queryParams.subscribe((params) => {
        if (params['id'] !== undefined) {
          this.getReceiptData(+params['id']);
        }
      });
    });


  }
  getReceiptData(id: number): void {
    this.receiptID = id;
    forkJoin({
      receipt: this._financeService.getReceipt(id),
      // You can add more service calls here in parallel if needed
    }).subscribe({
      next: (data) => {
        // Populate form with retrieved data
        this.frm.patchValue({
          ID: data.receipt.ID,
          ReceiptDate: data.receipt.ReceiptDate,
          Branch: data.receipt.Branch,
          PaymentFrom: data.receipt.PaymentFrom,
          ReceiptType: data?.receipt?.ReceiptType.toString(),
          IsInvoiceAdjustment: data.receipt.IsInvoiceAdjustment,
          BankCode: data.receipt.BankCode,
          BankBranch: data.receipt.BankBranch,
          ChequeNo: data.receipt.ChequeNo,
          ibgNo: data.receipt.ChequeNo,
          ReceiptAmount: data.receipt.ReceiptAmount,
          // ibgAmount: data.receipt.ReceiptAmount,
          // ChequeAmount: data.receipt.ChequeAmount,
          // CashAmount: data.receipt.CashAmount,
          total_invoice_amount: data.receipt.TotalInvoiceAmount,
          balance_amount: data.receipt.BalancealanceAmount,
          TaxPercentage: data.receipt.TaxPercentage,
          TaxAmount: data.receipt.TaxAmount,
          HQPercentage: data.receipt.HQPercentage,
          HQAmount: data.receipt.HQAmount,
          BranchCollection: data.receipt.BranchCollection, // oReceipts.ReceiptAmount - oReceipts.TaxAmount - oReceipts.HQAmount;
          CreditNoteAmount: data.receipt.CreditNoteAmount,
          DebitNoteAmount: data.receipt.DebitNoteAmount,
          SuspendAmount: data.receipt.SuspendAmount,
          Particulars: data.receipt.Particulars,
          BankID: data.receipt.BankID,
        });


        this.invoiceList = data.receipt.details;
        // // Update additional result data if needed
        if (data.receipt.ReceiptType === 5) {
          IBG_no: data.receipt.ChequeNo // Additional field for ReceiptType == 5        
        }


        this.changeAdjustment(data.receipt.IsInvoiceAdjustment);
        this.changeReceiptType(data.receipt.ReceiptType);
        this.branchChange(data.receipt.Branch);
        this.bankSelectionChange(data.receipt.BankID);
        //this.clientChange(data.receipt.client);

        if (Array.isArray(data.receipt.details)) {
          this.rows.clear();
          this.rowCheckedState = [];
          data.receipt.details.forEach((d: IInvoiceAmount) => {
            d['InvoiceDate'] = this.returnDate(d['InvoiceDate']);
            d['Balance'] = Number(d['InvoiceAmount']) - Number(d['PaidAmount'])
            this.invoiceList.push(d);
            this.updateBranchAmount(d);
            this.calculation();
          });
        }
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }


  getUserAccessRights(userName: string, screenName: string): Observable<void> {
    return this._masterService.getUserAccessRights(userName, screenName).pipe(
      switchMap((data: any) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          return this.service.GetReceiptMaster(this.currentUser).pipe(
            tap((d: any) => {
              this.branchList = d['branchList'];
              this.bankList = d['bankList'];
              this.bankInList = d['banks'];
            }),
            mapTo(undefined)
          );
        } else {
          return of(undefined);
        }
      }),
      catchError((err) => {
        this.handleErrors(err);
        return of(undefined);
      })
    );
  }

  isCheckboxDisabled(): boolean {
    const ibgAmount = +this.frm.get('ibgAmount')?.value || 0;
    const chequeAmount = +this.frm.get('ChequeAmount')?.value || 0;

    // Disable checkbox if both amounts are missing or zero
    return ibgAmount === 0 && chequeAmount === 0;
  }
  addBranchAmount(d?: IInvoiceAmount, isExisting: boolean = false) {
    const row = this.fb.group({
      ID: [d?.ID ?? null],
      InvoiceID: [d?.InvoiceID ?? null],
      InvoiceNo: [d?.InvoiceNo ?? null],
      InvoiceAmount: [d?.InvoiceAmount ?? null],
      InvoiceDate: [d?.InvoiceDate ?? null],
      PaidAmount: [d?.PaidAmount ?? null],
      Branch: [d?.Branch ?? null],
      Client: [d?.Client ?? null],
      Balance: [d?.Balance ?? null]
    });

    this.rows.push(row);
    this.rowCheckedState.push(isExisting); // true for existing, false for new
  }

  updateBranchAmount(d?: IInvoiceAmount) {
    const row = this.fb.group({
      ID: [d && d.ID ? d.ID : null],
      InvoiceID: [d && d.InvoiceID ? d.InvoiceID : null],
      InvoiceNo: [d && d.InvoiceNo ? d.InvoiceNo : null],
      InvoiceAmount: [d && d.InvoiceAmount ? d.InvoiceAmount : null],
      InvoiceDate: [d && d.InvoiceDate ? d.InvoiceDate : null],
      PaidAmount: [d && d.PaidAmount ? d.PaidAmount : null],
      Branch: [d && d.Branch ? d.Branch : null],
      Client: [d && d.Client ? d.Client : null],
      Balance: [d && d.Balance ? d.Balance : null]
    });

    this.rows.push(row);
    this.rowCheckedState.push(true);
  }
  searchReceipt() {
    const dialogRef = this.dialog.open(SearchReceiptsComponent, {
      disableClose: true,
      panelClass: ['wlt-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
      //  position: { right: '0'}
    });
  }

  branchChange(value: any) {
    this.service.GetClientByBranch(value).subscribe((d: any) => {
      this.clientList = d;
      let code = '';

      if (this.clientList && this.clientList.length > 0) {
        const client = this.clientList.find(
          (x: any) => x.Name === this.frm.get('PaymentFrom')?.value
        );
        code = client ? client.Code : '';
      }

      this.frm.patchValue({
        client: code
      });
    })
  }

  branchAmountTable() {
    const dataSource = new BehaviorSubject<AbstractControl[]>([]);
    let d = this.frm.get('branchAmount') as FormArray;
    dataSource.next(d.controls);
    return dataSource;
  }

  bankSelectionChange(value: any): void {
    // Get bank short name
    this._financeService.getBankShortName(value).subscribe({
      next: (response: any) => {
        this.accShortName = response;
      },
      error: (error) => this.handleErrors(error)
    });
  }

  clientChange(value: any) {

    // No client selected → hide table & clear data
    if (!value) {
      this.frm.patchValue({ PaymentFrom: null });

      this.rows.clear();
      this.rowCheckedState = [];
      this.invoiceList = [];
      this.showInvoiceTable = false;

      return;
    }

    this.service
      // .GetReceiptInvoiceByClient(this.frm.get('Branch')?.value, value)
      .getInvoiceDetails(this.frm.get('Branch')?.value, value, this.receiptID <= 0 ? -1 : this.receiptID)
      .subscribe((d: any[]) => {

        // Empty response → hide table
        if (!d || d.length === 0) {
          this.rows.clear();
          this.rowCheckedState = [];
          this.invoiceList = [];
          this.showInvoiceTable = false;
          return;
        }

        // Data exists → show table
        this.showInvoiceTable = true;

        const client = this.clientList.find((x: any) => x.Code === value);
        this.frm.patchValue({
          PaymentFrom: client ? client.Name : ''
        });

        this.rows.clear();
        this.rowCheckedState = [];

        d.forEach((item: any) => {
          item['InvoiceDate'] = this.returnDate(item['InvoiceDate']);
          item['Balance'] =
            Number(item['InvoiceAmount']) - Number(item['PaidAmount']);

          const exists = this.invoiceList.some(
            (existing: any) =>
              existing.InvoiceNo?.toString().trim() ===
              item.InvoiceNo?.toString().trim()
          );

          this.addBranchAmount(item, exists);

          if (!exists) {
            this.invoiceList.push(item);
          }
        });
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

  changeReceiptType(value: string): void {
    this.receiptTypeID = value;

    const amount = this.frm.get("ReceiptAmount")?.value || 0;

    this.frm.patchValue({
      ChequeAmount: 0,
      CashAmount: 0,
      ibgAmount: 0
    });

    // Use if-else in place of switch
    if (value?.toString() === '1') { // Cheque
      this.frm.patchValue({ ChequeAmount: amount });
      this.frm.get('CashAmount')?.clearValidators(); // Clear validators
      this.frm.get('ibgAmount')?.clearValidators(); // Clear validators
      this.frm.get('CashAmount')?.updateValueAndValidity();
      this.frm.get('ibgAmount')?.updateValueAndValidity();
    } else if (value?.toString() === '2') { // Cash
      this.frm.patchValue({ CashAmount: amount });
      this.frm.get('ChequeAmount')?.clearValidators(); // Clear validators
      this.frm.get('ibgAmount')?.clearValidators(); // Clear validators
      this.frm.get('ChequeAmount')?.updateValueAndValidity();
      this.frm.get('ibgAmount')?.updateValueAndValidity();
    } else if (value?.toString() === '5') { // IBG
      this.frm.patchValue({ ibgAmount: amount });
      this.frm.get('ChequeAmount')?.clearValidators(); // Clear validators
      this.frm.get('CashAmount')?.clearValidators(); // Clear validators
      this.frm.get('ChequeAmount')?.updateValueAndValidity();
      this.frm.get('CashAmount')?.updateValueAndValidity();
    }

    this.calculation();
  }

  calculation() {
    let total = 0;
    for (let i = 0; i < this.invoiceList.length; i++) {
      if (this.rowCheckedState[i]) {
        total += Number(this.invoiceList[i]['InvoiceAmount']);
      }
    }
    this.frm.get("total_invoice_amount")?.setValue(total.toFixed(2));


    let cash = 0;
    const receiptTypeID = this.receiptTypeID;

    if (receiptTypeID.toString() == "1") {
      const chequeAmount = this.frm.get("ChequeAmount")?.value;
      cash = chequeAmount ? Number(chequeAmount) : 0;
    } else if (receiptTypeID.toString() == "2") {
      const cashAmount = this.frm.get("CashAmount")?.value;
      cash = cashAmount ? cashAmount : 0;
    }
    else if (receiptTypeID.toString() == "5") {
      const cashAmount = this.frm.get("ibgAmount")?.value;
      cash = cashAmount ? cashAmount : 0;
    }
    this.frm.get("ReceiptAmount")?.setValue(cash);
    const balanceAmount = (total - cash).toFixed(2);
    this.frm.get("balance_amount")?.setValue(balanceAmount);

    // let TaxAmount = Number(this.frm.get("TaxPercentage")?.value) * Number(this.frm.get("ChequeAmount")?.value / (100+ Number(this.frm.get("TaxPercentage")?.value),10));
    // this.frm.get("TaxAmount")?.setValue(TaxAmount);

    this.calculate();
  }

  calculate() {
    this.taxPercentage = Number(this.frm.get("TaxPercentage")?.value);
    this.hqPercentage = Number(this.frm.get("HQPercentage")?.value);
    this.chequeAmount = Number(this.frm.get("ChequeAmount")?.value);
    this.cashAmount = Number(this.frm.get("CashAmount")?.value);
    this.ibgAmount = Number(this.frm.get("ibgAmount")?.value);
    this.taxAmount = Number(this.frm.get("TaxAmount")?.value);

    this.hqAmount = Number(this.frm.get("HQAmount")?.value);
    this.branchAmount = Number(this.frm.get("BranchCollection")?.value);
    const receiptTypeID = this.receiptTypeID;

    if (receiptTypeID.toString() === "1") {
      this.taxAmount = this.taxPercentage * this.chequeAmount / (100 + this.taxPercentage);
      this.hqAmount = (this.chequeAmount - this.taxAmount) * (this.hqPercentage / 100);
      this.branchAmount = this.chequeAmount - this.taxAmount - this.hqAmount;
    } else if (receiptTypeID.toString() === "2") {
      this.taxAmount = this.taxPercentage * this.cashAmount / (100 + this.taxPercentage);
      this.hqAmount = (this.cashAmount - this.taxAmount) * (this.hqPercentage / 100);
      this.branchAmount = this.cashAmount - this.taxAmount - this.hqAmount;
    } else if (receiptTypeID.toString() === "5") {
      this.taxAmount = this.taxPercentage * this.ibgAmount / (100 + this.taxPercentage);
      this.hqAmount = (this.ibgAmount - this.taxAmount) * (this.hqPercentage / 100);
      this.branchAmount = this.ibgAmount - this.taxAmount - this.hqAmount;
    }

    this.frm.get("TaxAmount")?.setValue(this.taxAmount.toFixed(2));
    this.frm.get("HQAmount")?.setValue(this.hqAmount.toFixed(2));
    this.frm.get("BranchCollection")?.setValue(this.branchAmount.toFixed(2));
  }

  dynamicCalculation() {
    const taxPercentage = this.frm.get('TaxPercentage')?.value || 0;
    const hqPercentage = this.frm.get('HQPercentage')?.value || 0;

    let baseAmount = 0;
    if (this.receiptTypeID.toString() == '1') {
      baseAmount = parseFloat(this.frm.get('ChequeAmount')?.value) || 0;
    } else if (this.receiptTypeID.toString() == '2') {
      baseAmount = parseFloat(this.frm.get('CashAmount')?.value) || 0;
    }

    if (baseAmount > 0) {
      const taxAmount = (taxPercentage * baseAmount) / (100 + Number(taxPercentage));
      this.frm.get('TaxAmount')?.setValue(this.formatCurrency(taxAmount));

      const taxAmt = this.getCurrencyValue(this.frm.get('TaxAmount')?.value);
      const hqAmount = (baseAmount - taxAmt) * (hqPercentage / 100);
      this.frm.get('HQAmount')?.setValue(this.formatCurrency(hqAmount));

      const hqAmt = this.getCurrencyValue(this.frm.get('HQAmount')?.value);
      const branchAmount = baseAmount - taxAmt - hqAmt;
      this.frm.get('BranchCollection')?.setValue(this.formatCurrency(branchAmount));
    }
  }

  formatCurrency(num: number): string {
    return Number(num).toFixed(2);
  }

  getCurrencyValue(str: any): number {
    if (typeof str === 'string') {
      return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
    }
    return Number(str) || 0;
  }
  onPrint() {
    this.route.navigate(['/report/finance/receipt-voucher-report'], { queryParams: { ASN: this.accShortName }, queryParamsHandling: 'merge' });
  }
  onSubmit() {
    let data = this.frm.getRawValue();
    if (this.frm.invalid) {
      return;
    }
    if (this.frm.get('ReceiptType')?.value == '5') {
      // if (this.frm.get('ibgNo')?.value?.length !== 18) {
      //   this.showMessage('IBG number must be 18 digit', 'warning', 'Warning Message')
      //   return;
      // }
    }
    if (this.frm.get('ReceiptType')?.value == '1') {
      const bankBranch = this.frm.get('BankBranch')?.value;
      if (this.frm.get('ChequeNo')?.value?.length !== 6) {
        this.showMessage('ChequeNo number must be 6 digit', 'warning', 'Warning Message')
        return;
      }
      if (!bankBranch) {
        this.showMessage('Bank Branch cannot be empty.', 'warning', 'Warning Message')
        return;
      }
    }

    // if (this.frm.get('ReceiptType')?.value == '5' || this.frm.get('ReceiptType')?.value == '1') {
    //   data['ReceiptAmount'] = this.frm.get('ChequeAmount')?.value;
    // }
    // else {
    //   data['ReceiptAmount'] = this.frm.get('CashAmount')?.value;
    // }

    if (this.isAdjustment == true) {
      const clientValue = this.frm.get('client')?.value;
      if (!clientValue) {
        this.showMessage('Please select Client.', 'warning', 'Warning Message');
        return;
      }
    }

    data['ReceiptDate'] = this.returnDate(this.frm.get('ReceiptDate')?.value);
    data['ChequeNo'] = this.frm.get('ChequeNo')?.value ? this.frm.get('ChequeNo')?.value : this.frm.get('ibgNo')?.value ? this.frm.get('ibgNo')?.value : '';
    const isInvoiceAdjustment = this.frm.get("IsInvoiceAdjustment")?.value;
    if (isInvoiceAdjustment === "" || isInvoiceAdjustment === undefined) {
      data['IsInvoiceAdjustment'] = false;
      //this.frm.get("IsInvoiceAdjustment")?.setValue(false);
    }

    const bankID = this.frm.get("BankID")?.value;

    if (bankID === "" || bankID === undefined || bankID === null) {
      data['BankID'] = 0;
      //this.frm.get("BankID")?.setValue(0);
    }
    let details: any = [];
    var balance = this.frm.get("ReceiptAmount")?.value
    for (let i = 0; i < this.invoiceList.length; i++) {
      if (this.rowCheckedState[i]) {
        if (balance >= Number(this.invoiceList[i]['Balance'])) {
          if (Number(this.invoiceList[i]['Balance']) == 0) {
            var dAmount = 0;
            this.service.GetReceiptDetailRowAmount(this.invoiceList[i]['ID'], this.invoiceList[i]['ReceiptID'], this.invoiceList[i]['InvoiceID']).subscribe((d: any) => {

              if (d.length > 0) {
                dAmount = d[0]['Amount'];
              }
            })
            if (this.frm.get("balance_status")?.value == "1") {
              details.push({
                ID: this.invoiceList[i]['ID'],
                ReceiptID: this.invoiceList[i]['ReceiptID'],
                InvoiceID: this.invoiceList[i]['InvoiceID'],
                Amount: dAmount,
                BalanceStatus: this.frm.get("balance_status")?.value,
                BalanceAmount: 0,
                LastUpdatedBy: this.currentUser
              })

            } else {
              details.push({
                ID: this.invoiceList[i]['ID'],
                ReceiptID: this.invoiceList[i]['ReceiptID'],
                InvoiceID: this.invoiceList[i]['InvoiceID'],
                Amount: dAmount,
                BalanceStatus: this.frm.get("balance_status")?.value,
                BalanceAmount: this.frm.get("balance_amount")?.value,
                LastUpdatedBy: this.currentUser
              })
            }
            balance = 0;
          } else {
            details.push({
              ID: this.invoiceList[i]['ID'],
              ReceiptID: this.invoiceList[i]['ReceiptID'],
              InvoiceID: this.invoiceList[i]['InvoiceID'],
              Amount: this.invoiceList[i]['Balance'],
              BalanceStatus: this.frm.get("balance_status")?.value,
              BalanceAmount: this.frm.get("balance_amount")?.value,
              LastUpdatedBy: this.currentUser
            })
            balance -= Number(this.invoiceList[i]['Balance'])
          }
        } else if (balance > 0) {
          this.invoiceList[i]
          details.push({
            ID: this.invoiceList[i]['ID'],
            ReceiptID: this.invoiceList[i]['ReceiptID'],
            InvoiceID: this.invoiceList[i]['InvoiceID'],
            Amount: balance,
            BalanceStatus: this.frm.get("balance_status")?.value,
            BalanceAmount: Number(this.invoiceList[i]['Balance']) - balance,
            LastUpdatedBy: this.currentUser
          })
          balance = 0;
        }
      }
    }
    data['details'] = details;
    data['TaxPercentage'] = data['TaxPercentage'] == '' ? '0.00' : data['TaxPercentage'];
    data['HQPercentage'] = data['HQPercentage'] == '' ? '0.00' : data['HQPercentage']
    data['LastUpdatedBy'] = this.currentUser


    this._financeService.SaveAndUpdateReceipt(data).subscribe({
      next: (response: any) => {

        if (response && response.ReceiptID) {
          const receiptID = response.ReceiptID;

          this.showMessage("Receipt Saved/Updated Successfully", 'success', 'Success Message');
          if (this.receiptID > 0) {
            this.route.navigate(['/report/finance/receipt-voucher-report'], { queryParams: { ASN: this.accShortName }, queryParamsHandling: 'merge' });
          } else {
            this.route.navigate(['/report/finance/receipt-voucher-report'], { queryParams: { id: receiptID, ASN: this.accShortName }, queryParamsHandling: 'merge' });
          }
          this.frm.reset();
        }
      },
      error: (err) => {
        this.showMessage('Error saving payment', 'error', 'Error Message');
      }
    });

  }
  deleteClickButton(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure you want to delete this Receipt?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._financeService.deleteReceipt(this.receiptID, this.currentUser).subscribe({
            next: res => {
              this.showMessage(`Receipt deleted successfully.`, 'success', 'Success Message');
              this.route.navigate(['/finance/receipts/search-receipt']);
            },
            error: err => {
              this.showMessage(`Receipt Failed to delete records due to ${err}`, 'error', 'Error Message');
            }
          });

        } else {
          this.hideSpinner();
        }
      });

  }
  cancelButtonClick() {
    this.frm.reset();
    this.receiptID = 0;
    this.accShortName = '';
    this.route.navigate(['/finance/receipts/new-receipt']);
  }
  changeAdjustment(value: string) {
    this.isAdjustment = this.frm.get("IsInvoiceAdjustment")?.value;
  }

  changeBalanceStatus() {
    var balanceStatus = this.frm.get("balance_status")?.value;
    var balanceAmount = this.frm.get("balance_amount")?.value;
    this.frm.get("CreditNoteAmount")?.setValue(0);
    this.frm.get("SuspendAmount")?.setValue(0);
    if (balanceStatus === "2") {
      this.frm.get("CreditNoteAmount")?.setValue(balanceAmount)
    } else if (balanceStatus === "3") {
      this.frm.get("SuspendAmount")?.setValue(balanceAmount)
    }

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
