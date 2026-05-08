import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { EmployeeEpf } from 'src/app/model/EmployeeEpf';
import { EmployeeEpfApi } from 'src/app/model/EmployeeEpfApi';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-epf-statement-report',
  templateUrl: './epf-statement-report.component.html',
  styleUrls: ['./epf-statement-report.component.css']
})
export class EpfStatementReportComponent implements OnInit {
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
  reportType!: number;
  employeeEPFArray: EmployeeEpf[] = [];
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
  clkBtn(number: number) {
    this.reportType = number === 1 ? 1 : number === 2 ? 2 : number === 3 ? 3 : number === 4 ? 4 : 5;
    this.reportPageName = "EPFReport.aspx?"
  }
  onSubmit() {
    let localURL = "";
    if (this.frm.invalid) {
      return;
    }
    if (this.reportType == 1 || this.reportType == 2 || this.reportType == 3) {
      localURL += "Branch=" + this.frm.get("Branch")?.value
      localURL += "&Period=" + this.dtAdvanceDate
      localURL += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
      localURL += "&ReportType=" + this.reportType
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
    } else if (this.reportType == 4) {
      let dtAdvanceDate = new Date(this.frm.value.Period);
      this.dtAdvanceDate = this.formatDate(
        new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
      );
      const branchCode = this.frm.get('Branch')?.value;
      const employeeType = this.frm.get('EmployeeType')?.value;
      this.generateEPFToTextFile(branchCode, this.dtAdvanceDate, employeeType);
    } else if (this.reportType == 5) {
      this.generateExcelFileClick();
    }
  }

  generateExcelFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branchCode = this.frm.get('Branch')?.value;
    const employeeType = this.frm.get('EmployeeType')?.value;
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.getEPFToExcelGeneration(branchCode, this.dtAdvanceDate, employeeType)
    }
  }
  // Generate EPF to Text File
  generateEPFToTextFile(branch: string, period: string, employeeType: string): void {
    const companyPIC = environment.CompanyPIC // Replace with actual value
    const companyPICContact = environment.CompanyPICContact; // Replace with actual value
    const companyCode = environment.CompanyCode

    // Dynamically fetch companyEPF from getConfig
    this._payrollService.getConfig('KWSP', branch).subscribe(
      (configResponse) => {
        const companyEPF = Array.isArray(configResponse) && configResponse.length
          ? configResponse[0].Value
          : environment.CompanyEPF;
        this._payrollService.getEPFToCIMBList(branch, period, employeeType, companyEPF, companyPIC, companyPICContact)
          .subscribe(
            (data) => {
              const fileName = `${environment.PayTypeEPF}_${environment.PayTypeEPF}_${period.replace(/-/g, '')}_${Date.now()}_${this.currentUser}.txt`;
              this.downloadFile(data, fileName);
            },
            (error) => {
              console.error('Error generating EPF text file:', error);
            }
          );
      },
      (error) => {
        console.error('Error fetching config for EPF:', error);
      }
    );
  }

  // Method for the third endpoint
  getEPFToExcelGeneration(branch: string, dtSalaryPeriod: string, employeeType: string): void {
    this._payrollService
      .getEPFToExcel(branch, dtSalaryPeriod, employeeType)
      .subscribe({
        next: (data: any[]) => {
          data.forEach((item) => {
            const employee = new EmployeeEpf();  // Create a new instance of EmployeeSosco

            // Manually assign values to the employee object
            employee.EmployeeName = item.EmployeeName || '';
            employee.EMPICNO = item.EMPICNO || '';
            employee.EPFNO = item.EPFNO || '';
            employee.Salary = item.Salary;
            employee.EPFEmployee = item.EPFEmployee || 0;
            employee.EPFEmployer = item.EPFEmployer || 0;

            // Push the manually populated employee object to the array
            this.employeeEPFArray.push(employee);
          });
          this.exportToExcel();
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
        }
      });
  }
  exportToExcel() {
    const formattedDate = new Date(this.dtAdvanceDate).toISOString().split('T')[0];
    const fileName = `${environment.PayTypeEPF.toUpperCase()}_${formattedDate}.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.employeeEPFArray);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, fileName);
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
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}


