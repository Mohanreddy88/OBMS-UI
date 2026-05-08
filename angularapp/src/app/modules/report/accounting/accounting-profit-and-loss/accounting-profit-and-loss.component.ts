import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { InventoryService } from 'src/app/service/inventory.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-accounting-profit-and-loss',
  templateUrl: './accounting-profit-and-loss.component.html',
  styleUrls: ['./accounting-profit-and-loss.component.css']
})
export class AccountingProfitAndLossComponent implements OnInit {

    url: string = environment.baseReportUrl;
    urlSafe: SafeResourceUrl | undefined;
    currentUrl: string = "Accounting/ProfitAndLostReport.aspx?"
    frm!: FormGroup;
    branchList: any = [];
    itemList: any = [];
    currentUser: string = "";
    errorMessage: string = '';
    warningMessage: string = '';
    showLoadingSpinner: boolean = false;
    userAccessModel!: UserAccessModel;
  
     constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService, private empService: EmployeeService, 
        private fb: FormBuilder,private router: Router, private _dataService: DatasharingService) {    
          this.frm = fb.group({
            Type: ["Monthly"],
            Branchcode: ["0",Validators.required],
            StartDate: ["", Validators.required],
          })
    
        this.userAccessModel = {
          readAccess: false,
          updateAccess: false,
          deleteAccess: false,
          createAccess: false,
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
        this.getUserAccessRights(this.currentUser, 'Profit And Lost');
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
            this. _masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
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

  onSubmit() {
    this.url = environment.baseReportUrl;
    this.url += this.currentUrl;
    let localURL = "";

    if (this.frm.invalid) return;
  
    const startDateControl = this.frm.get("StartDate")?.value;
    const displayType = this.frm.get("Type")?.value;
    const branchCode = this.frm.get("Branchcode")?.value ?? 0;
  
    if (!startDateControl) {
      this.errorMessage = "Start date is required.";
      return;
    }
  
    const startDate = new Date(startDateControl);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
  
    // Get last day of the selected month
    const numberOfDays = new Date(year, month, 0).getDate();
    const lastDay = new Date(year, month - 1, numberOfDays);
  
    let reportStartDate = '';
    let reportEndDate = '';
  
    if (displayType === 'Monthly') {
      const shortMonth = startDate.toLocaleString('default', { month: 'short' }).toUpperCase();
      reportStartDate = `01-${shortMonth}-${year}`;
      reportEndDate = this.formatDate(lastDay);
    } else {
      reportStartDate = `01-JAN-${year}`;
      reportEndDate = `31-DEC-${year}`;
    }   
    localURL += "LoginID=" + this.currentUser;

    // Build the report iframe URL
    const reportQuery = `&Branch=${branchCode}&StartDate=${reportStartDate}&EndDate=${reportEndDate}`;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.url}${reportQuery}`
    );
  }
  
  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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
