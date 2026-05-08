import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, forkJoin, map, Observable, of, Subject, switchMap } from 'rxjs';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { AgreementService } from 'src/app/modules/quotation-and-agreement/agreement.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-monthly-advance',
  templateUrl: './new-employee-monthly-advance.component.html',
  styleUrls: ['./new-employee-monthly-advance.component.css']
})
export class NewEmployeeMonthlyAdvanceComponent implements OnInit {
  employeeAdvanceForm!: FormGroup;
  dynamicForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  employeeAdvanceTitleStatus: string = 'new';
  branchCode: string = 'null';
  clientCode: string = 'null';
  branchModel!: BranchModel[];
  employeeModel!: EmployeeMonthlyAdvance[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  minDate = new Date();
  year!: number;
  month!: number;
  currentUser: string = '';
  errorMessage: string = '';
  userAccessModel!: UserAccessModel;
  empId: number = 0;
  dtAdvanceDate!: string;
  clientList: any;
  branchSearchString: string = '';
  clientSearchString: string = '';
  filteredBranchList: any[] = [];
  filteredClientList: any[] = [];
  branchSearchSubject = new Subject<string>();
  clientSearchSubject = new Subject<string>();
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;


  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router, public service: AgreementService,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService) {
    this.employeeAdvanceForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      AdvanceTakenDate: [this.formatDate(new Date)],
      AdvanceDate: [this.formatDate(new Date)],
      VoucherNo: [''],
      BranchCode: [''],
      Amount: ['', [twoDecimalPlacesValidator()]],
      NoOfInstallments: ['1'],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['1'],
      EmployeeType: ['Guard'],
      Race: ['All'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
      Client: ['']
    });

    this.salaryMonthlyAdvance.ID = 0;
    this.salaryMonthlyAdvance.EmployeeID = 0;
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date();
    this.salaryMonthlyAdvance.AdvanceDate = new Date();
    this.salaryMonthlyAdvance.VoucherNo = '';
    this.salaryMonthlyAdvance.Amount = 0;
    this.salaryMonthlyAdvance.NoOfInstallments = 0;
    this.salaryMonthlyAdvance.PaymentType = '';
    this.salaryMonthlyAdvance.Particulars = '';
    this.salaryMonthlyAdvance.TransType = 1;
    this.salaryMonthlyAdvance.IsDeleted = false;
    this.salaryMonthlyAdvance.LastUpdate = new Date();
    this.salaryMonthlyAdvance.LastUpdatedBy = '';

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

    this.staffAdminAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == '1') {
      this.userRole = 'admin'
    } else if (this.userRole == '2') {
      this.userRole = 'superadmin'
    } else {
      this.userRole = 'user'
    }
    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = [...this.filteredBranchList];
    });

    // Client search debounce
    this.clientSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.clientSearchString = '';
      this.clientList = [...this.filteredClientList];
    });

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        this.getBranchMasterListByUser(this.currentUser);
      });
    } else {
      this.getBranchMasterListByUser(this.currentUser);
    }
    this.getUserAccessRights(this.currentUser);
    this.getEmployeeMasterList();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.employeeAdvanceTitleStatus = 'edit';
        this.getEmployeeListById(params['empid'], params['id']);
      }
    });
    // ... after fetching staffAdminAccessModel
    if (!this.staffAdminAccessModel.readAccess && this.employeeAdvanceForm.value.EmployeeType === 'Staff') {
      this.employeeAdvanceForm.patchValue({ EmployeeType: 'Guard' });
    }
    this.createForm();
  }
  createForm() {
    this.dynamicForm = this.fb.group({
      formArray: this.fb.array([])
    });
  }
  get formArray() {
    return (this.dynamicForm.get('formArray') as FormArray).controls;
  }
  isEmployeeIdValid(): boolean {

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const formGroup = formArray.at(i) as FormGroup;
      this.empId = formGroup.get('ID')?.value;
    }

    // Return true or false based on your conditions
    return this.empId == 0 ? false : true; // Modify this logic as needed

  }
  // getUserAccessRights(userName: string, screenName: string) {
  //   this.showLoadingSpinner = true;
  //   this._masterService.getUserAccessRights(userName, screenName).subscribe(
  //     (data) => {
  //       if (data != null) {
  //         this.userAccessModel.readAccess = data.Read
  //         this.userAccessModel.deleteAccess = data.Delete;
  //         this.userAccessModel.updateAccess = data.Update;
  //         this.userAccessModel.createAccess = data.Create;
  //       }
  //     },
  //     (error) => {
  //       this.handleErrors(error);
  //     }
  //   );
  // }


  getUserAccessRights(userName: string) {
    forkJoin({
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Monthly Salary Advance'),
      staffAdminAccess: this._masterService.getUserAccessRights(userName, 'Payroll Staff Admin')
    }).subscribe({
      next: (res: any) => {

        if (res.employeeAccess) {
          this.userAccessModel = {
            readAccess: res.employeeAccess.Read,
            updateAccess: res.employeeAccess.Update,
            deleteAccess: res.employeeAccess.Delete,
            createAccess: res.employeeAccess.Create
          };
        }

        if (res.staffAdminAccess) {
          this.staffAdminAccessModel = {
            readAccess: res.staffAdminAccess.Read,
            updateAccess: res.staffAdminAccess.Update,
            deleteAccess: res.staffAdminAccess.Delete,
            createAccess: res.staffAdminAccess.Create
          };
        }
      },
      error: (error) => {
        this.handleErrors(error);
      }
    });
  }
  addFormFieldsdata(data: any) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    for (let i = 0; i < data.length; i++) {
      formArray.push(this.fb.group({
        ID: [data[i].ID],
        EMP_ID: [data[i].EMP_ID],
        EMP_NAME: [data[i].EMP_NAME],
        EMP_IC_NEW: [data[i].EMP_IC_NEW + data[i].EMP_PASSPORT_NO],
        EMP_IC_OLD: [data[i].EMP_IC_OLD],
        EMP_PASSPORT_NO: [data[i].EMP_PASSPORT_NO],
        EMPFL_BANK: [data[i].EMPFL_BANK],
        EMPFL_BK_ACCNO: [data[i].EMPFL_BK_ACCNO],
        PAYMODE: [data[i].PAYMODE],
        Amount: [data[i].Amount],
        Particulars: [data[i].Particulars],
      }));
    }
  }
  getBranchMasterList() {
    this._masterService.getBranchMaster('null').subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
        this.filteredBranchList = [...this.branchModel];
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getEmployeeMasterList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    if (!event.value) return;

    const formatted = this.formatDate(event.value);
    this.employeeAdvanceForm.patchValue({ AdvanceDate: formatted });

    this.loadEmployeeData(true); // Date affects voucher
  }
  onBranchSelectionChange(event: any) {
    const branch = event.value;

    if (!branch) {
      const formArray = this.dynamicForm.get('formArray') as FormArray;
      formArray.clear();
      this.clientList = [];
      return;
    }

    this.branchCode = branch;

    // Load clients for selected branch
    this.service.getClientsByBranchID(branch, this.currentUser!).subscribe({
      next: (clientData: any) => {
        this.clientList = clientData['clients'];
        this.filteredClientList = [...this.clientList];
      },
      error: (err) => console.error('Error loading clients:', err)
    });

    this.loadEmployeeData(true); // Branch affects voucher
  }
  onClientChange(clientCode: any) {
    this.employeeAdvanceForm.patchValue({ Client: clientCode });
    this.loadEmployeeData(false);
  }
  radioButtonTypeSelectionChange(event: any) {
    this.employeeAdvanceForm.patchValue({ EmployeeType: event.value });
    this.errorMessage = '';
    this.loadEmployeeData(false);
  }
  radioButtonRaceSelectionChange(event: any) {
    this.employeeAdvanceForm.patchValue({ Race: event.value });
    this.loadEmployeeData(false);
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString' | 'clientSearchString',
    listProp: 'branchModel' | 'clientList',
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
  private loadEmployeeData(triggerVoucher: boolean = false) {
    this.showLoadingSpinner = true;
    const advanceDateRaw = this.employeeAdvanceForm.get('AdvanceDate')?.value;
    const branchCode = this.employeeAdvanceForm.get('BranchCode')?.value;
    const client = this.employeeAdvanceForm.get('Client')?.value;
    const employeeType = this.employeeAdvanceForm.get('EmployeeType')?.value;
    const race = this.employeeAdvanceForm.get('Race')?.value;

    // Stop spinner if required fields missing
    if (!advanceDateRaw || !branchCode) {
      this.clientList = [];
      this.hideSpinner();
      return;
    }

    const advanceDate = this.formatDate(advanceDateRaw);
    this.dtAdvanceDate = advanceDate;

    if (client && client !== 0) {
      forkJoin({
        employeeList: this._payrollService.getEmployeeAdvanceList(advanceDate, branchCode, employeeType, client, 1, 0, race)
      }).subscribe(
        ({ employeeList }) => {
          this.addFormFieldsdata(employeeList);
          this.hideSpinner();
        },
        (error) => {
          this.handleErrors(error);
          this.hideSpinner();
        }
      );
    } else {
      this.getEmployeeListByEmployeeType(advanceDate, branchCode, employeeType, 1, 0, race);
    }

    // Voucher reload only when date or branch changes
    if (triggerVoucher) {
      this.getAdvanceVoucherNo(branchCode, '1');
    }
  }

  getEmployeeListById(empid: number, id: number): void {
    this.showLoadingSpinner = true;
    this._payrollService.getSalaryAdvanceById(empid, id).subscribe(
      (data) => {
        this._payrollService.getEmployeeListByAdvanceID(data[0].ID).subscribe(
          (data) => {
            this.addFormFieldsdata(data);
          },
          (error) => this.handleErrors(error)
        );
        this.employeeAdvanceForm.patchValue({
          ID: data[0].ID,
          EmployeeID: data[0].EmployeeID,
          AdvanceTakenDate: this.formatDate(data[0].AdvanceTakenDate),
          AdvanceDate: this.formatDate(data[0].AdvanceDate),
          VoucherNo: data[0].VoucherNo,
          Amount: data[0].Amount,
          NoOfInstallments: data[0].NoOfInstallments,
          PaymentType: data[0].PaymentType,
          Particulars: data[0].Particulars,
          TransType: data[0].TransType,
          IsDeleted: data[0].IsDeleted,
          LastUpdate: this.formatDate(data[0].LastUpdate),
          LastUpdatedBy: data[0].LastUpdatedBy,
        });
        this._payrollService.getEmployeeById(empid).subscribe(
          (data) => {
            this.employeeAdvanceForm.patchValue({
              BranchCode: data[0].EMP_BRANCH_CODE
            });
          });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getEmployeeListByEmployeeType(dvanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): void {
    this._payrollService.getListByEmplyeeType(dvanceDate, branchCode, employeeType, transType, advanceAmount, race).subscribe(
      (data) => {
        this.addFormFieldsdata(data);
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
        this.hideSpinner();
      }
    );
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeAdvanceForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  setButtonClick(): void {
    this.assignSetButtonValues();
  }
  assignSetButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup;
      control.get('Amount')?.patchValue(this.employeeAdvanceForm.value.Amount, { emitEvent: false });
    }
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.salaryMonthlyAdvance = this.employeeAdvanceForm.value;
    this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeAdvanceForm.value.AdvanceDate));

    const dateYear = new Date(this.salaryMonthlyAdvance.AdvanceDate);
    this.year = dateYear.getFullYear();
    const dateMonth = new Date(this.salaryMonthlyAdvance.AdvanceDate);
    this.month = dateMonth.getMonth() + 1;

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const requests = [];
    if (formArray.length > 0) {

      for (let i = 0; i < formArray.length; i++) {
        const formGroup = formArray.at(i) as FormGroup;
        const amount = formGroup.get('Amount')?.value;

        // Skip if Amount is null, empty, or 0
        if (!amount || parseFloat(amount) === 0) {
          continue;
        }

        const salaryAdvance = {
          ...this.salaryMonthlyAdvance,
          ID: formGroup.get('ID')?.value,
          EmployeeID: formGroup.get('EMP_ID')?.value,
          Amount: amount,
          Particulars: formGroup.get('Particulars')?.value,
          PaymentType: formGroup.get('PAYMODE')?.value,
          VoucherNo: (i + 1).toString().padStart(8, '0'),
          LastUpdatedBy: this.currentUser,
        };
        requests.push(this._payrollService.saveAndUpdateSalaryMonthlyAdvance(salaryAdvance));
      }

      if (requests.length === 0) {
        this.showMessage(
          'Please update the amount for this record. The amount cannot be empty or zero. If no amount is required, please delete this record.',
          'warning',
          'Warning Message'
        );
        this.hideSpinner();
        return;
      }
      forkJoin(requests).subscribe(
        (responses) => {
          const failedResponses: any[] = [];

          responses.forEach(response => {
            if (response.True === 'True') {
              this.showMessage(response.Message, 'warning', 'Warning Message');
            } else if (response.ResignDate === 'ResignDate') {
              this.showMessage(response.Message, 'warning', 'Warning Message');
            } else if (response.Success === 'Success') {
              this.showMessage(response.Message, 'success', 'Success Message');
              this._router.navigate(['/payroll/employee-monthly-advance']);
            } else {
              failedResponses.push(response);  // Store failed responses
            }
          });

          if (failedResponses.length > 0) {
            this.handleErrors(`Failed Responses: ${failedResponses}`);
          }

          this._dataService.setUsername(this.currentUser);
          this.hideSpinner();
        },
        (error) => {
          this.handleErrors(error);
        }
      );
    } else {
      this.hideSpinner();
    }
  }

  canSaveEmployee(): boolean {

    const empType = this.employeeAdvanceForm.get('EmployeeType')?.value;

    // Superadmin always allowed
    if (this.userRole === 'superadmin') {
      return true;
    }

    // Staff employee → check staff admin access
    if (empType === 'Staff') {
      return !!(this.staffAdminAccessModel?.createAccess || this.staffAdminAccessModel?.updateAccess);
    }

    // Guard or others → check normal access
    return !!(this.userAccessModel?.createAccess || this.userAccessModel?.updateAccess);
  }
  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px',
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideSpinner();
    return;
  }
  clearEmployeeAdvanceDetails(): void {
    this.employeeAdvanceForm.reset();
    this.employeeAdvanceTitleStatus = 'new';
    this._router.navigate(['/payroll/new-employee-monthly-advance']);

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
