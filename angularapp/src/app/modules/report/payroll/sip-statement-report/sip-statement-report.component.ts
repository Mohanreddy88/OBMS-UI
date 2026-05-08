import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { EmployeeSip } from 'src/app/model/EmployeeSip';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-sip-statement-report',
  templateUrl: './sip-statement-report.component.html',
  styleUrls: ['./sip-statement-report.component.css']
})
export class SipStatementReportComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "PayRoll/"
  reportPageName: string = "";
  frm!: FormGroup;
  branchList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  dtAdvanceDate!: string;
  employeeSipArray: EmployeeSip[] = [];
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];

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
    private _dataService: DatasharingService, private router: Router, private _payrollService: PayrollModuleService
  ) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.url += this.currentUrl;

    this.frm = fb.group({
      Branch: ["", Validators.required],
      Period: ["", Validators.required],
      EmployeeType: ["Guard", Validators.required],
      EmpTempType: ['8']
    })
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
      this.branchList = [...this.filteredBranchList];
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
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
              this.filteredBranchList = [...this.branchList];
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
  generateFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branchCode = this.frm.get('Branch')?.value;
    const employeeType = this.frm.get('EmployeeType')?.value;
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.generateSIPToTextFile(branchCode, this.dtAdvanceDate, employeeType)
    }
  }
  // Generate SIP to Text File
  generateSIPToTextFile(branch: string, period: string, employeeType: string): void {
    const PayType = environment.PayTypeSIP;
    const dtPeriod = new Date(period);
    if (dtPeriod.getFullYear() >= 2018) {
      this.errorMessage = '';
      const companyRegNumber = environment.CompanyRegNumber; // Replace with actual value

      // Dynamically fetch SIPCompanyCode from getConfig
      this._payrollService.getConfig('SOCSO', branch).subscribe(
        (configResponse) => {
          const sipCompanyCode = Array.isArray(configResponse) && configResponse.length
            ? configResponse[0].Value
            : environment.SocsoCompanyCode;
          this._payrollService.getSIPToCIMBList(companyRegNumber, sipCompanyCode, branch, period, employeeType)
            .subscribe(
              (data) => {
                const fileName = `${PayType}_${PayType}_${period.replace(/-/g, '')}_${Date.now()}_${this.currentUser}.txt`;
                this.downloadFile(data, fileName);
              },
              (error) => {
                console.error('Error generating SIP text file:', error);
              }
            );
        },
        (error) => {
          console.error('Error fetching config for SIP:', error);
        }
      );
    } else {
      this.errorMessage = 'SIP is not available before 2018!';
    }
  }
  generateExcelFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branchCode = this.frm.get('Branch')?.value;
    const companyRegNumber = environment.CompanyRegNumber;
    const socsoCompanyCode = environment.SocsoCompanyCode;
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.getSIPToExcelGeneration(companyRegNumber, socsoCompanyCode, this.dtAdvanceDate, branchCode)
    }
  }
  // Method for the third endpoint
  getSIPToExcelGeneration(companyRegNumber: string, socsoCompanyCode: string, dtSalaryPeriod: string, branchCode: string): void {
    this._payrollService
      .getSIPToExcel(companyRegNumber, socsoCompanyCode, dtSalaryPeriod, branchCode)
      .subscribe({
        next: (data: any[]) => {
          data.forEach((item: any) => {
            const employee: any = {};          
            employee.SSM = item.SSM || '';
            employee.CompanyCode = item.CompanyCode || '';
            employee.EMPICNO = item.EMPICNO || '';
            employee.EmployeeName = item.EmployeeName || '';
            // employee.Period = new Date(item.Period) || new Date();
            employee.Period = item.Period || '';
            employee.SIPTotal = item.SIPTotal || '';
            employee.EMPJoinDate = item.EMPJoinDate ? new Date(item.EMPJoinDate) : null;
            employee.EmpStatus = item.EmpStatus || '';
            this.employeeSipArray.push(employee);
          });

          console.log(data);

          // Define custom headers
          const headers = [
            ['Kod Majikan', 'My CoID/SSM', 'No. Kad Pengenalan', 'Name Pekerja', 'Bulan Carum', 'Bulan Caruman', 'Tarikh Mula Kerja', 'Status Pekerjaan']
          ];

          // Convert employee data to array format for XLSX
          const employeeData = this.employeeSipArray.map((employee) => [
            employee.SSM,
            employee.CompanyCode,            
            employee.EMPICNO,
            employee.EmployeeName,
            employee.Period,
            employee.SIPTotal,
            employee.EMPJoinDate ? employee.EMPJoinDate.toISOString().split('T')[0] : '',
            employee.EmpStatus,
          ]);

          // Combine headers and employee data
          const combinedData = [...headers, ...employeeData];

          // Create worksheet and workbook
          const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(combinedData);
          const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };

          // Write Excel file
          const formattedDate = new Date(this.dtAdvanceDate).toISOString().split('T')[0];
          const fileName = `${environment.PayTypeSIP.toUpperCase()}_${formattedDate}.xls`;
          XLSX.writeFile(workbook, fileName);
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
        }
      });
  }
  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString',
    listProp: 'branchList',
    filteredListProp: 'filteredBranchList',
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
  // Utility method to download a text file
  private downloadFile(data: string[], fileName: string): void {
    const blob = new Blob([data.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
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
