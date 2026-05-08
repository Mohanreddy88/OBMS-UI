import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { ClientModel } from 'src/app/model/clientModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkrole-report',
  templateUrl: './checkrole-report.component.html',
  styleUrls: ['./checkrole-report.component.css']
})
export class CheckroleReportComponent implements OnInit {

  checkRoleForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  clientModel!: ClientModel[];
  currentUser: string = '';
  advanceType: string = '';
  paymentType: string = '';
  errorMessage: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  dtAdvanceDate!: string;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  NoOfHours: number = 0.00;
  clientName: string = '';
  branchSearchString: string = '';
  clientSearchString: string = '';
  filteredBranchList: any[] = [];
  filteredClientList: any[] = [];
  branchSearchSubject = new Subject<string>();
  clientSearchSubject = new Subject<string>();

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private router: Router, private _payrollService: PayrollModuleService) {
    this.checkRoleForm = this.fb.group({
      AdvanceDate: [this.formatDate(new Date)],
      BranchCode: [''],
      ClientCode: [''],
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = [...this.filteredBranchList];
    });

    // Client search debounce
    this.clientSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.clientSearchString = '';
      this.clientModel = [...this.filteredClientList];
    });
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
            this.getBranchMasterListByUser(this.currentUser);
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
    this.checkRoleForm.value.AdvanceDate = this.formatDate(`${type}: ${event.value}`);
    let dtAdvanceDate = new Date(this.checkRoleForm.value.AdvanceDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
  }
  onBranchSelectionChange(event: any) {
    let dtAdvanceDate = new Date(this.checkRoleForm.value.AdvanceDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    this._masterService.getClientMsterListByBranch(event.value).subscribe(
      (data) => {
        this.clientModel = data
        this.filteredClientList = [...this.clientModel];
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onClientSelectionChange(event: any) {
    // Find the selected client from clientModel using event.value
    const selectedClient = this.clientModel.find(client => client.Code === event.value);

    // Assign the client name to clientName property
    this.clientName = selectedClient ? selectedClient.Name : '';

    this._payrollService
      .clientInvoiceCalculation(this.checkRoleForm.get("BranchCode")?.value, event.value, this.dtAdvanceDate)
      .subscribe({
        next: (result) => {
          this.NoOfHours = result.NoOfHours;
        },
        error: (err) => {
          console.error('Error fetching invoice:', err);
        },
      });
  }

  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
        this.showLoadingSpinner = false;
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString' | 'clientSearchString',
    listProp: 'branchModel' | 'clientModel',
    filteredListProp: 'filteredBranchList' | 'filteredClientList',
    keyName: string,
    subject: Subject<string>
  ) {
    const key = event.key;

    this[searchStringProp] = this[searchStringProp] || '';

    if (key.length === 1) {
      this[searchStringProp] += key.toLowerCase();
    } else if (key === 'Backspace') {
      this[searchStringProp] = this[searchStringProp].slice(0, -1);
    } else if (key === 'Escape') {
      this[searchStringProp] = '';
    }

    // Apply filter immediately
    this[listProp] = this.searchDropdown(this[searchStringProp], this[filteredListProp], keyName);

    // Trigger debounce to reset after 2s of inactivity
    subject.next(this[searchStringProp]);
  }
  getReportShowClick(): void {
    this.url = environment.baseReportUrl;
    if (this.checkRoleForm.get("ClientCode")?.value != '' && this.checkRoleForm.get("ClientCode")?.value != undefined) {
      this.url += 'Payroll/CheckRoleReport.aspx?';
    } else {
      this.url += 'Payroll/BranchCheckRoleReport.aspx?';
    }
    this.url += "LoginID=" + this.currentUser;
    this.url += "&Branch=" + this.checkRoleForm.get("BranchCode")?.value
    this.url += "&Client=" + (this.checkRoleForm.get("ClientCode")?.value ?? '')
    this.url += "&Period=" + this.dtAdvanceDate
    this.url += "&NoOfHours=" + this.NoOfHours

    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
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
