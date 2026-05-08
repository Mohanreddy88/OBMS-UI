import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProfitAndLoss } from 'src/app/model/profitAndLoss';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { InventoryService } from 'src/app/service/inventory.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profit-and-loss',
  templateUrl: './profit-and-loss.component.html',
  styleUrls: ['./profit-and-loss.component.css']
})
export class ProfitAndLossComponent implements OnInit {

  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/"
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  reportPageName: string = "";
  frm!: FormGroup;
  branchList: any = [];
  bankList: any = [];
  itemList: any = [];
  currentUser: string = "";
  reportType!: any;
  profitAndLoss: any[] = [];
  displayedColumns: string[] = ['Month', 'Income', 'CN', 'Discount', 'Expenses', 'Profit'];
  dataSource: any;

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService,
    private empService: EmployeeService, private fb: FormBuilder, private router: Router, private _liveAnnouncer: LiveAnnouncer,
    private _dataService: DatasharingService) {
    this.frm = fb.group({
      Branch: ["0"],
      Bank: ["0"],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required],
    });

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
    this.getUserAccessRights(this.currentUser, 'Profit Loss Summary Report');
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
    this.reportType = number === 1 ? 1 : 2;
    this.reportPageName = number == 1 ? "" : 'ProfitLossSummaryReport.aspx?';
    this.reportPageName += "LoginID=" + this.currentUser;
  }
  onSubmit() {
    if (this.reportType == 2) {
      this.dataSource = new MatTableDataSource([]);
      this.url = environment.baseReportUrl;
      this.url += this.currentUrl;
      let localURL = "";
      if (this.frm.invalid) {
        return;
      }
      localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
      localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
      localURL += "&Bank=" + (this.frm.get("Bank")?.value ?? 0);
      localURL += "&Branch=" + (this.frm.get("Branch")?.value ?? 0);
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
    } else {
      if (this.frm.get("Branch")?.value == 0) {
        this.GetList(this.returnDate(this.frm.get("StartDate")?.value), this.returnDate(this.frm.get("EndDate")?.value))
      } else {
        this.GetListWithBranch(this.returnDate(this.frm.get("StartDate")?.value), this.returnDate(this.frm.get("EndDate")?.value), this.frm.get("Branch")?.value)
      }
    }

  }
  GetList(startDate: string, endDate: string): void {
    forkJoin({
      listWithOutBranch: this._masterService.getList(startDate, endDate),
    }).subscribe({
      next: ({ listWithOutBranch }) => {
        this.handleDataBinding(listWithOutBranch);
      },
      error: (err) => {
        this.errorMessage = 'Error fetching data: ' + err.message;
        console.error(err);
      }
    });
  }

  // Method for the third endpoint
  GetListWithBranch(startDate: string, endDate: string, branch: string): void {
    forkJoin({
      listWithBranch: this._masterService.getListWithBranch(startDate, endDate, branch),
    }).subscribe({
      next: ({ listWithBranch }) => {
        this.handleDataBinding(listWithBranch);
      },
      error: (err) => {
        this.errorMessage = 'Error fetching data: ' + err.message;
        console.error(err);
      }
    });
  }
  handleDataBinding(data: any) {
    this.showLoadingSpinner = true
    this.profitAndLoss = [];
    if (data.length > 0) {
      data.forEach((item: any) => {
        const employee = new ProfitAndLoss();  // Create a new instance of EmployeeSosco

        // Manually assign values to the employee object
        employee.Month = item.Month || '';
        employee.TotalCN = item.TotalCNAmount || 0;
        employee.TotalDiscount = item.TotalDiscountAmount || 0;
        employee.TotalIncome = item.TotalIncomeAmount || 0;
        employee.TotalProfit = item.TotalProfitAmount || 0;
        employee.TotalExpenses = item.TotalExpensesAmount || 0;
        // Push the manually populated employee object to the array
        this.profitAndLoss.push(employee);
        console.log(this.profitAndLoss)
      });
      this.dataSource = new MatTableDataSource<ProfitAndLoss[]>(this.profitAndLoss);
      this.hideSpinner();
    } else {
      this.hideSpinner();
      this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
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
