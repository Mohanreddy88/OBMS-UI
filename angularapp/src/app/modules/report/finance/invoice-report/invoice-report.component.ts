import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { FinanceService } from 'src/app/service/finance.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export interface PeriodicElement {
  s_no: number,
  client_name: string,
}

@Component({
  selector: 'app-invoice-report',
  templateUrl: './invoice-report.component.html',
  styleUrls: ['./invoice-report.component.css']
})
export class InvoiceReportComponent implements AfterViewInit {
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
  selectedBatchInvoiceIds: string[] = [];
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  client: any;
  InvoiceDate: any;
  Subject: any;
  Note: any;

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, public dialog: MatDialog,
    private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      invoice_period: ['', [Validators.required]],
      branch: ['0', [Validators.required]],
      client: [''],
      checkAll: [false]
    });
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Invoice Report');
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
  changeAdvanceDate() {
    this.getClients();
  }
  getClients() {
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
        if (this.batchInvoice.length == 0) {
          this.frm.patchValue({
            branch: '0'
          });
        }

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

  toggleRowCheckbox(index: number, id: string) {
    // Toggle the checkbox state
    this.rowCheckedState[index] = !this.rowCheckedState[index];

    // Add or remove ID from selectedBatchInvoiceIds
    if (this.rowCheckedState[index]) {
      this.selectedBatchInvoiceIds.push(id);
    } else {
      this.selectedBatchInvoiceIds = this.selectedBatchInvoiceIds.filter(invoiceId => invoiceId !== id);
    }
    // Check if all rows are selected
    let allChecked = this.rowCheckedState.every(checked => checked);
    this.frm.get('checkAll')?.setValue(allChecked);
  }

  toggleRowCheckboxAll() {
    let state = this.frm.get('checkAll')?.value; // Get the current state of the "checkAll" checkbox

    this.rowCheckedState = this.rowCheckedState.map(() => state); // Set all rows to the same state

    if (state) {
      // If "checkAll" is checked, add all IDs to the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = (this.batchInvoice || []).map((invoice: { ID: any; }) => invoice.ID);
    } else {
      // If "checkAll" is unchecked, clear the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = [];
    }
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  get hasSelectedInvoices(): boolean {
    return Array.isArray(this.selectedBatchInvoiceIds) && this.selectedBatchInvoiceIds.length > 0;
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

  printNoDetailsClick() {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/ClientInvoiceReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + this.selectedBatchInvoiceIds;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
  printAmountClick() {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/ClientInvoiceAmountReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + this.selectedBatchInvoiceIds;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
  printWithDetailsClick() {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/ClientInvoiceDetailReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + this.selectedBatchInvoiceIds;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
  printTaxInvoiceClick() {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/TaxInvoiceReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + this.selectedBatchInvoiceIds;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
