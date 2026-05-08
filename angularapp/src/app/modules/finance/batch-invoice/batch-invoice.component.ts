import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FinanceService } from "../../../service/finance.service";
import { Router } from "@angular/router";
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TAX } from "../../../model/TAXModel";
import Swal from "sweetalert2";

export interface PeriodicElement {
  s_no: number,
  client_name: string,
}


@Component({
  selector: 'app-batch-invoice',
  templateUrl: './batch-invoice.component.html',
  styleUrls: ['./batch-invoice.component.css']
})
export class BatchInvoiceComponent implements AfterViewInit {
  rowCheckedState: boolean[] = [];
  displayedColumns: string[] = ['s_no', 'Name'];
  dataSource = new MatTableDataSource();
  frm!: FormGroup
  currentUser: string = '';
  branchList: any;
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  batchInvoice: any = [];


  client: any;
  agreement: any;
  agreementDetails: any = [];
  DiscountAmount: any = 0;
  TaxAmount: any = 0;
  ServiceCharges: any = 0;
  NoOfHours: any = 0;
  Total: any = 0;
  details: any = [];
  invoice_no: any = 0;
  InvoiceDate: any;
  Subject: any;
  Note: any;
  AgreementID: any;

  a_ServiceCharges: any = 0;
  a_DiscountAmount: any = 0;
  a_TaxAmount: any = 0;
  a_Total: any = 0;
  inc: any = 0;


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      invoice_period: [''],
      branch: [''],
      client: [''],
      checkAll: [false]
    })

    this.currentUser = sessionStorage.getItem('username')!;

    this.service.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
      this.branchList = d;
    })

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

  ngOnInit() {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Invoice');
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
            this.service.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            })
            this.hideLoadingSpinner()
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner()
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

  getClients() {

    // Being Charges for Security Services for the month of October 2023


    if (this.frm.get("branch")?.value != "" && this.frm.get("invoice_period")?.value != "") {
      let branch = this.frm.get("branch")?.value;
      this.InvoiceDate = this.returnDate(this.frm.get("invoice_period")?.value);

      let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value)
      this.Subject = "Being Charges for Security Services for the month of " + dateStr;
      this.Note = "Being Charges for Security Services for the month of " + dateStr;

      this.rowCheckedState = [];
      this.service.getBatchInvoiceClients(branch, this.InvoiceDate).subscribe((d: any) => {

        this.batchInvoice = d['batchInvoice'];
        this.setDatasource(this.batchInvoice);

        for (let i = 0; i < this.batchInvoice.length; i++) {
          this.rowCheckedState.push(false);
        }
      }, () => {
      },
        () => {
          this.toggleRowCheckboxAll();
        });
    }
  }

  toggleRowCheckbox(index: number) {
    this.rowCheckedState[index] = !this.rowCheckedState[index];
    if (this.rowCheckedState[index]) {
      console.log(`Row ${index + 1} is checked.`);
    }
    let flag = true;
    for (let i = 0; i < this.rowCheckedState.length; i++) {
      if (!this.rowCheckedState[i]) {
        flag = false;
      }
    }
    this.frm.get('checkAll')?.setValue(flag);
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner()
    }
  }

  save() {
    let data: { [x: string]: string; }[] = [];
    let ij = 0;
    for (let i = 0; i < this.batchInvoice.length; i++) {
      if (this.rowCheckedState[i]) {

        this.calculation(i);

        if (!data[ij]) {
          data[ij] = {};
        }
        data[ij]["ID"] = this.batchInvoice[i]['ID'] ?? 0;
        data[ij]["InvoiceNo"] = this.invoice_no + "";
        data[ij]['InvoiceDate'] = this.InvoiceDate;
        data[ij]['Subject'] = this.Subject;
        data[ij]['ServiceCharges'] = this.ServiceCharges;
        data[ij]['Discount'] = this.DiscountAmount;
        data[ij]['TaxAmount'] = this.TaxAmount;
        data[ij]['Note'] = this.Note;
        data[ij]['Branch'] = this.frm.get("branch")?.value;
        data[ij]['Client'] = this.client?.Code + "";
        data[ij]['AgreementID'] = this.agreement?.ID;
        data[ij]['details'] = this.details;
        ij++;
      }
    }

    this.service.saveBatchInvoice({ data: data }).subscribe((d: any) => {
      Swal.fire({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        title: 'Success',
        text: "Batch Invoice Saved successfully",
        icon: 'success',
        showCloseButton: false,
        timer: 3000,
        width: '600px',
        customClass: {
          popup: 'swal-top-offset'
        }
      });
      this.route.navigate(['/finance/batch-invoice']);
      this.frm.reset();
      this.details = [];
      this.setDatasource([]);
    })
    // data['InvoiceNo'] = (this.frm.get("invoice_no")?.value).toString();
    // data['InvoiceDate'] = this.returnDate(this.frm.get("invoice_period")?.value);
    // data['Subject'] = this.frm.get("info")?.value ?? "-";
    // data['ServiceCharges'] = this.ServiceCharges;
    // data['Discount'] = this.DiscountAmount;
    // data['TaxAmount'] = this.TaxAmount;
    // data['Note'] = this.frm.get("note")?.value ?? "-";
    // data['Branch'] = this.frm.get("branch")?.value;
    // data['Client'] = this.client?.Code;
    // data['AgreementID'] = this.agreement.ID;
    // data['details'] = this.details;

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

  calculation(i: any) {


    this.client = this.batchInvoice[i];
    this.details = [];
    if (this.client.ID == 0) {
      this.agreementDetails = this.batchInvoice[i]['data']['agreementDetails'];
      this.agreement = this.batchInvoice[i]['data']['agreement'];
      this.invoice_no = this.batchInvoice[i]['data']['invoiceNo'];
      this.agreementDetails.forEach((d: any) => {
        this.setAgreementDetail(d);
      });
    } else {
      this.agreementDetails = this.batchInvoice[i]['data']['details'];
      this.agreement = this.batchInvoice[i]['data']['invoice'];
      this.invoice_no = this.agreement?.InvoiceNo;
      this.agreementDetails.forEach((d: any) => {
        this.setAgreementDetailFromSavedInvoice(d);
      });
    }

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
    this.agreementDetails.forEach((d: any) => {
      let agreementPeriodDate = new Date(d.AgreementDate);
      if (d.FollowCalendar) {
        d.NoOfDays = daysInMonth;
      } else {
        if ((agreementPeriodDate.getMonth() == agreementPeriod.getMonth()) && (agreementPeriodDate.getFullYear() == agreementPeriod.getFullYear())) {
          if (!((agreementPeriod.getDay() == daysInMonth) && (agreementPeriodDate.getDay() == 1))) {
            if ((d.NoOfDays > (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1))) {
              d.NoOfDays = d.NoOfDays;
            } else {
              d.NoOfDays = (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1);
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

    this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }

  toggleRowCheckboxAll() {
    let state = this.frm.get('checkAll')?.value;
    for (let i = 0; i < this.rowCheckedState.length; i++) {
      this.rowCheckedState[i] = state;
    }
  }
}
