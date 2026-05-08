import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MastermoduleService } from "../../../../service/mastermodule.service";
import { InventoryService } from "../../../../service/inventory.service";
import { EmployeeService } from "../../../../service/employee.service";
import { Router, NavigationEnd } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { forkJoin } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Sort } from '@angular/material/sort';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import * as XLSX from 'xlsx';
import { MonthlyInvoiceStatus } from 'src/app/model/monthlyInvoiceStatus';

@Component({
  selector: 'app-monthly-invoice-status',
  templateUrl: './monthly-invoice-status.component.html',
  styleUrls: ['./monthly-invoice-status.component.css']
})
export class MonthlyInvoiceStatusComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/"
  frm!: FormGroup;
  branchList: any = [];
  itemList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  reportPageName: string = "";
  reportType!: number;
  displayedColumns: string[] = ['invoicedate', 'ClientName', 'InvoiceNumber', 'ServiceCharges', 'Discount', 'TaxAmount', 'InvoiceAmount', 'Payment'];
  dataSource: any;
  monthlyInvoiceStatus: MonthlyInvoiceStatus[] = [];

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService, private empService: EmployeeService,
    private fb: FormBuilder, private router: Router, private _dataService: DatasharingService, private _liveAnnouncer: LiveAnnouncer, private _payrollService: PayrollModuleService) {
    this.frm = fb.group({
      Branch: ["0"],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required],
    })

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Monthly Invoice Status Report');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });

          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
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

  clkBtn(number: number) {
    this.errorMessage = '';
    this.reportType = number;
    if (this.frm.get("Branch")?.value == 0) {
      if (this.reportType == 1) {  
        this.errorMessage = ''; 
        this.dataSource = new MatTableDataSource<any[]>([]);     
        this.getMonthlyInvoicesList();
      } else {
        this.errorMessage = 'Please select branch';
      }
    } else {
      this.dataSource = new MatTableDataSource([]);
      this.reportPageName = number == 1 ? "MonthlyInvoiceReport.aspx?" : 'MonthlyInvoiceReportWithoutSST.aspx?';
      this.reportPageName += "LoginID=" + this.currentUser;
    }
  }

  onSubmit() {
    if ((this.reportType == 1 && this.frm.get("Branch")?.value !== 0) || this.reportType == 2) {
      this.url = environment.baseReportUrl;
      this.url += this.currentUrl;
      let localURL = "";
      if (this.frm.invalid) {
        return;
      }

      localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
      localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
      localURL += "&Branch=" + (this.frm.get("Branch")?.value ?? 0)
      if (this.reportPageName != '') {
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
      }
    } //else {
    //this.getMonthlyInvoiceStatusList(this.returnDate(this.frm.get("StartDate")?.value), this.returnDate(this.frm.get("EndDate")?.value), this.frm.get("Branch")?.value);
    //}
  }
  getMonthlyInvoicesList() {
    forkJoin({
      invoices: this._masterService.getMonthlyInvoiceList(this.frm.get("StartDate")?.value, this.frm.get("EndDate")?.value),
    }).subscribe(
      ({ invoices }) => {
        if(invoices.length > 0){
          this.errorMessage ='';
          this.dataSource = new MatTableDataSource<any[]>(invoices);
        }else{
          this.errorMessage = `No data available for given selected criteria.`; 
          this.urlSafe = undefined;             
        }        
      },
      (error) => {
        this.errorMessage = error.message;
      }
    );
  }
  getMonthlyInvoiceStatusList(
    startDate: string,
    endDate: string,
    branch: string
  ): void {
    this._payrollService
      .getMonthlyInvoiceStatusList(startDate, endDate, branch,)
      .subscribe({
        next: (data) => {
          if (data.length > 0) {
            data.forEach((item: any) => {
              const employee = new MonthlyInvoiceStatus();  // Create a new instance of EmployeeSosco

              // Manually assign values to the employee object
              employee.Name = item.Name || '';
              employee.InvoiceNo = item.InvoiceNo || '';
              employee.InvoiceDate = new Date(item.InvoiceDate) || new Date(); // Ensure valid Date
              employee.ServiceCharges = item.ServiceCharges || '';
              employee.Discount = item.Discount || 0;
              employee.TaxAmount = item.TaxAmount || 0;
              employee.PaymentReceived = item.PaymentReceived || '';
              employee.InvoiceAmount = item.InvoiceAmount || 0;

              // Push the manually populated employee object to the array
              this.monthlyInvoiceStatus.push(employee);
            });
            this.exportToExcel();
          } else {
            this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
          }
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
        }
      });
  }

  exportToExcel() {
    const fileName = `MonthlyInvoiceStatus.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.monthlyInvoiceStatus);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, fileName);
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
