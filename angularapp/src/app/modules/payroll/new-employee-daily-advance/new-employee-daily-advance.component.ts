import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, forkJoin, of, Subject } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { EmployeeDailyAdvance } from 'src/app/model/EmployeeDailyAdvance';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-daily-advance',
  templateUrl: './new-employee-daily-advance.component.html',
  styleUrls: ['./new-employee-daily-advance.component.css'],
  providers: [
    {
      provide: MAT_SELECT_CONFIG,
      useValue: {
        overlayPanelClass: 'custom-overlay-class',
        disableOptionCentering: true // Ensures the dropdown doesn't scroll excessively
      } as MatSelectConfig
    }
  ]
})
export class NewEmployeeDailyAdvanceComponent implements OnInit {
  employeeDailyForm!: FormGroup;
  dynamicForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  employeeAdvanceTitleStatus: string = 'new';
  branchCode: string = 'null';
  clientCode: string = 'null';
  employeeModel!: EmployeeMonthlyAdvance[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance[] = [new SalaryMonthlyAdvance()];
  minDate = new Date();
  year!: number;
  month!: number;
  EmployeeID!: number;
  employeeDailyAdvance!: EmployeeDailyAdvance;
  branchModel!: BranchModel[];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  employeeListModel!: EmployeeAdvanceListModel[];
  advanceID: number = 0;
  dtAttendanceDate = new Date();
  StartPeriod!: string;
  EndPeriod!: string;
  userRole!: string;
  employeeSearchSubject = new Subject<string>();
  branchSearchSubject = new Subject<string>();
  employeeSearchString: string = '';
  branchSearchString: string = '';
  filteredEmployeeList: any[] = [];
  filteredBranchList: any[] = [];
  staffAdminAccessModel!: UserAccessModel;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
  private formatDisplayDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.employeeDailyForm = this.fb.group({
      ID: [0],
      EmployeeID: ['', [Validators.required]],
      AdvanceTakenDate: [''],
      AdvanceDate: ['', [Validators.required]],
      BranchCode: [''],
      VoucherNo: [''],
      Amount: [''],
      NoOfInstallments: ['1'],
      PaymentType: ['Bank'],
      Particulars: [''],
      EmployeeType: ['None'],
      TransType: ['0'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: [''],
      JoinDate: '',
      ResignedDate: '',
    });
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
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == '1') {
      this.userRole = 'admin'
    } else if (this.userRole == '2') {
      this.userRole = 'superadmin'
    } else {
      this.userRole = 'user'
    }
  }

  ngOnInit(): void {
    // Employee search debounce
    this.employeeSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.employeeSearchString = '';
      this.employeeListModel = [...this.filteredEmployeeList]; // reset list
    });

    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchModel = [...this.filteredBranchList];
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        this.getUserAccessRights(this.currentUser);
      });
    } else {
      this.getUserAccessRights(this.currentUser);
    }
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.employeeAdvanceTitleStatus = 'edit';
        this.getEmployeeListById(params['empid'], params['id']);
      }
    });
    // ... after fetching staffAdminAccessModel
    if (!this.staffAdminAccessModel.readAccess && this.employeeDailyForm.value.EmployeeType === 'Staff') {
      this.employeeDailyForm.patchValue({ EmployeeType: 'Guard' });
    }
    this.createForm();
    this.subscribeToChanges(0);
  }
  createForm() {
    this.dynamicForm = this.fb.group({
      formArray: this.fb.array([])
    });
  }
  get formArray() {
    return (this.dynamicForm.get('formArray') as FormArray).controls;
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

  //         if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
  //           this.warningMessage = '';
  //           this.getBranchMasterListByUser(this.currentUser);
  //         } else {
  //           this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                     You do not have permissions to view this page. <br>
  //                     If you feel you should have access to this page, Please contact administrator. <br>
  //                     Thank you`;
  //           this.hideSpinner();
  //         }
  //       }

  //     },
  //     (error) => {
  //       this.handleErrors(error);
  //     }
  //   );
  // }


  getUserAccessRights(userName: string) {
    forkJoin({
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Daily Salary Advance'),
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

        if (this.userRole === 'superadmin' || this.userAccessModel.readAccess) {
          this.warningMessage = '';
          this.getBranchMasterListByUser(this.currentUser);
        } else {
          this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access to this page, Please contact administrator. <br>
              Thank you`;
        }

      },
      error: (error) => {
        this.handleErrors(error);
      }
    });
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeDailyForm.patchValue({
      AdvanceDate: this.formatDate(`${type}: ${event.value}`),
      AdvanceTakenDate: this.formatDate(`${type}: ${event.value}`)
    });
    //this.getNewVoucherNumber(2);
    if (this.employeeDailyForm.value.EmployeeID != '' && this.employeeDailyForm.value.EmployeeID != undefined) {
      this.advanceID = 0;
      // Get the current date
      const advanceDate = new Date(this.employeeDailyForm.value.AdvanceDate);
      const employeeID = this.employeeDailyForm.value.EmployeeID;

      this.bindAdvanceDetails(employeeID);

      // Assuming multiple observables (example: dailyAdvanceList, additionalServiceCall, etc.)
      // forkJoin([
      //   this._payrollService.getDailyAdvanceList(advanceDate, employeeID, 2),
      //   // Add other calls here if needed, e.g., this.anotherServiceCall()
      // ]).subscribe(
      //   ([dailyAdvanceData]) => { // Add more parameters here for other responses
      //     const formArray = this.dynamicForm.get('formArray') as FormArray;
      //     dailyAdvanceData.forEach((item: any, index: number) => {
      //       if (index < formArray.length) {
      //         if (item.EmployeeID !== '' && item.TransType !== '' && item.ID > 0) {
      //           this.employeeDailyForm.patchValue({
      //             EmployeeID: item.EmployeeID,
      //             TransType: item.TransType == 2 ? '2' : item.TransType == 5 ? '5' : '0',
      //           });
      //         }
      //         const control = formArray.at(index) as FormGroup;
      //         control.get('ID')?.patchValue(item.ID, { emitEvent: false });
      //         control.get('EmployeeID')?.patchValue(this.employeeDailyForm.value.EmployeeID, { emitEvent: false });
      //         control.get('dayField')?.patchValue(item.Day, { emitEvent: false });
      //         control.get('Amount')?.patchValue(item.Amount == 0 ? '' : item.Amount, { emitEvent: false });
      //         control.get('VoucherNo')?.patchValue(item.VoucherNo, { emitEvent: false });
      //         control.get('NoOfInstallments')?.patchValue(item.NoOfInstallments, { emitEvent: false });
      //         control.get('PaymentType')?.patchValue(item.PaymentType, { emitEvent: false });
      //         control.get('Particulars')?.patchValue(item.Particulars, { emitEvent: false });
      //         control.get('IsDeleted')?.patchValue(item.IsDeleted, { emitEvent: false });
      //         control.get('LastUpdatedBy')?.patchValue(item.LastUpdatedBy, { emitEvent: false });
      //       }
      //     });
      //   },
      //   (error) => {
      //     this.showMessage(`${error.Message}`, 'error', 'Error Message')
      //   }
      // );
      // // Get the number of days in the current month
      // const daysInMonth = new Date(advanceDate.getFullYear(), advanceDate.getMonth() + 1, 0).getDate();
      // this.addFormFields(daysInMonth);
    }
  }
  onBranchSelectionChange(event: any) {
    if (event.value != '' && event.value != undefined) {
      const advanceDate = this.formatDate(this.employeeDailyForm.get('AdvanceDate')?.value);
      const branchCode = this.employeeDailyForm.get('BranchCode')?.value;
      if (advanceDate != null && advanceDate != 'NaN-NaN-NaN' && branchCode != '') {
        this.getEmployeeListByEmployeeType(advanceDate, branchCode, this.employeeDailyForm.value.EmployeeType, 1, 0, 'All')
        this.getAdvanceVoucherNo(event.value, '2');
      }
    } else {
      this.employeeListModel = [];
      const formArray = this.dynamicForm.get('formArray') as FormArray;
      formArray.clear();
    }

  }
  radioButtonTypeSelectionChange(event: any) {
    const advanceDate = this.formatDate(this.employeeDailyForm.get('AdvanceDate')?.value);
    const branchCode = this.employeeDailyForm.get('BranchCode')?.value;
    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
      const dtStartPeriod = new Date(advanceDate);
      const dtEndPeriod = new Date(dtStartPeriod.getFullYear(), dtStartPeriod.getMonth(), 1);
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(advanceDate, branchCode, event.value, 1, 0, 'All')
    } else {
      this.showMessage(`Attendance Date Cannot be blank or Empty!.`, 'error', 'Error Message');
    }
  }
  employeeChange(event: any) {
    this.advanceID = 0;
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    if (event.value == '0') {
      formArray.clear();
      this.hideSpinner();
    } else {
      this.EmployeeID = event.value;
      for (let i = 0; i < formArray.length; i++) {
        const control = formArray.at(i) as FormGroup;
        control.get('EmployeeID')?.patchValue(event.value, { emitEvent: false });
      }
      if (this.employeeDailyForm.value.AdvanceDate != '' && this.employeeDailyForm.value.AdvanceDate != undefined) {
        this.bindAdvanceDetails(event.value);
      }
    }
  }

  bindAdvanceDetails(employeeID: number): void {
    this.getNewVoucherNumber(2);

    const currentDate = new Date(this.employeeDailyForm.value.AdvanceDate);

    // First service call to get daily advance list
    this._payrollService.getDailyAdvanceList(currentDate, employeeID, 2).subscribe({
      next: (dailyAdvanceData) => {
        if (dailyAdvanceData.length > 0) {
          if (Array.isArray(dailyAdvanceData) && dailyAdvanceData.length > 0) {
            const objectWithId = dailyAdvanceData.find(item => item.ID);
            if (objectWithId) {
              this.advanceID = objectWithId.ID; // Assign the first found `Id`
            }
          }

          // Process the form array with daily advance data
          this.processDailyAdvanceData(dailyAdvanceData);

          // Now fetch employee number and details after processing daily advance data
          this.fetchEmployeeNoAndDetails(employeeID, currentDate, dailyAdvanceData);
        } else {
          // Get the number of days in the current month
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          this.addFormFields(daysInMonth);
        }
      },
      error: (error) => {
        this.showMessage(`${error.Message}`, 'error', 'Error Message');
      }
    });
  }

  radioTypeChange(event: any) {
    this.employeeDailyForm.value.TransType = event.value;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup;
      if (event.value == 2) {
        control.get('TransType')?.patchValue(event.value, { emitEvent: false });
        control.get('Particulars')?.patchValue('Daily Advance', { emitEvent: false });
      } else if (event.value == 5) {
        control.get('TransType')?.patchValue(event.value, { emitEvent: false });
        control.get('Particulars')?.patchValue('Other Advance', { emitEvent: false });
      } else {
        control.get('TransType')?.patchValue(event.value, { emitEvent: false });
        control.get('Particulars')?.patchValue('', { emitEvent: false });
      }
    }
  }
  amountChange(event: any, i: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const subscription = formArray.valueChanges.subscribe((values) => {
      values.forEach((value: any, index: any) => {
        if (i == index) {
          const advanceDate = value.AdvanceDate
          const employeeID = value.EmployeeID
          this._payrollService.checkExistAdvance(employeeID, this.formatDate(advanceDate), 2).subscribe({
            next: (exists) => {
              if (exists) {
                this.bindAdvanceDetails(employeeID);
                this.showMessage(`Record Exists. Please check.`, 'warning', 'Warning Message');
              } else {
                this.subscribeToChanges(i);
                this.hideSpinner();
              }
            },
            error: (error) => this.handleErrors(error)
          });
        }
      });
      // Unsubscribe to avoid recursive calls
      subscription.unsubscribe();
    });
  }
  // Helper to get the 'Amount' control of a specific index in the array
  getAmountControl(index: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    return formArray.at(index).get('Amount');
  }
  getEmployeeListByEmployeeType(advanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): void {
    const attendancePeriod = this.formatDate(this.employeeDailyForm.get('AdvanceDate')?.value);
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(attendancePeriod)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(attendancePeriod)));
    forkJoin([
      this._payrollService.getListByEmplyeeType(advanceDate, branchCode, employeeType, transType, advanceAmount, race),
      this._payrollService.getListByEmployee(branchCode, employeeType.toString(), this.StartPeriod, this.EndPeriod, 'Active'),
    ]).subscribe(
      ([employeeData, employeList]) => {
        // Clear the EmployeeID field in the form
        this.employeeDailyForm.patchValue({
          EmployeeID: '',
          // EmployeeType: 'Guard',
          // TransType: '2'
        });
        // Clear the existing form array
        const formArray = this.dynamicForm.get('formArray') as FormArray;
        formArray.clear();
        if (employeeData.length > 0 && employeeData != undefined) {
          // Assign the employee data
          this.employeeListModel = employeeData;
          this.filteredEmployeeList = [...this.employeeListModel];
        } else {
          this.employeeListModel = employeList;
          this.filteredEmployeeList = [...this.employeeListModel];
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeDailyForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  // addFormFields(count: number, startDay: number = 1): void {
  //   const formArray = this.dynamicForm.get('formArray') as FormArray;
  //   formArray.clear();
  //   for (let i = startDay - 1; i < count; i++) {
  //     const currentDate = new Date();
  //     currentDate.setDate(startDay + i);

  //     formArray.push(this.fb.group({
  //       dayField: [i + 1],
  //       ID: [0],
  //       EmployeeID: ['', [Validators.required]],
  //       AdvanceTakenDate: [''],
  //       AdvanceDate: ['', [Validators.required]],
  //       VoucherNo: [''],
  //       Amount: ['', [twoDecimalPlacesValidator()]],
  //       NoOfInstallments: ['1'],
  //       PaymentType: ['Bank'],
  //       Particulars: [''],
  //       TransType: ['0'],
  //       IsDeleted: [false],
  //       LastUpdate: [this.formatDate(new Date)],
  //       LastUpdatedBy: [this.currentUser],
  //     }));
  //   }
  // }

  // updateFormFields(data: any, iNoOfDays: number, iStartDay: number): void {
  //   this.showLoadingSpinner = true;
  //   const advanceDate = new Date(this.employeeDailyForm.value.AdvanceDate);
  //   const formArray = this.dynamicForm.get('formArray') as FormArray;
  //   formArray.clear();

  //   for (let i = iStartDay - 1; i < iNoOfDays; i++) {
  //     const currentDate = new Date();
  //     currentDate.setDate(i + 1);

  //     formArray.push(this.fb.group({
  //       dayField: [i + 1],
  //       ID: [data[i]?.ID || 0],
  //       EmployeeID: [this.EmployeeID || 0],
  //       AdvanceDate: [this.formatDate(new Date(advanceDate.getFullYear(), advanceDate.getMonth(), i + 1)),],
  //       AdvanceTakenDate: [this.formatDate(new Date(advanceDate.getFullYear(), advanceDate.getMonth(), i + 1)),],
  //       VoucherNo: [data[i]?.VoucherNo || ''],
  //       Amount: [data[i]?.Amount || ''],
  //       NoOfInstallments: [data[i]?.NoOfInstallments || ''],
  //       PaymentType: [data[i]?.PaymentType || ''],
  //       Particulars: [data[i]?.Particulars || ''],
  //       TransType: [data[i]?.TransType || ''],
  //       IsDeleted: [data[i]?.IsDeleted || false],
  //       LastUpdate: [this.formatDate(new Date(data[i]?.LastUpdate)) || ''],
  //       LastUpdatedBy: [data[i]?.LastUpdatedBy || this.currentUser],
  //     }));
  //   }
  //   setTimeout(() => {
  //     this.hideSpinner();
  //   }, 3000);
  // }

  addFormFields(count: number, startDay: number = 1): void {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    for (let day = startDay; day <= count; day++) {

      const currentDate = new Date();
      currentDate.setDate(day);

      formArray.push(this.fb.group({
        dayField: [day],
        ID: [0],
        EmployeeID: ['', [Validators.required]],
        AdvanceTakenDate: [''],
        AdvanceDate: ['', [Validators.required]],
        VoucherNo: [''],
        Amount: ['', [twoDecimalPlacesValidator()]],
        NoOfInstallments: ['1'],
        PaymentType: ['Bank'],
        Particulars: [''],
        TransType: ['0'],
        IsDeleted: [false],
        LastUpdate: [this.formatDate(new Date())],
        LastUpdatedBy: [this.currentUser],
      }));
    }
  }
  updateFormFields(data: any, iNoOfDays: number, iStartDay: number): void {

    this.showLoadingSpinner = true;

    const advanceDate = new Date(this.employeeDailyForm.value.AdvanceDate);
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    formArray.clear();

    for (let day = iStartDay; day <= iNoOfDays; day++) {

      const dataIndex = day - iStartDay; // ⭐ critical fix for startDay cases

      const currentDate = new Date();
      currentDate.setDate(day);

      formArray.push(this.fb.group({
        dayField: [day],
        ID: [data[dataIndex]?.ID || 0],
        EmployeeID: [this.EmployeeID || 0],

        AdvanceDate: [
          this.formatDate(
            new Date(advanceDate.getFullYear(), advanceDate.getMonth(), day)
          )
        ],

        AdvanceTakenDate: [
          this.formatDate(
            new Date(advanceDate.getFullYear(), advanceDate.getMonth(), day)
          )
        ],

        VoucherNo: [data[dataIndex]?.VoucherNo || ''],
        Amount: [data[dataIndex]?.Amount || ''],
        NoOfInstallments: [data[dataIndex]?.NoOfInstallments || ''],
        PaymentType: [data[dataIndex]?.PaymentType || ''],
        Particulars: [data[dataIndex]?.Particulars || ''],
        TransType: [data[dataIndex]?.TransType || ''],
        IsDeleted: [data[dataIndex]?.IsDeleted || false],

        LastUpdate: [
          data[dataIndex]?.LastUpdate
            ? this.formatDate(new Date(data[dataIndex]?.LastUpdate))
            : ''
        ],

        LastUpdatedBy: [data[dataIndex]?.LastUpdatedBy || this.currentUser],
      }));
    }

    setTimeout(() => {
      this.hideSpinner();
    }, 3000);
  }
  subscribeToChanges(i: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    const subscription = formArray.valueChanges.subscribe((values) => {
      values.forEach((value: any, index: any) => {
        const dayAmount = value.dayAmount;
        if (i == index) {
          if (dayAmount !== '' && dayAmount !== 0) {
            // Add the current date to dayField
            const currentDate = new Date(this.employeeDailyForm.get('AdvanceDate')?.value);

            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(value.dayField).padStart(2, '0');

            const formattedDate = `${year}-${month}-${day}`;
            formArray.at(index).get('AdvanceDate')?.patchValue(formattedDate, { emitEvent: false });
            formArray.at(index).get('AdvanceTakenDate')?.patchValue(formattedDate, { emitEvent: false });

            for (let i = 0; i < formArray.length; i++) {
              const control = formArray.at(i) as FormGroup;
              control.get('NoOfInstallments')?.patchValue(1, { emitEvent: false });
              control.get('PaymentType')?.patchValue('Bank', { emitEvent: false });
              control.get('VoucherNo')?.patchValue(i == 0 ? this.employeeDailyForm.value.VoucherNo : '00000' + (i + 1), { emitEvent: false });
              control.get('TransType')?.patchValue(this.employeeDailyForm.value.TransType == 2 ? '2' : this.employeeDailyForm.value.TransType == 5 ? '5' : '0', { emitEvent: false });
              control.get('Particulars')?.patchValue(this.employeeDailyForm.value.TransType == 2 ? 'Daily Advance' : this.employeeDailyForm.value.TransType == 5 ? 'Other Advance' : '', { emitEvent: false });
            }
          }
        }
      });

      // Unsubscribe to avoid recursive calls
      subscription.unsubscribe();
    });
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getEmployeeListById(empid: number, id: number): void {
    this.showLoadingSpinner = true;
    this._payrollService.getSalaryAdvanceById(empid, id).subscribe(
      (data) => {
        this.employeeDailyForm.patchValue({
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
        this.hideSpinner();
      },
      (error) => this.handleErrors(error)
    );
  }
  getNewVoucherNumber(transType: number): void {
    this._payrollService.getNewVoucherNumber(transType).subscribe(
      result => {
        this.employeeDailyForm.patchValue({
          VoucherNo: result.VoucherNumber
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  getDaysInMonth(date: string): number {
    const currentDate = new Date(date);
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }

  // savebuttonClick(): void {
  //   if (this.employeeDailyForm.value.TransType != 0) {
  //     this.showLoadingSpinner = true;
  //     var AdvanceDate = this.employeeDailyForm.value.AdvanceDate;
  //     this.EmployeeID = this.employeeDailyForm.value.EmployeeID;
  //     var dateYear = new Date(AdvanceDate);
  //     this.year = dateYear.getFullYear();
  //     var dateMonth = new Date(AdvanceDate);
  //     this.month = dateMonth.getMonth() + 1;

  //     const formArray = this.dynamicForm.get('formArray') as FormArray;

  //     // Iterate through the form array and remove rows with empty "amount" field
  //     for (let i = formArray.length - 1; i >= 0; i--) {
  //       const row = formArray.at(i) as FormGroup;
  //       const amountControl = row.get('Amount');
  //       const advanceDateControl = row.get('AdvanceDate');
  //       const advanceDateTakenControl = row.get('AdvanceTakenDate');

  //       if (amountControl?.value === null || amountControl?.value === '') {
  //         //formArray.removeAt(i);
  //         amountControl?.setValue('0.00');
  //       }
  //       if (advanceDateControl?.value === null || advanceDateControl?.value === '') {
  //         advanceDateControl?.setValue(this.employeeDailyForm.value.AdvanceDate);
  //       }
  //       if (advanceDateTakenControl?.value === null || advanceDateTakenControl?.value === '') {
  //         advanceDateTakenControl?.setValue(this.employeeDailyForm.value.AdvanceDate);
  //       }
  //     }

  //     // Access controls from FormArray using this.dynamicForm.get('formArray') as FormArray
  //     const controls = (this.dynamicForm.get('formArray') as FormArray).controls;

  //     // Filter out the controls where Amount is 0.00
  //     const filteredControls = controls.filter(
  //       (control) => parseFloat(control.get('Amount')?.value) !== 0.00
  //     );

  //     // Clear the FormArray and add the filtered controls back
  //     formArray.clear(); // Removes all controls from the FormArray

  //     // Add filtered controls back to FormArray
  //     filteredControls.forEach((control) => this.formArray.push(control));


  //     // Map form values to SalaryMonthlyAdvance instances
  //     this.salaryMonthlyAdvance = formArray.controls.map((control) => {
  //       const formValue = control.value;

  //       // Create a new instance of SalaryMonthlyAdvance and assign values
  //       const salaryAdvance = new SalaryMonthlyAdvance();
  //       salaryAdvance.ID = formValue.ID;
  //       salaryAdvance.EmployeeID = formValue.EmployeeID;
  //       salaryAdvance.AdvanceTakenDate = new Date(this.formatDate(formValue.AdvanceTakenDate));
  //       salaryAdvance.AdvanceDate = new Date(this.formatDate(formValue.AdvanceDate));
  //       salaryAdvance.VoucherNo = formValue.VoucherNo;
  //       salaryAdvance.Amount = parseFloat(formValue.Amount);
  //       salaryAdvance.NoOfInstallments = formValue.NoOfInstallments;
  //       salaryAdvance.PaymentType = formValue.PaymentType;
  //       salaryAdvance.Particulars = formValue.Particulars;
  //       salaryAdvance.TransType = formValue.TransType;
  //       salaryAdvance.IsDeleted = formValue.IsDeleted;
  //       salaryAdvance.LastUpdate = new Date;
  //       salaryAdvance.LastUpdatedBy = this.currentUser;

  //       return salaryAdvance;
  //     });
  //     //console.log('daily advance', this.salaryMonthlyAdvance);

  //     forkJoin({
  //       salaryProcess: this._payrollService.getSalaryProcessDate(this.EmployeeID, this.year, this.month).pipe(
  //         catchError(() => of(false)) // Handle error and return a default value
  //       ),
  //       resignDate: this._payrollService.getResignDateByEmployeeID(this.EmployeeID).pipe(
  //         catchError(() => of('1900-01-01T00:00:00')) // Default to reference date on error
  //       )
  //     }).subscribe(({ salaryProcess, resignDate }) => {
  //       if (salaryProcess) {
  //         this.bindAdvanceDetails(this.EmployeeID);
  //         this.showMessage(
  //           `Salary already Process for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
  //           'warning',
  //           'Warning Message'
  //         );
  //       } else {
  //         const resignDateObj = new Date(resignDate);
  //         const referenceDate = new Date('1900-01-01T00:00:00');

  //         if (AdvanceDate > resignDateObj && resignDateObj.getTime() !== referenceDate.getTime()) {
  //           this.bindAdvanceDetails(this.EmployeeID);
  //           this.showMessage(
  //             `Advance Date cannot be later than Guard/Staff Resign Date. Please contact HQ for more information.`,
  //             'warning',
  //             'Warning Message'
  //           );
  //         } else {
  //           this._payrollService.saveAndUpdateSalaryDailyAdvances(this.salaryMonthlyAdvance).subscribe(
  //             (response) => {
  //               if (response.Exists === 'Exists') {
  //                 this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //               } else if (response.Success === 'Success') {
  //                 this.employeeDailyForm.patchValue({
  //                   EmployeeType: 'None',
  //                   TransType: '0'
  //                 });
  //                 this.showMessage(`${response.Message}`, 'success', 'Success Message');

  //                 if (Array.isArray(response.SalaryAdvance) && response.SalaryAdvance.length > 0) {
  //                   const objectWithId = response.SalaryAdvance.find((item: any) => item.ID);
  //                   if (objectWithId) {
  //                     this.advanceID = objectWithId.ID; // Assign the first found `ID`
  //                   }
  //                 }

  //                 this._router.navigate(['/payroll/daily-advance-voucher-report'], {
  //                   queryParams: { id: this.advanceID },
  //                   queryParamsHandling: 'merge'
  //                 });
  //               }
  //             },
  //             (error) => this.handleErrors(error)
  //           );
  //         }
  //       }
  //       setTimeout(() => {
  //         this.hideSpinner();
  //       }, 3000);
  //     });
  //   } else {
  //     this.showMessage(`Please select Advance Type`, 'error', 'Error Message');
  //   }
  // }

  onDeleteClick(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this employee monthly advance details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          // ✅ SUPERADMIN → direct delete (skip all validations)
          if (this.userRole?.toLowerCase() === 'superadmin') {
            this._payrollService.deleteSalaryAdvance(this.advanceID, this.currentUser)
              .subscribe(
                (deleteResult: any) => {
                  if (deleteResult.success) {
                    this.showMessage(deleteResult.message, 'success', 'Success Message');

                    this._router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
                      this._router.navigate(['/payroll/new-employee-daily-advance']);
                    });
                  }
                },
                (error) => this.handleErrors(error)
              );
            this.advanceID = 0;
            return; // IMPORTANT → stop further execution
          }

          // EXISTING LOGIC CONTINUES FOR OTHER USERS

          const advanceDate = this.formatDate(this.employeeDailyForm.value.AdvanceDate);

          if (this.employeeListModel.length > 0) {
            const emp = this.employeeListModel.find((x: any) => x.EMP_ID === this.employeeDailyForm.value.EmployeeID);
            this.EmployeeID = emp ? emp.EMP_ID : 0;
          } else {
            this.EmployeeID = this.employeeDailyForm.value.EmployeeID
          }

          if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {

            const requests = [
              this._payrollService.getSalaryAdvances(advanceDate, this.EmployeeID.toString(), '2')
            ];

            forkJoin(requests).subscribe(
              (responses: any[]) => {
                if (responses[0]?.length > 0) {

                  const response = responses[0];
                  var dateYear = new Date(response[0].AdvanceDate);
                  this.year = dateYear.getFullYear();
                  var dateMonth = new Date(response[0].AdvanceDate);
                  this.month = dateMonth.getMonth() + 1;

                  forkJoin({
                    salaryProcessed: this._payrollService.getSalaryProcessDate(response[0].EmployeeID, this.year, this.month)
                      .pipe(catchError(() => of(false)))
                  }).subscribe({
                    next: ({ salaryProcessed }) => {

                      if (salaryProcessed) {
                        this.showMessage(
                          `Salary already processed for this Guard/Staff. You do not have the right to update or save.`,
                          'warning',
                          'Warning Message'
                        );
                      } else {
                        this._payrollService.deleteSalaryAdvance(this.advanceID, this.currentUser)
                          .subscribe(
                            (deleteResult: any) => {
                              if (deleteResult.success) {
                                this.showMessage(deleteResult.message, 'success', 'Success Message');
                                 this.advanceID = 0;
                                this._router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
                                  this._router.navigate(['/payroll/new-employee-daily-advance']);
                                });
                              }
                            },
                            (error) => this.handleErrors(error)
                          );
                      }

                    },
                    error: (error) => this.handleErrors(error)
                  });
                }
              },
              (error) => this.handleErrors(error)
            );
            this.hideSpinner();
          } else {
            this.showMessage(
              `Please select Advance Process. Data is a mandatory field.`,
              'warning',
              'Warning Message'
            );
            this.hideSpinner();
          }
        } else {
          this.hideSpinner();
        }
      })

  }
  savebuttonClick(): void {

    if (this.employeeDailyForm.value.TransType == 0) {
      this.showMessage(`Please select Advance Type`, 'error', 'Error Message');
      return;
    }

    this.showLoadingSpinner = true;

    const advanceDate = this.employeeDailyForm.value.AdvanceDate;
    this.EmployeeID = this.employeeDailyForm.value.EmployeeID;

    const dateObj = new Date(advanceDate);
    this.year = dateObj.getFullYear();
    this.month = dateObj.getMonth() + 1;

    this.prepareFormArray();
    this.mapSalaryAdvanceModel();

    // Superadmin skips validations
    if (this.userRole === 'superadmin') {
      this.saveAdvanceData();
      return;
    }

    this.validateAndSave(advanceDate);
  }
  prepareFormArray(): void {

    const formArray = this.dynamicForm.get('formArray') as FormArray;

    for (let i = formArray.length - 1; i >= 0; i--) {

      const row = formArray.at(i) as FormGroup;

      const amount = row.get('Amount');
      const advanceDate = row.get('AdvanceDate');
      const advanceTakenDate = row.get('AdvanceTakenDate');

      if (!amount?.value) {
        amount?.setValue('0.00');
      }

      if (!advanceDate?.value) {
        advanceDate?.setValue(this.employeeDailyForm.value.AdvanceDate);
      }

      if (!advanceTakenDate?.value) {
        advanceTakenDate?.setValue(this.employeeDailyForm.value.AdvanceDate);
      }
    }

    const controls = formArray.controls;

    const filteredControls = controls.filter(
      control => parseFloat(control.get('Amount')?.value) !== 0.00
    );

    formArray.clear();

    filteredControls.forEach(control => this.formArray.push(control));

  }
  mapSalaryAdvanceModel(): void {

    const formArray = this.dynamicForm.get('formArray') as FormArray;

    this.salaryMonthlyAdvance = formArray.controls.map(control => {

      const formValue = control.value;

      const salaryAdvance = new SalaryMonthlyAdvance();

      salaryAdvance.ID = formValue.ID;
      salaryAdvance.EmployeeID = formValue.EmployeeID;
      salaryAdvance.AdvanceTakenDate = new Date(this.formatDate(formValue.AdvanceTakenDate));
      salaryAdvance.AdvanceDate = new Date(this.formatDate(formValue.AdvanceDate));
      salaryAdvance.VoucherNo = formValue.VoucherNo;
      salaryAdvance.Amount = parseFloat(formValue.Amount);
      salaryAdvance.NoOfInstallments = formValue.NoOfInstallments;
      salaryAdvance.PaymentType = formValue.PaymentType;
      salaryAdvance.Particulars = formValue.Particulars;
      salaryAdvance.TransType = formValue.TransType;
      salaryAdvance.IsDeleted = formValue.IsDeleted;
      salaryAdvance.LastUpdate = new Date();
      salaryAdvance.LastUpdatedBy = this.currentUser;

      return salaryAdvance;

    });

  }
  validateAndSave(advanceDate: any): void {

    forkJoin({

      salaryProcess: this._payrollService
        .getSalaryProcessDate(this.EmployeeID, this.year, this.month)
        .pipe(catchError(() => of(false))),

      resignDate: this._payrollService
        .getResignDateByEmployeeID(this.EmployeeID)
        .pipe(catchError(() => of('1900-01-01T00:00:00')))

    }).subscribe(({ salaryProcess, resignDate }) => {

      if (salaryProcess) {
        this.bindAdvanceDetails(this.EmployeeID);
        this.showMessage(
          `Salary already Process for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
          'warning',
          'Warning Message'
        );
        this.hideSpinner();
        return;

      }

      const resignDateObj = new Date(resignDate);
      const referenceDate = new Date('1900-01-01T00:00:00');

      if (advanceDate > resignDateObj && resignDateObj.getTime() !== referenceDate.getTime()) {

        this.bindAdvanceDetails(this.EmployeeID);

        this.showMessage(
          `Advance Date cannot be later than Guard/Staff Resign Date. Please contact HQ for more information.`,
          'warning',
          'Warning Message'
        );
        this.hideSpinner();
        return;
      }
      this.saveAdvanceData();
    });

  }
  saveAdvanceData(): void {

    this._payrollService
      .saveAndUpdateSalaryDailyAdvances(this.salaryMonthlyAdvance)
      .subscribe(

        response => {

          if (response.Exists === 'Exists') {

            this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
            return;

          }

          if (response.Success === 'Success') {

            this.employeeDailyForm.patchValue({
              EmployeeType: 'None',
              TransType: '0'
            });

            this.showMessage(`${response.Message}`, 'success', 'Success Message');

            if (Array.isArray(response.SalaryAdvance) && response.SalaryAdvance.length > 0) {

              const objectWithId = response.SalaryAdvance.find((item: any) => item.ID);

              if (objectWithId) {
                this.advanceID = objectWithId.ID;
              }

            }

            this._router.navigate(
              ['/payroll/daily-advance-voucher-report'],
              {
                queryParams: { id: this.advanceID },
                queryParamsHandling: 'merge'
              }
            );

          }

        },
        error => this.handleErrors(error)

      );

    setTimeout(() => {
      this.hideSpinner();
    }, 3000);

  }
  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'employeeSearchString' | 'branchSearchString',
    listProp: 'employeeListModel' | 'branchModel',
    filteredListProp: 'filteredEmployeeList' | 'filteredBranchList',
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
  canDeleteOrPrint(): boolean {
    return this.currentUser === 'superadmin' || !!this.userAccessModel?.deleteAccess;
  }

  private processDailyAdvanceData(dailyAdvanceData: any[]): void {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    // if (!formArray || formArray.length === 0) {
    //   return;
    // }

    dailyAdvanceData.forEach((item, index) => {
      const control = formArray.at(index) as FormGroup;

      // Check if the control exists and has the 'get' method
      if (control && control.get) {
        control.get('ID')?.patchValue(item.ID, { emitEvent: false });
        control.get('EmployeeID')?.patchValue(this.employeeDailyForm.value.EmployeeID, { emitEvent: false });
        control.get('dayField')?.patchValue(item.Day, { emitEvent: false });
        control.get('AdvanceDate')?.patchValue(
          item.AdvanceDate === '0001-01-01T00:00:00' ? '' : item.AdvanceDate,
          { emitEvent: false }
        );
        control.get('AdvanceTakenDate')?.patchValue(
          item.AdvanceTakenDate === '0001-01-01T00:00:00' ? '' : item.AdvanceTakenDate,
          { emitEvent: false }
        );
        control.get('Amount')?.patchValue(item.Amount === 0 ? '' : item.Amount, { emitEvent: false });
        control.get('VoucherNo')?.patchValue(item.VoucherNo, { emitEvent: false });
        control.get('NoOfInstallments')?.patchValue(item.NoOfInstallments, { emitEvent: false });
        control.get('PaymentType')?.patchValue(item.PaymentType, { emitEvent: false });
        control.get('TransType')?.patchValue(item.TransType, { emitEvent: false });
        control.get('Particulars')?.patchValue(
          item.TransType === 2 ? 'Daily Advance' : item.TransType === 5 ? 'Other Advance' : '',
          { emitEvent: false }
        );
        control.get('IsDeleted')?.patchValue(item.IsDeleted, { emitEvent: false });
        control.get('LastUpdatedBy')?.patchValue(this.currentUser, { emitEvent: false });
      }
      // Update employeeDailyForm if necessary
      if (item.EmployeeID !== '' && item.TransType !== '' && item.ID > 0) {
        this.employeeDailyForm.patchValue({
          EmployeeID: item.EmployeeID,
          TransType: item.TransType === 2 ? '2' : item.TransType === 5 ? '5' : '0',
        });
      }
    });
  }
  private fetchEmployeeNoAndDetails(employeeID: number, currentDate: Date, dailyAdvanceData: any): void {
    // Fetch employee number
    this._payrollService.getEmployeeNo(employeeID).subscribe({
      next: (employeeResponse) => {

        if (employeeResponse?.EmployeeNo) {
          // Patch EmployeeNo into the form
          this.employeeDailyForm.patchValue({
            EmployeeNo: employeeResponse.EmployeeNo
          });

          // Fetch employee details
          this._payrollService.getEmployeeDetails(
            this.employeeDailyForm.value.BranchCode,
            employeeResponse.EmployeeNo // Use the value directly to avoid relying on the form
          ).subscribe({
            next: (data) => {
              if (Array.isArray(data) && data.length > 0) {
                const employeeDetails = data[0];

                // Patch employee details with fallback for missing or incorrect date values
                this.employeeDailyForm.patchValue({
                  JoinDate: this.formatDisplayDate(employeeDetails?.EMPPAY_DATE_JOINED) === '1970-01-01' ? '' : this.formatDisplayDate(employeeDetails?.EMPPAY_DATE_JOINED),
                  ResignedDate: this.formatDisplayDate(employeeDetails?.EMPPAY_DATE_RESIGNED) === '1970-01-01' ? '' : this.formatDisplayDate(employeeDetails?.EMPPAY_DATE_RESIGNED),
                });

                // Calculate attendance data after fetching employee details
                this.calculateAttendanceData(currentDate, dailyAdvanceData);
              }
            },
            error: (err) => {
              this.handleErrors(err.Message);
            }
          });
        }
      },
      error: (err) => {
        this.handleErrors(err.Message);
      }
    });
  }
  private calculateAttendanceData(currentDate: Date, data: any): void {
    let iNoOfDays = 0;
    let iStartDay = 1;

    const advanceDate = new Date(this.employeeDailyForm.value.AdvanceDate);
    this.dtAttendanceDate = new Date(this.employeeDailyForm.value.AdvanceDate);

    const today = new Date();
    const joinDate = new Date(this.employeeDailyForm.value.JoinDate);
    const resignDate = this.employeeDailyForm.value.ResignedDate
      ? new Date(this.employeeDailyForm.value.ResignedDate)
      : null;

    // Check if the AdvanceDate is in the current month and year
    if (advanceDate.getMonth() === today.getMonth() && advanceDate.getFullYear() === today.getFullYear()) {
      iNoOfDays = advanceDate.getDate();
    } else {
      iNoOfDays = this.getDaysInMonth(advanceDate.toString()); // Use utility function to get days in month
    }

    const attendanceDate = new Date(advanceDate.getFullYear(), advanceDate.getMonth(), 1);
    // Check if the employee has a resignation date
    if (resignDate) {
      if (attendanceDate > resignDate) {
        this.showMessage(`Employee already resigned on ${this.formatDate(resignDate)}, please choose a different date.`, 'warning', 'Warning Message');
        const formArray = this.dynamicForm.get('formArray') as FormArray;
        formArray.clear();
        return;
        // Do nothing if resignation date has passed
      } else if (this.dtAttendanceDate.getMonth() === resignDate.getMonth() && this.dtAttendanceDate.getFullYear() === resignDate.getFullYear()) {
        this.dtAttendanceDate = resignDate;
        iNoOfDays = resignDate.getDate();
      }
    }

    // Check if the AdvanceDate is in the employee's joining month and year
    if (this.dtAttendanceDate.getMonth() === joinDate.getMonth() && this.dtAttendanceDate.getFullYear() === joinDate.getFullYear()) {
      iStartDay = joinDate.getDate();
    }

    // Get the number of days in the current month
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    if (data.length > 0) {
      this.updateFormFields(data, iNoOfDays, iStartDay);
    } else {
      this.addFormFields(iNoOfDays, iStartDay);
    }


    setTimeout(() => {
      this.hideSpinner();
    }, 2000);
  }
  canSaveEmployeeDaily(): boolean {

    const empType = this.employeeDailyForm.get('EmployeeType')?.value;

    // Superadmin → always allowed
    if (this.currentUser === 'superadmin') {
      return true;
    }

    // Staff → check staff admin access
    if (empType === 'Staff') {
      return !!(this.staffAdminAccessModel?.createAccess || this.staffAdminAccessModel?.updateAccess);
    }

    // Guard / Others → normal admin access
    return !!(this.userAccessModel?.createAccess || this.userAccessModel?.updateAccess);
  }
  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
    //this.clearEmployeeAdvanceDetails();
    return;
  }
  clearEmployeeAdvanceDetails(): void {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    this.dynamicForm.reset();
    this.employeeDailyForm.patchValue({
      EmpolyeeType: 'None',
      TransType: 0
    })
    //this.employeeAdvanceTitleStatus = 'new';
    //this._router.navigate(['/payroll/new-employee-daily-advance']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
