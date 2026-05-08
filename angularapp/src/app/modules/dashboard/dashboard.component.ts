import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart")
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/PaymentDueList.aspx?"
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  menuName: string = '';

  constructor(public sanitizer: DomSanitizer, private _dataService: DatasharingService,
    private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this._dataService.getMenuName().subscribe(menu => {
      this.menuName = menu;
      if (menu === 'finance') {
        this.getUserAccessRights(this.currentUser, 'Payment Due List Report');
      }
    });

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
            this.url = environment.baseReportUrl
            this.url += this.currentUrl;
            this.loadFinanceReport();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this report. <br>
                        If you feel you should have access to this report, Please contact administrator. <br>
                        Thank you`;
            this.showLoadingSpinner = false;
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  private loadFinanceReport(): void {
    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == null || this.currentUser == undefined) {
      // optional fallback if username not found
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        sessionStorage.setItem('username', username);
      });
    }

    this.setReportUrl();

  }

  private setReportUrl(): void {
    this.url += "LoginID=" + this.currentUser;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false
    }
  }
}
