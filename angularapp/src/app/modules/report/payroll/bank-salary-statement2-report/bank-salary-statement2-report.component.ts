import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { BankListModel } from 'src/app/model/bankListModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { BankStatement } from 'src/app/model/BankStatement';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-bank-salary-statement2-report',
  templateUrl: './bank-salary-statement2-report.component.html',
  styleUrls: ['./bank-salary-statement2-report.component.css']
})
export class BankSalaryStatement2ReportComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "PayRoll/"
  reportPageName: string = "";
  frm!: FormGroup;
  branchList: any = [];
  bankList!: BankListModel[];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  dtAdvanceDate!: string;
  reportType!: number;
  bankStatements: any[] = [];
  displayedColumns: string[] = ['accountno', 'salary', 'name', 'passport', 'branchcode'];
  dynamicPageSizeOptions: number[] = [];
  defaultPageSize: number = 10;
  dataSource: any;
  dtPeriod!: string;
  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private fb: FormBuilder,
    private _dataService: DatasharingService, private _commonService: CommonService, private _liveAnnouncer: LiveAnnouncer,
    private _payrollService: PayrollModuleService, private router: Router) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.url += this.currentUrl;

    this.frm = fb.group({
      Branch: ["", Validators.required],
      BankCode: [''],
      Period: ["", Validators.required],
      EmployeeType: ["Guard", Validators.required],
      exportOption: ['0'],
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
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.paginator.pageSize = this.defaultPageSize; 
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
    this.getUserAccessRights(this.currentUser, 'Pay Slip Report');
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
            this._commonService.getBankList().subscribe(bankList => {
              this.bankList = bankList;
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
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.frm.value.Period = this.formatDate(`${type}: ${event.value}`);
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
  }
  onBranchSelectionChange(event: any) {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
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

  onSearchClick() {   
    const period = new Date(this.frm.get('Period')?.value);
    this.dtPeriod = this.formatDate(
      new Date(period.getFullYear(), period.getMonth() + 1, 0)
    );
    const branch = this.frm.get('Branch')?.value;
    const employeeType = this.frm.get('EmployeeType')?.value;
    const bank = this.frm.get('BankCode')?.value;

    if (this.dtPeriod !== '' && this.dtPeriod !== null && branch !== '' && branch !== undefined &&
      employeeType !== '' && employeeType !== undefined && bank !== '' && bank !== undefined) {
      this.getWithBlankRowByBranchEmployeeTypeAndBank(this.dtPeriod, branch, employeeType, bank)
    } else if (this.dtPeriod !== '' && this.dtPeriod !== null && branch !== '' && branch !== undefined &&
      employeeType !== '' && employeeType !== undefined) {
      this.getWithBlankRowByBranchAndEmployeeType(this.dtPeriod, branch, employeeType)
    } else if (this.dtPeriod !== '' && this.dtPeriod !== null && branch !== '' && branch !== undefined) {
      this.getWithBlankRowByBranch(this.dtPeriod, branch)
    } else if (this.dtPeriod !== '' && period !== null) {
      this.getWithBlankRow(this.dtPeriod)
    }
  }
  // Method for the first endpoint
  getWithBlankRow(dtSalaryPeriod: string): void {
    this._payrollService.getListWithBlankRow(dtSalaryPeriod).subscribe({
      next: (data) => {
        this.handleDataBinding(data)
      },
      error: (err) => {
        this.errorMessage = 'Error fetching data: ' + err.message;
        console.error(err);
      }
    });
  }

  // Method for the second endpoint
  getWithBlankRowByBranch(dtSalaryPeriod: string, branch: string): void {
    this._payrollService.getListWithBlankRowWithBranch(dtSalaryPeriod, branch).subscribe({
      next: (data) => {
        this.handleDataBinding(data)
      },
      error: (err) => {
        this.errorMessage = 'Error fetching data: ' + err.message;
        console.error(err);
      }
    });
  }

  // Method for the third endpoint
  getWithBlankRowByBranchAndEmployeeType(dtSalaryPeriod: string, branch: string, employeeType: string): void {
    this._payrollService
      .getListWithBlankRowWithBranchAndEmployeeType(dtSalaryPeriod, branch, employeeType)
      .subscribe({
        next: (data) => {
          this.handleDataBinding(data)
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
          console.error(err);
        }
      });
  }

  // Method for the fourth endpoint
  getWithBlankRowByBranchEmployeeTypeAndBank(
    dtSalaryPeriod: string,
    branch: string,
    employeeType: string,
    bank: string
  ): void {
    this._payrollService
      .getListWithBlankRowWithAllParams(dtSalaryPeriod, branch, employeeType, bank)
      .subscribe({
        next: (data) => {
          this.handleDataBinding(data)
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
          console.error(err);
        }
      });
  }
  handleDataBinding(data: any) {
    this.showLoadingSpinner = true
    this.errorMessage = '';
    this.bankStatements = [];
    if (data.length > 0) {
      data.forEach((item: any) => {
        const employee = new BankStatement();  // Create a new instance of EmployeeSosco

        // Manually assign values to the employee object
        employee.AccountNo = item.AccountNo || '';
        employee.Salary = item.Salary || '';
        employee.Name = item.Name || '';
        employee.Passport = item.Passport || '';
        employee.BranchCode = item.BranchCode || '';
        // Push the manually populated employee object to the array
        this.bankStatements.push(employee);
      });
      this.generatePageSizeOptions(this.bankStatements);
      this.dataSource = new MatTableDataSource<BankStatement[]>(this.bankStatements);

      // Initialize paginator if it exists
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      } else {
        // Wait for the paginator to initialize
        setTimeout(() => {
          if (this.paginator) {
            this.ngAfterViewInit();
          }
        });
      }
      
      this.hideSpinner();
    } else {
      this.bankStatements=[];
      this.dataSource = new MatTableDataSource<BankStatement[]>(this.bankStatements)
      this.hideSpinner();
      this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
    }
  }
  generatePageSizeOptions(data: any): void {
    const options: number[] = [];
    for (let i = 10; i <= data.length; i += 10) {
      options.push(i);
    }
    this.dynamicPageSizeOptions = options;

  }
  exportToExcel(): void {
    const selectedOption = this.frm.get('exportOption')?.value;
    let exportData: BankStatement[] = [];

    if (selectedOption === '0') {
      // Current Page
      exportData = this.dataSource.filteredData.slice(
        this.paginator.pageIndex * this.paginator.pageSize,
        (this.paginator.pageIndex + 1) * this.paginator.pageSize
      );
    } else if (selectedOption === '1') {
      // All Pages
      exportData = this.dataSource.filteredData;
    } else if (selectedOption === '2') {
      // Top 100 Rows
      exportData = this.dataSource.filteredData.slice(0, 100);
    }

    if (exportData.length > 0) {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      XLSX.writeFile(workbook, `BankStament.xlsx`);
      console.log(`Data exported successfully with option ${selectedOption}`);
    } else {
      console.error('No data available for export.');
      alert('No data available for export.');
    }
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
