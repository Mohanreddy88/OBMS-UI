import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TAX } from "../../../../model/TAXModel";
import Swal from "sweetalert2";
import { FinanceService } from "../../../../service/finance.service";

export interface PeriodicElement {
  ID: number,
  ClientInvoiceID: number,
  AgreementDetailID: number,
  AgreementDate: any,
  AgreementID: number,
  NoOfGuards: number,
  Rate: number,
  NoOfHours: number,
  NoOfDays: number,
  FollowCalender: boolean,
  MonthTotal: number
  HasDiscount: boolean,
  DiscountAmount: number,
  IsTaxable: boolean,
  TaxAmount: number
  index: number
}


@Component({
  selector: 'app-edit-invoice',
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.css']
})
export class EditInvoiceComponent implements AfterViewInit {
  displayedColumns: string[] = ['ID', 'ClientInvoiceID', 'NoOfGuards', 'Rate', 'NoOfHours', 'NoOfDays', 'IsTaxable', 'action'];
  // dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource<PeriodicElement>();
  frm!: FormGroup
  errorDescription: string = "";
  details: PeriodicElement[] = [];
  detailEdit: boolean = false;
  agreement: any;
  DiscountAmount: any = 0;
  TaxAmount: any = 0;
  ServiceCharges: any = 0;
  NoOfHours: any = 0;
  Total: any = 0;
  agreementDetails: any;
  client: any;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, @Inject(MAT_DIALOG_DATA) public info: any, public dialogRef: MatDialogRef<EditInvoiceComponent>, private service: FinanceService) {
    this.agreement = info['agreement'];
    this.agreementDetails = info['agreementDetails'];
    this.client = info['client'];

    console.log('values:', info['branch'] + '' + info['invoiceNo'] + '' + info['invoiceDate'])

    this.frm = this.fb.group({

      ID: [],
      InvoiceNo: [],
      InvoiceDate: [],
      Subject: [],
      ServiceCharges: [],
      Discount: [],
      TaxAmount: [],
      Note: [],
      Branch: [],
      Client: [],
      AgreementID: [],
      details: this.fb.group({
        ID: [0],
        ClientInvoiceID: [0],
        AgreementDate: [],
        AgreementDetailID: [0],
        AgreementID: [0],
        NoOfGuards: [0],
        Rate: [0],
        NoOfHours: [0],
        NoOfDays: [0],
        FollowCalender: [false],
        MonthTotal: [0],
        HasDiscount: [false],
        DiscountAmount: [0],
        IsTaxable: [false],
        TaxAmount: [0],
        index: [-1]
      }),
    });

    this.frm.patchValue(this.agreement);

    this.loadInvoiceDetails(info['branch'], info['invoiceNo']);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

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

  loadInvoiceDetails(branch: string, invoiceNo: string) {
    this.service.getListByBranchAndInvoice(branch, invoiceNo)
      .subscribe({
        next: (res) => {
          console.log("Invoice Details:", res);

          // Clear previous data if needed
          this.details = [];

          if (res && res.length > 0) {
            res.forEach((item: any) => {
              this.details.push(item);
            });

            // Refresh your grid / datasource
            this.detailDataSource();
          }
        },
        error: (err) => {
          console.error("Error loading invoice details:", err);
        }
      });
  }

  emptyDetailData() {
    let emptyData = {
      ID: 0,
      ClientInvoiceID: this.client['ID'],
      AgreementDetailID: 0,
      AgreementDate: '',
      AgreementID: 0,
      NoOfGuards: 0,
      Rate: 0,
      NoOfHours: 0,
      NoOfDays: 0,
      FollowCalender: false,
      MonthTotal: 0,
      HasDiscount: false,
      DiscountAmount: 0,
      IsTaxable: false,
      TaxAmount: 0,
      index: -1
    }

    this.frm.get('details')?.setValue(emptyData);
  }

  addItemDetails(action: string) {
    let frmData = this.frm.getRawValue();
    let details = frmData['details']

    if (!this.agreement) this.agreement = { ID: 0 };

    details['ClientInvoiceID'] = this.client.ID;

    details['MonthTotal'] = parseFloat(details['MonthTotal']) || 0;
    details['TaxAmount'] = parseFloat(details['TaxAmount']) || 0;

    if (action === 'add') {
      details['ID'] = 0;
      this.details.push(details);

    } else if (details['index'] >= 0 && action === 'update') {
      this.details[details['index']] = details;
    }

    this.detailDataSource();
    this.detailEdit = false;
    this.emptyDetailData();
  }

  editRow(row: PeriodicElement, index: any) {
    this.detailEdit = true;
    console.log(row);
    row['index'] = index;
    this.frm.get('details')?.patchValue(row);
  }

  deleteRow(row: PeriodicElement, index: any) {
    this.details.splice(index, 1);

    // if (row.ID != 0) {
    //   this.calculation();

    //   let data = this.frm.getRawValue();

    //   data['details'] = [];

    //   data['ServiceCharges'] = this.ServiceCharges;
    //   data['Discount'] = this.DiscountAmount;
    //   data['TaxAmount'] = this.TaxAmount;


    //   this.service.DeleteInvoiceDetailById(row).subscribe((d: any) => {
    //     console.log(d);
    //   })
    // }
    this.detailDataSource();

  }

  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  DetailRowChange(): void {

    const _description = this.frm.get('details.Description')?.value;

    if (_description != "") {
      this.errorDescription = "";
    } else {
      this.errorDescription = "Enter the type";
    }

    let dt = this.frm.get('AgreementDate')?.value;

    const currentDate = new Date(dt);

    const currentYear = currentDate.getFullYear();

    let vMonthTotal = 0;
    //
    const tNoOfGuards = this.frm.get('details.NoOfGuards')?.value;
    const tRate = this.frm.get('details.Rate')?.value;
    const tNoOfHours = this.frm.get('details.NoOfHours')?.value;
    const tNoOfDays = this.frm.get('details.NoOfDays')?.value;

    if (parseInt("0" + tNoOfGuards, 10) === 0) {
      vMonthTotal = parseFloat(tRate) * parseFloat(tNoOfDays);
    } else {
      vMonthTotal = (
        parseFloat(tNoOfGuards) *
        parseFloat(tRate) *
        parseFloat(tNoOfHours) *
        parseFloat(tNoOfDays)
      );
    }

    if (!(parseInt("0" + tNoOfGuards, 10) === 0 ||
      parseInt("0" + tRate, 10) === 0 ||
      parseInt("0" + tNoOfHours, 10) === 0 ||
      parseInt("0" + tNoOfDays, 10) === 0)) {
      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
    } else {
      vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value);
    }

    this.frm.get('details.YearTotal')?.setValue(this.formatCurrency(vMonthTotal * 12));

    if (this.frm.get('details.IsTaxable')?.value) {
      const FiveOrSix = currentYear <= 2010 ? 5 : 6;
      this.frm.get('details.TaxAmount')?.setValue(
        this.formatCurrency((vMonthTotal - parseFloat(this.frm.get('details.DiscountAmount')?.value)) * (FiveOrSix / 100))
      );
    } else {
      this.frm.get('details.TaxAmount')?.setValue(0);
    }

    let vDiscount = parseFloat(this.frm.get('details.DiscountAmount')?.value);
    if (!this.frm.get('details.HasDiscount')?.value) {
      vDiscount = 0;
    }

    if (this.frm.get('details.IsTaxable')?.value) {
      this.frm.get('details.total')?.setValue(this.formatCurrency((vMonthTotal - vDiscount) * (106 / 100)));
    } else {
      this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount));
    }
  }

  private formatCurrency(value: number): string {
    // Implement your currency formatting logic here
    return value.toFixed(2);
  }

  // calculation() {

  //   this.DiscountAmount = 0;
  //   this.TaxAmount = 0;
  //   this.ServiceCharges = 0;
  //   this.NoOfHours = 0;
  //   this.Total = 0;

  //   let invoice_period = this.client['InvoiceDate'];
  //   let daysInMonth = 0;
  //   let agreementPeriod = new Date(invoice_period);
  //   let forDaysInMonth = new Date(invoice_period);
  //   forDaysInMonth.setMonth(forDaysInMonth.getMonth() + 1);
  //   forDaysInMonth.setDate(0);

  //   daysInMonth = forDaysInMonth.getDate();
  //   this.details.forEach((d: any) => {
  //     let agreementPeriodDate = new Date(d.AgreementDate);
  //     if (d.FollowCalendar) {
  //       d.NoOfDays = daysInMonth;
  //     } else {
  //       if ((agreementPeriodDate.getMonth() == agreementPeriod.getMonth()) && (agreementPeriodDate.getFullYear() == agreementPeriod.getFullYear())) {
  //         if (!((agreementPeriod.getDay() == daysInMonth) && (agreementPeriodDate.getDay() == 1))) {
  //           if ((d.NoOfDays > (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1))) {
  //             d.NoOfDays = d.NoOfDays;
  //           } else {
  //             d.NoOfDays = (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1);
  //           }
  //         }
  //       }
  //     }

  //     if (d.NoOfGuards != 0 && d.Rate != 0 && d.NoOfHours != 0 && d.NoOfDays != 0) {
  //       this.ServiceCharges += d.NoOfDays * d.NoOfGuards * d.NoOfHours * d.Rate;
  //     } else {
  //       this.ServiceCharges += d.MonthTotal;
  //     }

  //     this.NoOfHours += d.NoOfHours * d.NoOfGuards * d.NoOfDays;
  //     if (d.HasDiscount) {
  //       this.DiscountAmount += d.DiscountAmount;
  //     }

  //     if (d.IsTaxable) {
  //       let pa;
  //       if (agreementPeriod.getFullYear() <= 2010) {
  //         pa = 0.05;
  //       } else if ((agreementPeriod >= new Date(TAX.GSTStart6) && agreementPeriod <= new Date(TAX.GSTEnd6)) || (agreementPeriod >= new Date(TAX.SSTStart6) && agreementPeriod <= new Date(TAX.SSTEnd6))) {
  //         pa = 0.06;
  //       } else if (agreementPeriod >= new Date(TAX.GSTStart0) && agreementPeriod <= new Date(TAX.GSTEnd0)) {
  //         pa = 0.00;
  //       } else {
  //         pa = 0.06;
  //       }
  //       this.TaxAmount += (d.MonthTotal - d.DiscountAmount) * pa;
  //     }

  //   });

  //   this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;

  // }

  // onSubmit() {
  //   this.calculation();

  //   let data = this.frm.getRawValue();
  //   this.details.map((d: any) => {
  //     if (d.ID == 0) {
  //       d.AgreementDate = this.returnDate()
  //     }
  //   })

  //   data['details'] = this.details;

  //   if (this.frm.invalid) {
  //     return
  //   }
  //   data['ServiceCharges'] = this.ServiceCharges;
  //   data['Discount'] = this.DiscountAmount;
  //   data['TaxAmount'] = this.TaxAmount;

  //   console.log(data);
  //   let msg = "";
  //   this.service.SaveAndUpdateInvoiceDetail(data).subscribe((d: any) => {

  //     msg = 'Successfully Updated Details';

  //     Swal.fire({
  //       toast: true,
  //       position: 'top',
  //       showConfirmButton: false,
  //       title: 'Success',
  //       text: msg,
  //       icon: 'success',
  //       showCloseButton: false,
  //       timer: 3000,
  //     });

  //     this.closePopup();
  //   })

  // }

  calculation() {
    this.DiscountAmount = 0;
    this.TaxAmount = 0;
    this.ServiceCharges = 0;
    this.NoOfHours = 0;
    this.Total = 0;

    let invoiceDate = new Date(this.client['InvoiceDate']);

    // Days in month
    let endOfMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0);
    let daysInMonth = endOfMonth.getDate();

    this.details.forEach((d: any) => {

      let agreementDate = new Date(d.AgreementDate);

      // -----------------------
      // 1️⃣ Calculate NoOfDays
      // -----------------------
      if (d.FollowCalendar) {
        d.NoOfDays = daysInMonth;
      } else {
        if (agreementDate.getMonth() === invoiceDate.getMonth() &&
          agreementDate.getFullYear() === invoiceDate.getFullYear()) {
          if (!(invoiceDate.getDate() === daysInMonth && agreementDate.getDate() === 1)) {
            d.NoOfDays = Math.min(
              d.NoOfDays,
              invoiceDate.getDate() - agreementDate.getDate() + 1
            );
          }
        }
      }

      // -----------------------
      // 2️⃣ Calculate MonthTotal
      // -----------------------
      d.MonthTotal = d.NoOfGuards * d.Rate * d.NoOfHours * d.NoOfDays;

      // -----------------------
      // 3️⃣ Calculate Tax
      // -----------------------
      let pa = 0;

      if (invoiceDate.getFullYear() <= 2010) {
        pa = 0.05;
      }
      // GST 6% or SST 6%
      else if (
        (invoiceDate >= new Date(TAX.GSTStart6) && invoiceDate <= new Date(TAX.GSTEnd6)) ||
        (invoiceDate >= new Date(TAX.SSTStart6) && invoiceDate <= new Date(TAX.SSTEnd6))
      ) {
        pa = 0.06;
      }
      // GST 0%
      else if (
        invoiceDate >= new Date(TAX.GSTStart0) && invoiceDate <= new Date(TAX.GSTEnd0)
      ) {
        pa = 0.00;
      }
      // SST 8%
      else if (
        invoiceDate >= new Date(TAX.SSTStart8) && invoiceDate <= new Date(TAX.SSTEnd8)
      ) {
        pa = 0.08;
      }
      else {
        pa = 0.06; // Default 6%
      }

      // Apply tax
      d.TaxAmount = d.IsTaxable ? (d.MonthTotal - (d.DiscountAmount || 0)) * pa : 0;

      // -----------------------
      // 4️⃣ Totals
      // -----------------------
      this.ServiceCharges += d.MonthTotal;
      this.DiscountAmount += d.HasDiscount ? (d.DiscountAmount || 0) : 0;
      this.TaxAmount += d.TaxAmount;
      this.NoOfHours += d.NoOfHours * d.NoOfGuards * d.NoOfDays;
    });

    // Final total
    this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;
  }


  onSubmit() {

    // Step 1: Perform line-by-line calculation (same as old logic)
    this.calculation();

    if (this.frm.invalid) {
      return;
    }

    // Step 2: Prepare payload
    let data = this.frm.getRawValue();

    // Add agreement date for new details
    this.details.forEach(d => {
      if (d.ID === 0) {
        d.AgreementDate = this.returnDate();
      }
    });

    data['details'] = this.details;

    // Set totals same as old code (ServiceCharges, Tax, Discount)
    data['ServiceCharges'] = this.ServiceCharges;
    data['TaxAmount'] = this.TaxAmount;
    data['Discount'] = this.DiscountAmount;

    console.log("Final Submit Payload:", data);

    // Step 3: Call API
    this.service.SaveAndUpdateInvoiceDetail(data).subscribe({
      next: (d: any) => {

        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully Updated Details',
          icon: 'success',
          timer: 3000,
          width: '600px',
          customClass: {
            popup: 'swal-top-offset'
          }
        });

        this.closePopup();
      },
      error: err => {
        console.error("Error saving:", err);
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

  closePopup() {
    this.dialogRef.close(this.client);
  }
}

