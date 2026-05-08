import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MastermoduleService } from "../../../../service/mastermodule.service";
import { InventoryService } from "../../../../service/inventory.service";
import { EmployeeService } from "../../../../service/employee.service";
import { Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'app-payment-voucher-summary',
  templateUrl: './payment-voucher-summary.component.html',
  styleUrls: ['./payment-voucher-summary.component.css']
})
export class PaymentVoucherSummaryComponent implements OnInit {

  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/"
  reportType!: any;
  frm!: FormGroup;
  branchList: any = [];
  bankList: any = [];
  itemList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  reportPageName: string = "";
  checklistItems = [
    { value: 1, label: 'Commission' },
    { value: 2, label: 'Fund Transfer' },
    { value: 3, label: 'Against Budget' }
  ];

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService,
    private _commonService: CommonService , private fb: FormBuilder, private router: Router, private _dataService: DatasharingService) {

    this.frm = fb.group({
      Branch: ["0"],
      PaymentType: ["0"],
      Bank: ["0"],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required],
      ChequeAmountVisible: [""]
    })

    this.checklistItems.forEach((item) => {
      this.frm.addControl(`Purpose_${item.value}`, new FormControl(false));
    });
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
    this.getUserAccessRights(this.currentUser, 'Payment Voucher Summary Report');
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

            this._commonService.getUserBankList(this.currentUser).subscribe((d: any) => {
              this.bankList = d;
            })

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
    this.reportPageName = '';
    this.reportType = number === 1 ? 1 : 2;
    //here Ui side hiden the fields if suppose enable the if elase should be changed
    // if (this.frm.get("ChequeAmountVisible")?.value) {
    //   this.reportPageName = number == 1 ? "PaymentVoucherSummaryWithChequeReport.aspx?" : 'PaymentSummaryCustomReport.aspx?';
    // } else {
    //   this.reportPageName = number == 1 ? "PaymentVoucherSummaryReport.aspx?" : 'PaymentSummaryCustomReport.aspx?';
    // }
    this.reportPageName = number == 1 ? "PaymentVoucherSummaryReport.aspx?" : 'PaymentSummaryCustomReport.aspx?';
    this.reportPageName += "LoginID=" + this.currentUser;
  }
  onSubmit() {
    if (this.frm.invalid) {
      return;
    }

    this.url = environment.baseReportUrl + this.currentUrl;

    let total = 0;
    this.checklistItems.forEach(item => {
      const control = this.frm.get(`Purpose_${item.value}`);
      if (control?.value) {
        total += Math.pow(2, item.value);
      }
    });

    let localURL = "";
    localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value);
    localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value);
    localURL += "&Bank=" + (this.frm.get("Bank")?.value ?? 0);
    localURL += "&PaymentType=" + (this.frm.get("PaymentType")?.value ?? 0);
    localURL += "&Branch=" + (this.frm.get("Branch")?.value ?? 0);
    localURL += "&Purpose=" + total;

    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.url + this.reportPageName + localURL
    );
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
