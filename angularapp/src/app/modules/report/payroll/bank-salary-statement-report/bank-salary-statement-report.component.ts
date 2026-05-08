import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import { BankListModel } from 'src/app/model/bankListModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-bank-salary-statement-report',
  templateUrl: './bank-salary-statement-report.component.html',
  styleUrls: ['./bank-salary-statement-report.component.css']
})
export class BankSalaryStatementReportComponent implements OnInit {
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
  reportType!: any;
  dtPeriod!: string;
  salaryAdvanceList: string[] = [];
  salaryAdvanceTotalList: string[] = [];
  salaryAdvanceHashTotalList: string[] = [];
  salaryList: any[] = [];
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];
  bankSearchSubject = new Subject<string>();
  bankSearchString: string = '';
  filteredBankList: any[] = [];

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
    private _dataService: DatasharingService, private _commonService: CommonService, private router: Router,
    private _payrollService: PayrollModuleService
  ) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.url += this.currentUrl;

    this.frm = fb.group({
      Branch: ["0"],
      BankCode: ['0'],
      Period: ["", Validators.required],
      EmployeeType: ["Guard", Validators.required],
      EmpTempType: ['8'],
      PaymentType: ['Salary']
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

    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.bankSearchString = '';
      this.bankList = [...this.filteredBankList];
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
            this._commonService.getUserBankList(this.currentUser).subscribe(bankList => {
              this.bankList = bankList;
              this.filteredBankList = [...this.bankList];
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
  onSubmit() {
    let localURL = "";
    if (this.frm.invalid) {
      return;
    }
    if (this.reportType == 1) {
      localURL += "Branch=" + this.frm.get("Branch")?.value
      localURL += "&LoginID=" + this.currentUser
      localURL += "&Period=" + this.dtAdvanceDate
      localURL += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
      localURL += "&Bank=" + this.frm.get("BankCode")?.value
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
    } else if (this.reportType == 2) {
      localURL += "Branch=" + this.frm.get("Branch")?.value
      localURL += "&LoginID=" + this.currentUser
      localURL += "&Period=" + this.dtAdvanceDate
      localURL += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
      localURL += "&Bank=" + this.frm.get("BankCode")?.value
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
    } else if (this.reportType == 3) {
      localURL += "Branch=" + this.frm.get("Branch")?.value
      localURL += "&LoginID=" + this.currentUser
      localURL += "&Period=" + this.dtAdvanceDate
      localURL += "&EmployeeType=" + this.frm.get("EmployeeType")?.value
      localURL += "&Bank=" + this.frm.get("BankCode")?.value
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + this.reportPageName + localURL);
    } else if (this.reportType == undefined) {

    }
    else {
      this.generateDataToTextFile(this.reportType);
    }
  }

  clkBtn(number: number) {
    this.reportType = number === 1 ? 1 : number === 2 ? 2 : number === 3 ? 3 :
      number === 4 ? 'StandardSalary' : number === 5 ? 'SalaryGuard1' : 'SalaryGuard2';
    this.reportPageName = number == 1 ? "BankSalaryReport.aspx?" : number == 2 ? 'BankSalaryReportGuard1.aspx?' :
      number == 3 ? 'BankSalaryReportGuard2.aspx?' : '';
  }

  generateDataToTextFile(source: string): void {
    try {
      // Parse the attendance date to get the last day of the month
      //const inputDate = new Date(this.txtAttendanceDate);
      //const dtPeriod = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0); // Last day of the month
      let dtAdvanceDate = new Date(this.frm.value.Period);
      this.dtPeriod = this.formatDate(
        new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
      );
      const branchCode = this.frm.get('Branch')?.value == '' ? '0' : this.frm.get('Branch')?.value;
      const employeeType = this.frm.get('EmployeeType')?.value;
      const bank = this.frm.get('BankCode')?.value == '' ? '0' : this.frm.get('BankCode')?.value;
      const payType = "Salary";
      const companyCode = environment.CompanyCode.toUpperCase().trim(); // Replace with actual environment variable service
      const currentDateTime = new Date();

      // Construct the file name
      const fileName = `${companyCode}_${payType}_${this.formatdDate(dtAdvanceDate, 'ddMMyyyy')}_${this.formatdDate(currentDateTime, 'ddMMyyyyhhMMss')}_${this.currentUser}`; // Replace `userService` with actual user identity service
      const filePath = `C:/temp/${fileName}.txt`;

      // Fetch data based on branch selection
      // if (branchCode !== '0') {
      //   this._payrollService
      //     .getEmployeeSalaryAdvanceListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //     .subscribe((data) => {
      //       setTimeout(() => {
      //         this.salaryAdvanceList = data;
      //       });

      //       this._payrollService
      //         .getEmployeeSalaryAdvanceTotalListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //         .subscribe((totalData) => {
      //           setTimeout(() => {
      //             this.salaryAdvanceTotalList = totalData;
      //           });

      //           this._payrollService
      //             .getEmployeeSalaryAdvanceHashTotalListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //             .subscribe((hashData) => {
      //               setTimeout(() => {
      //                 this.salaryAdvanceHashTotalList = hashData;
      //               });
      //             });
      //         });
      //     });
      // } else {
      //   this._payrollService
      //     .getEmployeeSalaryAdvanceList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //     .subscribe((data) => {
      //       setTimeout(() => {
      //         this.salaryAdvanceList = data;
      //       });
      //       this._payrollService
      //         .getEmployeeSalaryAdvanceTotalList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //         .subscribe((totalData) => {
      //           setTimeout(() => {
      //             this.salaryAdvanceTotalList = totalData;
      //           });
      //           this._payrollService
      //             .getEmployeeSalaryAdvanceHashTotalList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      //             .subscribe((hashData) => {
      //               setTimeout(() => {
      //                 this.salaryAdvanceHashTotalList = hashData;
      //               });
      //             });
      //         });
      //     });
      // }      

      // if (this.salaryAdvanceList.length > 0) {
      //   let fileContent = '';

      //   // Header record
      //   if (bank === 'CIMB') {
      //     fileContent += this.generateHeaderRecordCIMB() + '\n';
      //   } else if (bank.toUpperCase() === 'RHB') {
      //     fileContent += 'header0000\n';
      //   } else if (bank.toUpperCase() === 'BSN') {
      //     fileContent += this.generateHeaderRecordBSN() + '\n';
      //   } else {
      //     fileContent += this.generateHeaderRecordCIMB() + '\n';
      //   }

      //   // Detail records
      //   this.salaryAdvanceList.forEach((detail) => {
      //     if (bank.toUpperCase() === 'CIMB') {
      //       fileContent += this.generateDetailRecordCIMB(detail) + '\n';
      //     } else {
      //       fileContent += detail + '\n';
      //     }
      //   });

      //   // Trailer records
      //   this.salaryAdvanceTotalList.forEach((total) => {
      //     if (bank.toUpperCase() === 'CIMB') {
      //       fileContent += this.generateTrailerRecordCIMB(total) + '\n';
      //     } else if (bank.toUpperCase() === 'RHB') {
      //       fileContent += 'Footer000000000\n';
      //     } else if (bank.toUpperCase() === 'BSN') {
      //       fileContent += this.generateTrailerRecordBSN(total, this.salaryAdvanceHashTotalList) + '\n';
      //     } else {
      //       fileContent += this.generateTrailerRecordCIMB(total) + '\n';
      //     }
      //   });

      //   // Write content to file and download
      //   this.downloadFile(fileContent, fileName);

      //   this.showMessage(`Text File Successfully Generated to ${filePath.toUpperCase().trim()}`, 'success');
      // } else {
      //   this.showMessage('NO RECORD FOUND!', 'warning');
      // }

      forkJoin({
        salaryAdvanceList: branchCode !== '0'
          ? this._payrollService.getEmployeeSalaryAdvanceListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
          : this._payrollService.getEmployeeSalaryAdvanceList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source),
        salaryAdvanceTotalList: branchCode !== '0'
          ? this._payrollService.getEmployeeSalaryAdvanceTotalListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
          : this._payrollService.getEmployeeSalaryAdvanceTotalList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source),
        salaryAdvanceHashTotalList: branchCode !== '0'
          ? this._payrollService.getEmployeeSalaryAdvanceHashTotalListWithBranch(branchCode, this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
          : this._payrollService.getEmployeeSalaryAdvanceHashTotalList(this.dtPeriod, employeeType, bank.toUpperCase(), payType, companyCode, source)
      }).subscribe(
        ({ salaryAdvanceList, salaryAdvanceTotalList, salaryAdvanceHashTotalList }) => {
          // Assigning values
          this.salaryAdvanceList = salaryAdvanceList || [];
          this.salaryAdvanceTotalList = salaryAdvanceTotalList || [];
          this.salaryAdvanceHashTotalList = salaryAdvanceHashTotalList || [];

          // Check for data availability
          if (this.salaryAdvanceList.length > 0) {
            this.generateAndDownloadFile(bank, fileName, filePath);
          } else {
            this.showMessage('NO RECORD FOUND!', 'warning');
          }
        },
        (error) => {
          this.showMessage(`Error retrieving data: ${error.message}`, 'error');
        }
      );
    } catch (error) {
      this.showMessage(`Error Found: ${error}`);
    }
  }
  generateExcelFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtPeriod = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branch = this.frm.get('Branch')?.value == '' ? '0' : this.frm.get('Branch')?.value;
    const client = ''
    const employeeType = this.frm.get('EmployeeType')?.value;
    const empTempType = this.frm.get('EmpTempType')?.value;
    const bank = this.frm.get('BankCode')?.value == '' ? '0' : this.frm.get('BankCode')?.value;
    const paymentType = this.frm.get('PaymentType')?.value;
    const source = '';
    forkJoin({
      salaryList: this._payrollService.getSalaryList(this.dtPeriod, branch, client, bank, paymentType, employeeType, empTempType, source),

    }).subscribe({
      next: (results) => {
        this.salaryList = results.salaryList;
        this.downloadExcel();
      },
      error: (err) => {
        console.error('Error loading data', err);
      }
    });

  }
  generateAndDownloadFile(bank: string, fileName: string, filePath: string): void {
    let fileContent = '';

    // Header record
    if (bank.toUpperCase() === 'CIMB') {
      fileContent += this.generateHeaderRecordCIMB() + '\n';
    } else if (bank.toUpperCase() === 'RHB') {
      fileContent += 'header0000\n';
    } else if (bank.toUpperCase() === 'BSN') {
      fileContent += this.generateHeaderRecordBSN() + '\n';
    } else {
      fileContent += this.generateHeaderRecordCIMB() + '\n';
    }

    // Detail records
    this.salaryAdvanceList.forEach((detail) => {
      if (bank.toUpperCase() === 'CIMB') {
        fileContent += this.generateDetailRecordCIMB(detail) + '\n';
      } else {
        fileContent += detail + '\n';
      }
    });

    // Trailer records
    this.salaryAdvanceTotalList.forEach((total) => {
      if (bank.toUpperCase() === 'CIMB') {
        fileContent += this.generateTrailerRecordCIMB(total) + '\n';
      } else if (bank.toUpperCase() === 'RHB') {
        fileContent += 'Footer000000000\n';
      } else if (bank.toUpperCase() === 'BSN') {
        fileContent += this.generateTrailerRecordBSN(total, this.salaryAdvanceHashTotalList) + '\n';
      } else {
        fileContent += this.generateTrailerRecordCIMB(total) + '\n';
      }
    });

    // Write content to file and download
    this.downloadFile(fileContent, fileName);

    // Notify success
    this.showMessage(`Text File Successfully Generated to ${filePath.toUpperCase().trim()}`, 'success');
  }
  downloadExcel(): void {
    if (!this.salaryList || this.salaryList.length === 0) {
      console.warn('No data to export');
      this.showMessage(`No data to export`, 'warning')
      return;
    }

    // Re-map & sanitize data
    const orderedData = this.salaryList.map((item: any) => ({
      Name: item.Name,
      Extra1: "",
      AccountNo: item.AccountNo ? item.AccountNo.replace(/'/g, '') : '',
      Amount: item.Salary,
      Extra2: "",
      SecurityNo: item.SecurityNo ? item.SecurityNo.replace(/'/g, '').trim() : ''
    }));

    // Convert JSON to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(orderedData, {
      skipHeader: true
    });

    // Add borders to all cells
    const range = XLSX.utils.decode_range(worksheet['!ref']!); // get range of cells
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { r: R, c: C };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!worksheet[cellRef]) continue;

        worksheet[cellRef].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }

    // Auto width for all columns
    const colWidths = Object.keys(orderedData[0]).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...orderedData.map((d) => ((d as any)[key] ? (d as any)[key].toString().length : 0))
      );
      return { wch: maxLength + 2 }; // add some padding
    });
    worksheet['!cols'] = colWidths;

    // Workbook
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };

    // Generate buffer
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });

    // Filename
    const safePeriod = this.dtPeriod.replace(/[\/,:]/g, '_');
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const currentTime = `${String(hours).padStart(2, '0')}_${minutes}_${seconds}_${ampm}`;

    const fileName = `${this.frm.get('PaymentType')?.value}_${this.frm.get('BankCode')?.value}_${safePeriod} ${currentTime}.xlsx`;

    // Save file
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
    FileSaver.saveAs(data, fileName);
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString' | 'bankSearchString',
    listProp: 'branchList' | 'bankList',
    filteredListProp: 'filteredBranchList' | 'filteredBankList',
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

  // private generateHeaderRecordCIMB(): string {
  //   return `01${environment.CIMB_OrganizationCode}${environment.CIMB_OrganizationName}${this.formatdDate(new Date(), 'ddMMyyyy')}${environment.CIMB_SecurityCode}`;
  // }
  private generateHeaderRecordCIMB(): string {
    return this.padRight('01', 2) +
      this.padRight(environment.CIMB_OrganizationCode, 5) +
      this.padRight(environment.CIMB_OrganizationName, 40) +
      this.padRight(this.formatdDate(new Date(), 'ddMMyyyy'), 8) +
      this.padRight(environment.CIMB_SecurityCode, 16) +
      this.padRight('', 2);
  }
  private generateHeaderRecordBSN(): string {
    return `SGB${environment.BSN_OrganizationCode}${environment.BSN_OrganizationName}${this.formatdDate(new Date(), 'ddMMyyyy')}0000000000000000000000000000000000000000000000000000`;
  }

  // private generateDetailRecordCIMB(detail: string): string {
  //   return `02${environment.CIMB_BNMCode}${detail}  `;
  // }

  private generateDetailRecordCIMB(detail: string): string {
    return this.padRight('02', 2) +
      this.padRight(environment.CIMB_BNMCode, 7) +
      detail +
      this.padRight('', 20); // IMPORTANT
  }

  // private generateTrailerRecordCIMB(total: string): string {
  //   return `03${total}  `;
  // }

  private generateTrailerRecordCIMB(total: string): string {
    return this.padRight('03', 2) +
      total;
  }

  private generateTrailerRecordBSN(total: string, hashTotals: string[]): string {
    let record = `END${total}`;
    hashTotals.forEach((hash) => {
      record += hash;
    });
    record += `0000000000000000000000000000000000000000000000000000000000`;
    return record;
  }
  private formatdDate(date: Date, format: string): string {
    const options: any = {
      ddMMyyyy: `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`,
      ddMMyyyyhhMMss: `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`,
    };
    return options[format];
  }
  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: icon,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px',
      customClass: {
        popup: 'swal-top-offset'
      }
    });
  }

  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private padRight(value: string, length: number): string {
    value = value || '';
    return value.length >= length
      ? value.substring(0, length)
      : value + ' '.repeat(length - value.length);
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
