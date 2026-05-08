import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EditInvoiceComponent } from './edit-invoice/edit-invoice.component';
import { FinanceService } from "../../../service/finance.service";
import { forkJoin, from } from "rxjs";
// import {environment, TAX} from "src/environments/environment";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { TAX } from 'src/app/model/TAXModel';
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';

export interface PeriodicElement {
  Name: string,
}


@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  displayedColumns: string[] = ['actions', 'Name',];
  dataSource = new MatTableDataSource<PeriodicElement>();
  frm!: FormGroup
  client: any;
  branchList: any;
  agreement: any;
  agreementDetails: any;
  DiscountAmount: any = 0;
  TaxAmount: any = 0;
  ServiceCharges: any = 0;
  NoOfHours: any = 0;
  Total: any = 0;
  currentUser: string = '';
  details: any = [];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  btnSaveDisabled: boolean = true;
  btnEditDisabled: boolean = true;
  invoiceId: number = 0;
  agreementEditDetails: any;
  isEditMode = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    private service: FinanceService, private route: Router, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _payrollService: PayrollModuleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Invoice');

    this.frm = this.fb.group({
      ID: [0],
      invoice_period: [Validators.required],
      branch: ['', Validators.required],
      invoice_no: [''],
      info: [''],
      service_charge: [''],
      discount: [''],
      tax: [''],
      total: [''],
      note: [''],

    });
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
            this.service.getInvoiceMaster(this.currentUser).subscribe((d: any) => {
              this.branchList = d['branchList'];
            })
            this.hideSpinner()
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideSpinner()
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  getClients() {
    this.errorMessage = '';
    let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value)
    // Being Charges for Security Services for the month of October 2023
    if (this.frm.get("invoice_period")?.value != "") {

      this.frm.get('info')?.setValue("Being Charges for Security Services for the month of " + dateStr);
      this.frm.get('note')?.setValue("Being Charges for Security Services for the month of " + dateStr);
    }


    if (this.frm.get("branch")?.value != "" && this.frm.get("invoice_period")?.value != "") {
      let branch = this.frm.get("branch")?.value;
      let invoicePeriod = this.returnDate(this.frm.get("invoice_period")?.value);

      this.service.getClients(branch, invoicePeriod).subscribe((d: any) => {
        // const note = d?.length ? d[0].Note : this.frm.get('note')?.setValue("Being Charges for Security Services for the month of " + dateStr);
        // this.frm.get('note')?.setValue(note);
        d.sort((a: any, b: any) => (a.Name || '').localeCompare(b.Name || ''));
        this.setDatasource(d);
      });

      this.frm.get('service_charge')?.setValue("");
      this.frm.get('discount')?.setValue("");
      this.frm.get('tax')?.setValue("");
      this.frm.get('total')?.setValue("");

      this.DiscountAmount = 0;
      this.TaxAmount = 0;
      this.ServiceCharges = 0;
      this.NoOfHours = 0;
      this.Total = 0;
    }

  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  //edit button click
  getAgreement(client: any) {
    this.isEditMode = true;
    const branch = this.frm.get("branch")?.value;
    this.client = client;
    //this.invoiceId = client.ID;
    const invoicePeriod = this.returnDate(this.frm.get("invoice_period")?.value);
    let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value);

    // 👉 Step 1: Call calculation API first (separate, because you MUST validate before continuing)
    this._payrollService.clientInvoiceCalculation(branch, client?.Code, invoicePeriod)
      .subscribe({
        next: (calc) => {
          // Validation same as original
          if (calc.ServiceCharges === 0) {
            this.errorMessage =
              "Agreement for this period does not exist. Unable to process invoice.";
            this.btnSaveDisabled = true;
            this.btnEditDisabled = true;
            return;
          }

          this.errorMessage = "";

          // Patch calculated values (same as your code)
          this.frm.patchValue({
            service_charge: calc.ServiceCharges.toFixed(2),
            discount: calc.Discount.toFixed(2),
            tax: calc.TaxAmount.toFixed(2),
            total: (
              calc.ServiceCharges -
              calc.Discount +
              calc.TaxAmount
            ).toFixed(2),
            note: `Being Charges for Security Services for the month of ${dateStr}`,
          });

          // 👉 Step 2: After calculation, call Agreement + NewInvoiceNo in PARALLEL
          forkJoin({
            agreementData: this.service.getAgreement(branch, invoicePeriod, client?.Code),
            invoiceNoData: this.service.getNewClientInvoiceNo(branch, invoicePeriod.toString()),
          }).subscribe({
            next: (combined) => {
              const agreementResponse = combined.agreementData;
              const invoiceResponse = combined.invoiceNoData;

              this.agreement = agreementResponse.agreement;
              this.agreementEditDetails = agreementResponse.agreementDetails;

              this.frm.patchValue({
                invoice_no: invoiceResponse.InvoiceNo
              });

              // Enable buttons
              this.btnSaveDisabled = false;
              this.btnEditDisabled = false;
            },
            error: (err) => {
              console.error("Error retrieving agreement or invoice no:", err);
              this.btnSaveDisabled = true;
              this.btnEditDisabled = true;
            }
          });
        },

        error: (err) => {
          console.error("Error fetching invoice:", err);
          this.btnSaveDisabled = true;
          this.btnEditDisabled = true;
        },
      });
  }

  //save button click
  getClientInvoiceById(client: any) {
    let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value);
    this.isEditMode = false;
    this.client = client;
    this.invoiceId = client.ID;
    if (this.invoiceId > 0) {
      this.service.getClientInvoiceById(client.ID).subscribe((d: any) => {
        this.agreementDetails = d['details'];
        this.agreement = d['invoice'];
        this.frm.patchValue(this.agreement);
        this.frm.patchValue({ invoice_no: this.agreement?.InvoiceNo });
        const note =
          this.agreement?.Note && this.agreement.Note.trim() !== ''
            ? this.agreement.Note
            : `Being Charges for Security Services for the month of ${dateStr}`;

        this.frm.get('note')?.setValue(note);
        this.calculationEdit();

        this.btnSaveDisabled = false;
        this.btnEditDisabled = false;
      })
    }

  }

  calculation() {

    this.ServiceCharges = 0;
    this.DiscountAmount = 0;
    this.TaxAmount = 0;
    this.Total = 0;

    let invoice_period = this.frm.get('invoice_period')?.value
    let daysInMonth = 0;
    let agreementPeriod = new Date(invoice_period);
    let forDaysInMonth = new Date(invoice_period);
    forDaysInMonth.setMonth(forDaysInMonth.getMonth() + 1);
    forDaysInMonth.setDate(0);

    daysInMonth = forDaysInMonth.getDate();
    if (this.agreementDetails || Array.isArray(this.agreementDetails)) {
      this.agreementDetails.forEach((d: any) => {
        let agreementPeriodDate = new Date(d.AgreementDate);
        if (d.FollowCalendar) {
          d.NoOfDays = daysInMonth;
        } else {
          if ((agreementPeriodDate.getMonth() == agreementPeriod.getMonth()) && (agreementPeriodDate.getFullYear() == agreementPeriod.getFullYear())) {
            if (!((agreementPeriod.getDate() == daysInMonth) && (agreementPeriodDate.getDate() == 1))) {
              if ((d.NoOfDays > (agreementPeriod.getDate() - agreementPeriodDate.getDate() + 1))) {
                d.NoOfDays = d.NoOfDays;
              } else {
                d.NoOfDays = (agreementPeriod.getDate() - agreementPeriodDate.getDate() + 1);
              }
            }
          }
        }

        if (d.NoOfGuards != 0 && d.Rate != 0 && d.NoOfHours != 0 && d.NoOfDays != 0) {
          this.ServiceCharges += d.NoOfDays * d.NoOfGuards * d.NoOfHours * d.Rate;
        } else {
          this.ServiceCharges += d.MonthTotal;
        }

        this.NoOfHours += d.NoOfHours * d.NoOfGuards * d.NoOfDays;
        if (d.HasDiscount) {
          this.DiscountAmount += d.DiscountAmount;
        }

        if (d.IsTaxable) {
          let pa;
          if (agreementPeriod.getFullYear() <= 2010) {
            pa = 0.05;
          } else if ((agreementPeriod >= new Date(TAX.GSTStart6) && agreementPeriod <= new Date(TAX.GSTEnd6)) || (agreementPeriod >= new Date(TAX.SSTStart6) && agreementPeriod <= new Date(TAX.SSTEnd6))) {
            pa = 0.08;
          } else if (agreementPeriod >= new Date(TAX.GSTStart0) && agreementPeriod <= new Date(TAX.GSTEnd0)) {
            pa = 0.00;
          } else {
            pa = 0.08;
          }
          this.TaxAmount += (d.MonthTotal - d.DiscountAmount) * pa;
        }

      });
    }
    this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;

    this.frm.get('service_charge')?.setValue(Number(this.ServiceCharges).toFixed(2));
    this.frm.get('discount')?.setValue(Number(this.DiscountAmount).toFixed(2));
    this.frm.get('tax')?.setValue(Number(this.TaxAmount).toFixed(2));
    this.frm.get('total')?.setValue(Number(this.Total).toFixed(2));
  }

  calculationEdit() {

  this.ServiceCharges = 0;
  this.DiscountAmount = 0;
  this.TaxAmount = 0;
  this.Total = 0;
  this.NoOfHours = 0;

  let invoice_period = this.frm.get('invoice_period')?.value;
  let agreementPeriod = new Date(invoice_period);

  let daysInMonth = new Date(agreementPeriod.getFullYear(), agreementPeriod.getMonth() + 1, 0).getDate();

  if (this.agreementDetails && Array.isArray(this.agreementDetails)) {

    this.agreementDetails.forEach((d: any) => {

      let agreementDate = new Date(d.AgreementDate);

      // ✅ FollowCalendar logic
      if (d.FollowCalendar) {
        d.NoOfDays = daysInMonth;
      } else {
        if (
          agreementDate.getMonth() === agreementPeriod.getMonth() &&
          agreementDate.getFullYear() === agreementPeriod.getFullYear()
        ) {
          if (!(
            agreementPeriod.getDate() === daysInMonth &&
            agreementDate.getDate() === 1
          )) {
            if (d.NoOfDays > (agreementPeriod.getDate() - agreementDate.getDate() + 1)) {
              d.NoOfDays = d.NoOfDays;
            } else {
              d.NoOfDays = (agreementPeriod.getDate() - agreementDate.getDate() + 1);
            }
          }
        }
      }

      // ✅ Service Charges
      if (d.NoOfGuards != 0 && d.Rate != 0 && d.NoOfHours != 0 && d.NoOfDays != 0) {
        this.ServiceCharges += d.NoOfDays * d.NoOfGuards * d.NoOfHours * d.Rate;
      } else {
        this.ServiceCharges += d.MonthTotal;
      }

      // ✅ Hours
      this.NoOfHours += d.NoOfHours * d.NoOfGuards * d.NoOfDays;

      // ✅ Discount
      if (d.HasDiscount) {
        this.DiscountAmount += d.DiscountAmount;
      }

      // ✅ Tax Logic (FULL API MATCH)
      if (d.IsTaxable) {

        let pa = 0;

        let gstStart = new Date(TAX.GSTStart6);
        let gstEnd = new Date(TAX.GSTEnd6);
        let sstStart = new Date(TAX.SSTStart6);
        let sstEnd = new Date(TAX.SSTEnd6);
        let gstStart0 = new Date(TAX.GSTStart0);
        let gstEnd0 = new Date(TAX.GSTEnd0);
        let sstStart8 = new Date(TAX.SSTStart8);
        let sstEnd8 = new Date("9999-12-31");

        if (agreementPeriod.getFullYear() <= 2010) {
          pa = 0.05;
        }
        else if (
          (agreementPeriod >= gstStart && agreementPeriod <= gstEnd) ||
          (agreementPeriod >= sstStart && agreementPeriod <= sstEnd)
        ) {
          pa = 0.08;
        }
        else if (agreementPeriod >= gstStart0 && agreementPeriod <= gstEnd0) {
          pa = 0.00;
        }
        else if (agreementPeriod >= sstStart8 && agreementPeriod <= sstEnd8) {
          pa = 0.08;
        }
        else {
          pa = 0.06;
        }

        this.TaxAmount += (d.MonthTotal - d.DiscountAmount) * pa;
      }

    });
  }

  // ✅ Total
  this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;

  // ✅ Patch to form
  this.frm.patchValue({
    service_charge: Number(this.ServiceCharges).toFixed(2),
    discount: Number(this.DiscountAmount).toFixed(2),
    tax: Number(this.TaxAmount).toFixed(2),
    total: Number(this.Total).toFixed(2)
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

  returnMonthAndYear(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;


    const monthString = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
    return `${monthString} ${year}`;
  }

  setAgreementDetail(d: any) {

    let obj = {
      ID: 0,
      AgreementDetailID: d.ID,
      AgreementID: d.AgreementID,
      AgreementDate: d.AgreementDate,
      NoOfGuards: d.NoOfGuards,
      Rate: d.Rate,
      NoOfHours: d.NoOfHours,
      NoOfDays: d.NoOfDays,
      FollowCalender: d.FollowCalender,
      HasDiscount: d.HasDiscount,
      DiscountAmount: d.DiscountAmount,
      IsTaxable: d.IsTaxable,
      TaxAmount: d.TaxAmount,
      MonthTotal: d.MonthTotal,
    }

    this.details.push(obj);
  }

  setAgreementDetailFromSavedInvoice(d: any) {

    let obj = {
      ID: d.ID,
      AgreementDetailID: d.AgreementDetailID,
      AgreementID: d.AgreementID,
      AgreementDate: d.AgreementDate,
      NoOfGuards: d.NoOfGuards,
      Rate: d.Rate,
      NoOfHours: d.NoOfHours,
      NoOfDays: d.NoOfDays,
      FollowCalender: d.FollowCalender,
      HasDiscount: d.HasDiscount,
      DiscountAmount: d.DiscountAmount,
      IsTaxable: d.IsTaxable,
      TaxAmount: d.TaxAmount,
      MonthTotal: d.MonthTotal,
    }

    this.details.push(obj);
  }

  onSubmit() {
    if (this.frm.invalid) {
      return;
    }

    const sourceDetails = this.isEditMode ? this.agreementEditDetails : this.agreementDetails;
    console.log("AGREEMENT DETAILS FROM API", sourceDetails);
    this.details = [];
    const invoiceDate = this.returnDate(this.frm.get("invoice_period")?.value);
    const year = new Date(invoiceDate).getFullYear();
    const dt = new Date(invoiceDate);

    // ===========================
    // 1⃣  TAX RATE CALCULATION
    // ===========================
    let pa = 0;

    if (year <= 2010) {
      pa = 0.05;
    }
    else if (
      (dt >= new Date(TAX.GSTStart6) && dt <= new Date(TAX.GSTEnd6)) ||
      (dt >= new Date(TAX.SSTStart6) && dt <= new Date(TAX.SSTEnd6))
    ) {
      pa = 0.06;
    }
    else if (dt >= new Date(TAX.GSTStart0) && dt <= new Date(TAX.GSTEnd0)) {
      pa = 0.0;
    }
    else if (dt >= new Date(TAX.SSTStart8) && dt <= new Date(TAX.SSTEnd8)) {
      pa = 0.08;
    }
    else {
      pa = 0.06;
    }

    // ===========================
    // 2⃣  Build Invoice Details (C# FOR LOOP)
    // ===========================
    // if (Array.isArray(this.agreementDetails) && this.agreementDetails.length > 0) {
    //   this.agreementDetails.forEach((d: any) => {

    //     let noOfDays = d.NoOfDays;

    //     // C# logic: FollowCalendar = full month days
    //     if (d.FollowCalender) {
    //       noOfDays = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    //     } else {
    //       // Same month as agreement date check
    //       const ad = new Date(this.agreement.AgreementDate);
    //       if (ad.getMonth() === dt.getMonth() && ad.getFullYear() === dt.getFullYear()) {
    //         const lastDayOfMonth = new Date(ad.getFullYear(), ad.getMonth() + 1, 0).getDate();
    //         if (!(dt.getDate() === lastDayOfMonth && ad.getDate() === 1)) {
    //           if (!(d.NoOfDays > (dt.getDate() - ad.getDate() + 1))) {
    //             // original C# comment → do not modify NoOfDays
    //           }
    //         }
    //       }
    //     }

    //     const monthTotal =
    //       (noOfDays === 0 || d.NoOfGuards === 0 || d.NoOfHours === 0 || d.Rate === 0)
    //         ? d.MonthTotal
    //         : noOfDays * d.NoOfGuards * d.NoOfHours * d.Rate;

    //     const taxAmount = d.IsTaxable
    //       ? (monthTotal - d.DiscountAmount) * pa
    //       : 0;

    //     let obj = {
    //       ID: this.client.ID != 0 ? d.ID : 0,
    //       AgreementDetailID: d.AgreementDetailID,
    //       AgreementID: d.AgreementID,
    //       AgreementDate: d.AgreementDate,
    //       NoOfGuards: d.NoOfGuards,
    //       NoOfHours: d.NoOfHours,
    //       NoOfDays: noOfDays,
    //       Rate: d.Rate,
    //       FollowCalender: d.FollowCalender,
    //       DiscountAmount: d.DiscountAmount,
    //       IsTaxable: d.IsTaxable,
    //       TaxAmount: taxAmount,
    //       MonthTotal: monthTotal,
    //       HasDiscount: d.HasDiscount
    //     };

    //     this.details.push(obj);
    //   });
    // }

    if (Array.isArray(sourceDetails) && sourceDetails.length > 0) {

      sourceDetails.forEach((d: any) => {

        let noOfDays = d.NoOfDays;

        // Follow calendar → full month days
        if (d.FollowCalender) {
          noOfDays = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
        } else {
          const ad = new Date(d.AgreementDate);

          if (ad.getMonth() === dt.getMonth() &&
            ad.getFullYear() === dt.getFullYear()) {

            const lastDayOfMonth =
              new Date(ad.getFullYear(), ad.getMonth() + 1, 0).getDate();

            if (!(dt.getDate() === lastDayOfMonth && ad.getDate() === 1)) {
              if (!(d.NoOfDays > (dt.getDate() - ad.getDate() + 1))) {
                // keep original NoOfDays
              }
            }
          }
        }

        const monthTotal =
          (!noOfDays || !d.NoOfGuards || !d.NoOfHours || !d.Rate)
            ? d.MonthTotal
            : noOfDays * d.NoOfGuards * d.NoOfHours * d.Rate;

        const taxAmount = d.IsTaxable
          ? (monthTotal - d.DiscountAmount) * pa
          : 0;

        const obj = {
          ID: this.client.ID !== 0 ? d.ID : 0,
          AgreementDetailID: d.AgreementDetailID ?? d.ID,
          AgreementID: d.AgreementID,
          AgreementDate: d.AgreementDate,
          NoOfGuards: d.NoOfGuards,
          NoOfHours: d.NoOfHours,
          NoOfDays: noOfDays,
          Rate: d.Rate,
          FollowCalender: d.FollowCalender,
          DiscountAmount: d.DiscountAmount,
          IsTaxable: d.IsTaxable,
          TaxAmount: taxAmount,
          MonthTotal: monthTotal,
          HasDiscount: d.HasDiscount,
          LastUpdatedBy: this.currentUser
        };

        this.details.push(obj);
      });
    }


    // ===========================
    // 3⃣  Build Final Invoice Object
    // ===========================
    let data = this.frm.getRawValue();

    data['InvoiceNo'] = (this.frm.get("invoice_no")?.value).toString();
    data['InvoiceDate'] = invoiceDate;
    data['Subject'] = this.frm.get("info")?.value ?? "-";
    data['ServiceCharges'] = this.frm.get('service_charge')?.value ?? 0;
    data['Discount'] = this.frm.get('discount')?.value ?? 0;
    data['TaxAmount'] = this.frm.get('tax')?.value ?? 0;
    data['Note'] = this.frm.get("note")?.value ?? "-";
    data['Branch'] = this.frm.get("branch")?.value;
    data['Client'] = this.client?.Code;
    data['LastUpdatedBy'] = this.currentUser;
    // data['AgreementID'] = this.agreement ? this.agreement.ID : 0;
    data['AgreementID'] = this.details && this.details.length > 0
      ? this.details[0].AgreementID
      : 0;
    data['details'] = this.details;

    console.log("FINAL INVOICE PAYLOAD", data);

    this.service.saveInvoice(data).subscribe((d: any) => {
      console.log('d', d)
      this.showMessage('Invoice Saved/Updated successfully', 'success', 'Success Message');
      this.route.navigate(['/finance/invoice']);
      this.frm.reset();
      this.details = [];
      this.setDatasource([]);

      // print based on Agreement ID
      // this.printView(d['agreement']['ID']);
      this.printView(d.agreement.ID);
    });

  }


  onPrint() {
    this.route.navigate(['/finance/invoice/print-invoice'], { queryParams: { invoiceId: this.invoiceId }, queryParamsHandling: 'merge' });
  }

  deleteInvoice() {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this invoice?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          let data = this.frm.getRawValue();
          if (data['ID'] > 0 && data['ID'] != '0') {
            this.service.deleteInvoice(data['ID']).subscribe((d: any) => {
              this.showMessage(`Invoice Deleted successfully`, 'warning', 'Warning Message')
              this.route.navigate(['/finance/invoice']);
              this.frm.reset();
              this.details = [];
              this.setDatasource([]);
            })
          } else {
            this.hideSpinner();
          }
        } else {
          this.hideSpinner();
        }
      })


  }

  editInvoice() {
    if (!this.client || this.client?.ID == 0) {
      this.showMessage('Please select Saved Client Invoice', 'warning', 'Warning Message')
      return
    }
    const dialogRef = this.dialog.open(EditInvoiceComponent, {
      disableClose: true,
      data: {
        client: this.client,
        agreementDetails: this.agreementDetails,
        agreement: this.agreement,
        branch: this.frm.get('branch')?.value,
        invoiceNo: this.frm.get('invoice_no')?.value,
        invoiceDate: this.returnDate(this.frm.get("invoice_period")?.value),
      },
      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
      //  position: { right: '0'}
    });

    dialogRef.afterClosed().subscribe(client => {
      this.getClientInvoiceById(client);
    });
  }

  printView(invoiceId: number) {
    this.route.navigate(['/report/finance/print-invoice-computer-generated'], { queryParams: { invoiceId: invoiceId }, queryParamsHandling: 'merge' });
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
