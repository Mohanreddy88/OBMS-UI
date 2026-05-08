import { Component, OnInit } from '@angular/core';
import {environment} from "../../../../../environments/environment";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MastermoduleService} from "../../../../service/mastermodule.service";
import {InventoryService} from "../../../../service/inventory.service";
import {EmployeeService} from "../../../../service/employee.service";
import { Router, NavigationEnd } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

@Component({
  selector: 'app-credit-note-summary',
  templateUrl: './credit-note-summary.component.html',
  styleUrls: ['./credit-note-summary.component.css']
})
export class CreditNoteSummaryComponent implements OnInit {

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

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService, private empService: EmployeeService, 
    private fb: FormBuilder,private router: Router, private _dataService: DatasharingService) {    
    this.frm = fb.group({
      Branch: ["",Validators.required],
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
    this.getUserAccessRights(this.currentUser, 'Credit Note Summary Report');
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
    this.reportPageName = number == 1 ? "CreditNoteReport.aspx?" : 'InvoiceCollectionTotalReportNoTax.aspx?';
    this.reportPageName += "LoginID=" + this.currentUser;
  }

  onSubmit() {
    this.url = environment.baseReportUrl;
    this.url += this.currentUrl;
    let localURL = "";
    if (this.frm.invalid) {
      return;
    }

    localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
    localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
    localURL += "&Branch=" + (this.frm.get("Branch")?.value ?? 0)

    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url +  this.reportPageName + localURL);

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
