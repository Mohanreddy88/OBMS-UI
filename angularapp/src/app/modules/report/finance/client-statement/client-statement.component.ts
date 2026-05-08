import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MastermoduleService } from "../../../../service/mastermodule.service";
import { InventoryService } from "../../../../service/inventory.service";
import { EmployeeService } from "../../../../service/employee.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';

@Component({
  selector: 'app-client-statement',
  templateUrl: './client-statement.component.html',
  styleUrls: ['./client-statement.component.css']
})
export class ClientStatementComponent implements OnInit {


  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/"
  frm!: FormGroup;
  branchList: any = [];
  clientList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  reportPageName: string = "";

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService,
    private _financeService: FinanceService, private fb: FormBuilder, private router: Router, private _dataService: DatasharingService) {

    this.frm = fb.group({
      Branch: ["0"],
      Client: [""],
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
    this.getUserAccessRights(this.currentUser, 'Client Statement Report');
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
    this.reportPageName = number == 1 ? "ClientStatementReport.aspx?" : 'InvoiceCollectionTotalReportNoTax.aspx?';
    this.reportPageName += "LoginID=" + this.currentUser;
  }
  // onSubmit() {
  //   this.url = environment.baseReportUrl;
  //   this.url += this.currentUrl;
  //   let localURL = "";
  //   if (this.frm.invalid) {
  //     return;
  //   }   
  //   const branch = this.frm.get("Branch")?.value;

  //   if (!branch) {
  //     this.errorMessage = 'Branch is required.', 'Validation Error';
  //     return;
  //   }

  //   localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
  //   localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
  //   localURL += "&Branch=" + (this.frm.get("Branch")?.value ?? 0)
  //   localURL += "&Client=" + (this.frm.get("Client")?.value ?? 0)

  //   const payload = {
  //     startDate: this.returnDate(this.frm.get("StartDate")?.value),
  //     endDate: this.returnDate(this.frm.get("EndDate")?.value),
  //     branch: this.frm.get("Branch")?.value ?? '',
  //     client: this.frm.get("Client")?.value ?? ''
  //   };
  //   this._financeService.generateClientStatement(payload).subscribe({
  //     next: () => {
  //     }

  //   });

  //   this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
  // }

  onSubmit() {
    this.url = environment.baseReportUrl;
    this.url += this.currentUrl;
    this.errorMessage = '';

    if (this.frm.invalid) {
      return;
    }

    const branch = this.frm.get("Branch")?.value;
    if (!branch || branch == '0') {
      this.errorMessage = 'Please select the Branch';
      return;
    }

    const startDate = this.returnDate(this.frm.get("StartDate")?.value);
    const endDate = this.returnDate(this.frm.get("EndDate")?.value);
    const client = this.frm.get("Client")?.value ?? '';

    const payload = {
      startDate: startDate,
      endDate: endDate,
      branch: branch,
      client: client
    };

    // Call API first
    this._financeService.generateClientStatement(payload).subscribe({
      next: () => {
        // Only after API succeeds, build and show report
        let localURL = '';
        localURL += "&StartDate=" + startDate;
        localURL += "&EndDate=" + endDate;
        localURL += "&Branch=" + branch;
        localURL += "&Client=" + client;

        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.url + this.reportPageName + localURL
        );
      },
      error: (err) => {
        this.errorMessage = 'Failed to generate client statement.';
      }
    });
  }


  branchChange(data: any) {
    this.errorMessage = '';
    this._masterService.getClientMsterListByBranch(data.value).subscribe((d: any) => {
      this.clientList = d;
    })
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
