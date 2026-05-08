import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, forkJoin, of, Subject, switchMap, take } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { InventoryCategory } from 'src/app/model/inventoryCategory';
import { ItemMasterModel } from 'src/app/model/itemMasterModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-uniform-loan',
  templateUrl: './new-employee-uniform-loan.component.html',
  styleUrls: ['./new-employee-uniform-loan.component.css']
})
export class NewEmployeeUniformLoanComponent implements OnInit {
  employeeUniformLoanForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  clientCode: string = 'null';
  employeeModel!: EmployeeMonthlyAdvance[];
  inventoryModel!: InventoryCategory[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  minDate = new Date();
  voucherNumber!: string;
  itemMaster!: ItemMasterModel[];
  branchModel!: BranchModel[];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  employeeListModel!: EmployeeAdvanceListModel[];
  year!: number;
  month!: number;
  EmployeeID!: number;
  employeeSelectedType: string = '';
  StartPeriod!: string;
  EndPeriod!: string;
  advanceDate!: string;
  nameList: string[] = [];
  advanceID: number = 0;
  isEdit: boolean = false;
  selectedId: number = 0;
  employeeNameMap: { [key: number]: string } = {};
  btnPrint: boolean = false;
  btnDelete: boolean = false;

  employeeSearchSubject = new Subject<string>();
  branchSearchSubject = new Subject<string>();
  employeeSearchString: string = '';
  branchSearchString: string = '';
  filteredEmployeeList: any[] = [];
  filteredBranchList: any[] = [];
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

  dataSource: any;
  displayedColumns: string[] = ['Name', 'Price', 'Quantity', 'Total'];
  formReady = true;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    private _masterService: MastermoduleService, private _router: Router, public employeeService: EmployeeService,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.employeeUniformLoanForm = this.fb.group({
      ID: [0],
      InventoryCategoryID: [0],
      Quantity: [0],
      Price: [0],
      EmployeeID: [''],
      EmployeeType: ['Guard'],
      BranchCode: [''],
      AdvanceTakenDate: ['', [Validators.required]],
      AdvanceDate: [this.formatDate(new Date)],
      VoucherNo: [''],
      Amount: ['', [Validators.required, twoDecimalPlacesValidator()]],
      NoOfInstallments: ['', [Validators.required]],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['4'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
      MonthlyRepayment: [''],
      items: this.fb.array([])
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
    this.salaryMonthlyAdvance.TransType = 4;
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
    this.initForm();
  }
  get itemFormArray(): FormArray {
    return this.employeeUniformLoanForm.get('items') as FormArray;
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  initForm() {
    this.itemFormArray.clear();
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) {
      return;
    }

    this.dataSource.data.forEach((item: any) => {
      this.itemFormArray.push(this.fb.group({
        AdvanceID: [item.AdvanceID || 0],
        ItemID: [item.ItemID],   // 🔥 REQUIRED
        Price: [item.Price],     // 🔥 REQUIRED
        Quantity: [item.Quantity || 0],
        Total: [item.Price * (item.Quantity || 0)]
      }));
    });
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
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser);
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.isEdit = true;
        this.btnDelete = true;
        this.advanceID = params['id'];
        this.btnPrint = true;
        this.isEdit = true
        this.getEmployeeUniformList(params['id']);
      } else {
        this.isEdit = false;
        this.advanceID = 0;
        this.btnPrint = false;
        this.isEdit = false
        this.btnDelete = false;
      }
    });

    // ... after fetching staffAdminAccessModel
    if (!this.staffAdminAccessModel.readAccess && this.employeeUniformLoanForm.value.EmployeeType === 'Staff') {
      this.employeeUniformLoanForm.patchValue({ EmployeeType: 'Guard' });
    }
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
  //           this.getInventoryList();
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Employee Uniform'),
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
          this.getInventoryList();
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
  // getEmployeeUniformList(loanId: number): void {
  //   forkJoin({
  //     loan: this._payrollService.getEmployeeLoanById(loanId, 4)
  //   }).subscribe({
  //     next: ({ loan }) => {
  //       if (loan) {
  //         this.employeeUniformLoanForm.patchValue({
  //           ID: loan.ID,
  //           EmployeeID: loan.EmployeeID,
  //           AdvanceTakenDate: loan.AdvanceTakenDate,
  //           AdvanceDate: loan.AdvanceDate,
  //           VoucherNo: loan.VoucherNo,
  //           Amount: loan.Amount,
  //           NoOfInstallments: loan.NoOfInstallments,
  //           PaymentType: loan.PaymentType,
  //           Particulars: loan.Particulars,
  //           TransType: loan.TransType,
  //           IsDeleted: loan.IsDeleted,
  //           LastUpdate: this.formatDate(new Date(loan.LastUpdate || new Date())),
  //           LastUpdatedBy: loan.LastUpdatedBy
  //         });
  //         if (loan.Amount && loan.NoOfInstallments) {
  //           const monthlyRepayment = (loan.Amount / loan.NoOfInstallments).toFixed(2);
  //           this.employeeUniformLoanForm.patchValue({ MonthlyRepayment: monthlyRepayment });
  //         }
  //         if (loan.ID && loan.InventoryCategoryID) {
  //           this.loadUniformItemRows(loan.ID, loan.InventoryCategoryID);
  //         }
  //         this.getBranchCodeByEmployeeId(loan.EmployeeID);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error loading loan', err);
  //     }
  //   });
  // }

  getEmployeeUniformList(loanId: number): void {
    this._payrollService.getEmployeeLoanById(loanId, 4).pipe(
      switchMap((loan: any) => {

        if (!loan) return of(null);

        // Patch loan data
        this.employeeUniformLoanForm.patchValue({
          ID: loan.ID,
          EmployeeID: loan.EmployeeID,
          AdvanceTakenDate: loan.AdvanceTakenDate,
          AdvanceDate: loan.AdvanceDate,
          VoucherNo: loan.VoucherNo,
          Amount: loan.Amount,
          NoOfInstallments: loan.NoOfInstallments,
          PaymentType: loan.PaymentType,
          Particulars: loan.Particulars,
          TransType: loan.TransType,
          IsDeleted: loan.IsDeleted,
          LastUpdate: this.formatDate(new Date(loan.LastUpdate || new Date())),
          LastUpdatedBy: loan.LastUpdatedBy
        });

        // Monthly repayment
        if (loan.Amount && loan.NoOfInstallments) {
          const monthlyRepayment = (loan.Amount / loan.NoOfInstallments).toFixed(2);
          this.employeeUniformLoanForm.patchValue({ MonthlyRepayment: monthlyRepayment });
        }

        if (loan.ID && loan.InventoryCategoryID) {
          this.loadUniformItemRows(loan.ID, loan.InventoryCategoryID);
        }

        this.getBranchCodeByEmployeeId(loan.EmployeeID);

        // 👉 Call Employee API using EmployeeID
        return this._payrollService.getEmployeeById(loan.EmployeeID);
      })
    ).subscribe({
      next: (employee: any) => {
        if (employee) {
          // ✅ IMPORTANT: No [0] because it's NOT array anymore
          this.employeeUniformLoanForm.patchValue({
            EmployeeType: employee[0].EMP_ROLE
          });
        }
      },
      error: (err) => {
        console.error('Error loading data', err);
      }
    });
  }

  getInventoryList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getInventoryCategories().subscribe(
      (data) => {
        this.inventoryModel = data;
        this.hideSpinner();
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this.employeeService.getEmployeeMaster(userName).subscribe(
      (data) => {
        this.branchModel = data['branchList'];
        this.filteredBranchList = [...this.branchModel];
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  changeAdvanceTakenDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeUniformLoanForm.value.AdvanceTakenDate = this.formatDate(`${type}: ${event.value}`);
    this.reloadEmployee();
  }
  onBranchSelectionChange(event: any) {
    if (event.value != '' && event.value != undefined) {
      this.EmployeeID = 0;
      this.reloadEmployee();
      this.getAdvanceVoucherNo(event.value, '4');
    } else {
      this.employeeListModel = [];
      this.EmployeeID = 0;
    }

  }
  radioButtonTypeSelectionChange(event: any) {
    this.employeeSelectedType = event.value;
    this.reloadEmployee();
  }

  onInventoryChange(event: any) {
    this.itemFormArray.clear();
    if (this.advanceID > 0) {
      this.loadUniformItemRows(this.advanceID, event.value);
    } else {
      this.loadUniformItemRows(0, event.value);
    }
  }

  loadUniformItemRows(advanceId: number, category: number) {
    this.formReady = false;

    this._payrollService.getUniformItemRows(advanceId, category).subscribe(
      (data) => {

        // 👉 If advanceId is 0, set quantity = 0
        if (advanceId === 0 && data) {
          data = data.map((item: ItemMasterModel) => ({
            ...item,
            Quantity: 0   // 👈 change this based on your field name (Quantity / qty)
          }));
        }

        this.dataSource = new MatTableDataSource<ItemMasterModel>(data);
        this.initForm();
        this.formReady = true;
      },
      (error) => this.handleErrors(error)
    );
  }

  onQuantityChange(index: number): void {
    const control = this.itemFormArray.at(index);

    if (!control) {
      console.warn('FormGroup not found for index:', index);
      return;
    }

    const quantity = +control.get('Quantity')?.value;
    const price = this.dataSource.data[index]?.Price ?? 0;

    const previousTotal = +control.get('Total')?.value || 0;
    const newTotal = price * quantity;

    // Update the total for the item
    control.get('Total')?.setValue(newTotal);

    // Get current Amount
    const existingAmount = +this.employeeUniformLoanForm.get('Amount')?.value || 0;

    // Adjust Amount: remove previous total, add new total
    const adjustedAmount = existingAmount - previousTotal + newTotal;

    this.employeeUniformLoanForm.get('Amount')?.setValue(adjustedAmount);

    this.employeeUniformLoanForm.get('MonthlyRepayment')?.setValue(adjustedAmount / this.employeeUniformLoanForm.get('NoOfInstallments')?.value)
  }

  amountChange(event: any) {
    if (this.employeeUniformLoanForm.value.NoOfInstallments != '' && this.employeeUniformLoanForm.value.NoOfInstallments != undefined
      && this.employeeUniformLoanForm.value.Amount != 0) {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: event.target.value / this.employeeUniformLoanForm.value.NoOfInstallments
      });
    } else {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }

  noOfInstallmentsChange(event: any) {
    if (this.employeeUniformLoanForm.value.Amount != '' && this.employeeUniformLoanForm.value.Amount != undefined
      && this.employeeUniformLoanForm.value.NoOfInstallments != '0') {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: +((this.employeeUniformLoanForm.value.Amount / event.target.value).toFixed(2))
      });
    } else {
      this.employeeUniformLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }

  getNewVoucherNumber(transType: number): void {
    this._payrollService.getNewVoucherNumber(transType).subscribe(
      result => {
        this.employeeUniformLoanForm.patchValue({
          VoucherNo: result.VoucherNumber
        });
      },
      (error) => this.handleErrors(error)
    );
  }

  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeUniformLoanForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  reloadEmployee() {
    this.employeeSelectedType = this.employeeUniformLoanForm.get('EmployeeType')?.value;
    this.advanceDate = this.formatDate(this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value);
    this.branchCode = this.employeeUniformLoanForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.advanceDate)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.advanceDate)));
    if ((this.branchCode != null && this.branchCode != 'NaN-NaN-NaN' && this.branchCode != '')
      && this.advanceDate != null && this.advanceDate != 'NaN-NaN-NaN' && this.advanceDate != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(this.advanceDate, this.branchCode, this.employeeUniformLoanForm.value.EmployeeType, 4, 0, 'All');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      // this.employeeUniformLoanForm.patchValue({
      //   EmployeeType: 'Guard',
      // })
    }
  }

  onEmployeeChange(event: any) {
    this.selectedId = event.value;   // EMP_ID (number)
    this.EmployeeID = event.value;   // EMP_ID (number)

    this.ReloadGrid();
  }
  ReloadGrid() {
    this.advanceDate = this.formatDate(
      this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value
    );

    if (
      !this.advanceDate ||
      this.advanceDate === 'NaN-NaN-NaN'
    ) {
      this.employeeUniformLoanForm.patchValue({
        Amount: "",
        VoucherNo: "",
        NoOfInstallments: "",
        MonthlyRepayment: "",
      });
      return;
    }

    // EmployeeID MUST exist here
    if (!this.EmployeeID) {
      return;
    }

    const requests = [
      this._payrollService.getSalaryAdvances(
        this.advanceDate,
        this.EmployeeID.toString(), // API needs string
        '4'
      )
    ];

    forkJoin(requests).subscribe(
      (responses: any[]) => {
        const responseList = responses[0];

        const matchedRecord = responseList.find(
          (x: any) => x.EMP_ID === this.EmployeeID
        );

        if (matchedRecord) {
          this.advanceID = matchedRecord.ID;
          this.employeeUniformLoanForm.patchValue({
            Amount: matchedRecord.Amount,
            VoucherNo: matchedRecord.VoucherNo,
            NoOfInstallments: matchedRecord.NoOfInstallments,
            MonthlyRepayment:
              matchedRecord.Amount / matchedRecord.NoOfInstallments,
          });

          this.btnPrint = true;
          // DO NOT change isEdit here
        } else {
          this.advanceID = 0;
          this.btnPrint = false;
        }
      },
      (error) => this.handleErrors(error)
    );
  }

  getEmployeeListByEmployeeType(
    advanceDate: string,
    branchCode: string,
    employeeType: number,
    transType: number,
    advanceAmount: number,
    race: string
  ): void {
    this.showLoadingSpinner = true;

    const attendancePeriod = this.formatDate(
      this.employeeUniformLoanForm.get('AdvanceDate')?.value
    );

    this.StartPeriod = this.formatDate(
      this.firstOfMonth(new Date(attendancePeriod))
    );
    this.EndPeriod = this.formatDate(
      this.lastOfMonth(new Date(attendancePeriod))
    );

    forkJoin({
      employeeData: this._payrollService.getListByEmplyeeType(advanceDate, branchCode, employeeType, transType, advanceAmount, race),
      nameList: this._payrollService.getEmployeeLoanList(this.advanceDate, branchCode, employeeType.toString(), 4),
      employeeList: this._payrollService.getListByEmployee(branchCode, employeeType.toString(), this.StartPeriod, this.EndPeriod, 'Active'),
    }).subscribe(
      ({ employeeData, nameList, employeeList }) => {

        this.employeeListModel = this.isEdit ? employeeData : employeeList;
        // Remove staff if user doesn't have staff admin read access
        if (!this.staffAdminAccessModel.readAccess) {
          this.employeeListModel = this.employeeListModel.filter(
            (emp: any) => emp.EMP_TYPE?.toLowerCase() !== 'staff'
          );
        }
        this.filteredEmployeeList = [...this.employeeListModel];

        // ✅ NUMBER keys (IMPORTANT)
        this.employeeNameMap = Object.fromEntries(
          this.employeeListModel.map((e: any) => [e.EMP_ID, e.EMP_NAME])
        );

        this.nameList = nameList;

        // ✅ EDIT MODE – patch after list exists
        if (this.isEdit && this.employeeUniformLoanForm.value.EmployeeID) {
          const empId = Number(this.employeeUniformLoanForm.value.EmployeeID);

          if (this.employeeListModel.some(e => e.EMP_ID === empId)) {
            this.employeeUniformLoanForm.patchValue({
              EmployeeID: empId
            });
            this.EmployeeID = empId;
            this.selectedId = empId;
          }
        }

        // ✅ ADD MODE – auto select first
        if (!this.isEdit && this.employeeListModel.length > 0) {
          const firstEmpId = this.employeeListModel[0].EMP_ID;

          this.employeeUniformLoanForm.patchValue({
            EmployeeID: firstEmpId
          });

          this.EmployeeID = firstEmpId;
          this.selectedId = firstEmpId;
        }

        this.hideSpinner();
      },
      (error) => this.handleErrors(error)
    );
  }

  isEmployeeInNameList(empCode: string): boolean {
    return this.nameList && this.nameList.includes(empCode);
  }
  getEmployeeName(empId: number): string {
    if (!empId) return '';
    const emp = this.employeeListModel.find(e => e.ID === empId);
    return emp ? emp.EMP_NAME : '';

  }
  getBranchCodeByEmployeeId(empId: string) {
    forkJoin([
      this.employeeService.getEmployeeById(empId)
    ]).subscribe({
      next: ([response]) => {

        const employee = response?.Result?.employee;   //Extract actual employee

        // Store in array if needed
        this.employeeListModel = employee ? [employee] : [];
        // Remove staff if user doesn't have staff admin read access
        if (!this.staffAdminAccessModel.readAccess) {
          this.employeeListModel = this.employeeListModel.filter(
            (emp: any) => emp.EMP_TYPE?.toLowerCase() !== 'staff'
          );
        }
        this.filteredEmployeeList = [...this.employeeListModel];

        // Patch BranchCode
        this.employeeUniformLoanForm.patchValue({
          BranchCode: employee?.EMP_BRANCH_CODE || ''
        });

        // Trigger branch selection event
        const branchCode = this.employeeUniformLoanForm.get('BranchCode')?.value;
        if (branchCode) {
          this.onBranchSelectionChange({ value: branchCode });
        }
      },
      error: (err) => {
        console.error('Error loading employee:', err);
      }
    });
  }
  // savebuttonClick(): void {
  //   if (this.EmployeeID == 0) {
  //     this.showMessage(`Please select the Employee`, 'warning', 'Warning Message')
  //   } else {
  //     this.showLoadingSpinner = true;
  //     var AdvanceDate = this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value;

  //     var dateYear = new Date(AdvanceDate);
  //     this.year = dateYear.getFullYear();
  //     var dateMonth = new Date(AdvanceDate);
  //     this.month = dateMonth.getMonth() + 1;
  //     this.salaryMonthlyAdvance = this.employeeUniformLoanForm.value;
  //     this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
  //     this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
  //     //this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID;
  //     if (this.isEdit == true) {
  //       const emp = this.employeeListModel.find((x: any) => x.ID === this.employeeUniformLoanForm.value.EmployeeID);
  //       this.EmployeeID = emp ? emp.EMP_ID : 0;
  //       this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID
  //     } else {
  //       this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID
  //     }

  //     // Your existing method
  //     this._payrollService.checkExistAdvance(this.EmployeeID, this.formatDate(AdvanceDate), 4).subscribe({
  //       next: (exists) => {
  //         if (exists) {
  //           this.showMessage(`Record Exists. Please check.`, 'warning', 'Warning Message');
  //         } else {
  //           // Use forkJoin to combine multiple service calls
  //           forkJoin({
  //             salaryProcessed: this._payrollService.getSalaryProcessDate(this.EmployeeID, this.year, this.month).pipe(
  //               catchError(() => of(false)) // Handle errors and fallback to false
  //             ),
  //             resignDate: this._payrollService.getResignDateByEmployeeID(this.EmployeeID).pipe(
  //               catchError(() => of('1900-01-01T00:00:00')) // Fallback to default date if an error occurs
  //             )
  //           }).subscribe({
  //             next: ({ salaryProcessed, resignDate }) => {
  //               if (salaryProcessed) {
  //                 this.showMessage(
  //                   `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
  //                   'warning',
  //                   'Warning Message'
  //                 );
  //               } else {
  //                 const resignDate1 = new Date(resignDate);
  //                 const referenceDate = new Date('1900-01-01T00:00:00');

  //                 if (AdvanceDate > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {
  //                   this.showMessage(
  //                     `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
  //                     'warning',
  //                     'Warning Message'
  //                   );
  //                 } else {
  //                   // Save or update the salary advance
  //                   this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe({
  //                     next: (response) => {
  //                       if (response.Exists === 'Exists') {
  //                         this._dataService.setUsername(this.currentUser);
  //                         this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //                       }
  //                       if (response.Success === 'Success') {                          
  //                         this._dataService.setUsername(this.currentUser);
  //                         this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //                         //this._router.navigate(['/payroll/employee-monthly-advance']);
  //                         this._router.navigate(['/payroll/uniform-loan-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
  //                       }
  //                       this.hideSpinner();
  //                     },
  //                     error: (error) => this.handleErrors(error)
  //                   });
  //                 }
  //               }
  //             },
  //             error: (error) => this.handleErrors(error)
  //           });
  //         }
  //       },
  //       error: (error) => this.handleErrors(error)
  //     });
  //   }
  // }

  // savebuttonClick(): void {
  //   if (this.EmployeeID == 0) {
  //     this.showMessage(`Please select the Employee`, 'warning', 'Warning Message');
  //     return;
  //   }

  //   this.showLoadingSpinner = true;

  //   // Get Advance Date
  //   const AdvanceDate = this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value;
  //   const dateYear = new Date(AdvanceDate);
  //   this.year = dateYear.getFullYear();
  //   this.month = dateYear.getMonth() + 1;

  //   // Prepare salaryMonthlyAdvance
  //   this.salaryMonthlyAdvance = this.employeeUniformLoanForm.value;
  //   this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
  //   this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(this.employeeUniformLoanForm.value.AdvanceTakenDate));
  //   this.salaryMonthlyAdvance.LastUpdatedBy = this.currentUser;

  //   if (this.isEdit) {
  //     const emp = this.employeeListModel.find(x => x.EMP_ID === this.employeeUniformLoanForm.value.EmployeeID);
  //     this.EmployeeID = emp ? emp.EMP_ID : 0;
  //     this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID;
  //   } else {
  //     this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID;
  //   }

  //   console.log('save details: ',this.salaryMonthlyAdvance)
  //   // Superadmin bypasses all checks
  //   if (this.userRole === 'superadmin') {
  //     this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe({
  //       next: (response) => {
  //         this._dataService.setUsername(this.currentUser);
  //         if (response.Exists === 'Exists') {
  //           this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //         }
  //         if (response.Success === 'Success') {
  //           this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //           this._router.navigate(['/payroll/uniform-loan-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
  //         }
  //         this.hideSpinner();
  //       },
  //       error: (error) => this.handleErrors(error)
  //     });
  //     return; // skip all other logic
  //   }

  //   // Existing logic for normal users
  //   this._payrollService.checkExistAdvance(this.EmployeeID, this.formatDate(AdvanceDate), 4).subscribe({
  //     next: (exists) => {
  //       if (exists) {
  //         this.showMessage(`Record Exists. Please check.`, 'warning', 'Warning Message');
  //         this.hideSpinner();
  //       } else {
  //         forkJoin({
  //           salaryProcessed: this._payrollService.getSalaryProcessDate(this.EmployeeID, this.year, this.month).pipe(
  //             catchError(() => of(false))
  //           ),
  //           resignDate: this._payrollService.getResignDateByEmployeeID(this.EmployeeID).pipe(
  //             catchError(() => of('1900-01-01T00:00:00'))
  //           )
  //         }).subscribe({
  //           next: ({ salaryProcessed, resignDate }) => {
  //             if (salaryProcessed) {
  //               this.showMessage(
  //                 `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
  //                 'warning',
  //                 'Warning Message'
  //               );
  //               this.hideSpinner();
  //             } else {
  //               const resignDate1 = new Date(resignDate);
  //               const referenceDate = new Date('1900-01-01T00:00:00');

  //               if (AdvanceDate > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {
  //                 this.showMessage(
  //                   `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
  //                   'warning',
  //                   'Warning Message'
  //                 );
  //                 this.hideSpinner();
  //               } else {
  //                 this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe({
  //                   next: (response) => {
  //                     this._dataService.setUsername(this.currentUser);
  //                     if (response.Exists === 'Exists') {
  //                       this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //                     }
  //                     if (response.Success === 'Success') {
  //                       this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //                       this._router.navigate(['/payroll/uniform-loan-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
  //                     }
  //                     this.hideSpinner();
  //                   },
  //                   error: (error) => this.handleErrors(error)
  //                 });
  //               }
  //             }
  //           },
  //           error: (error) => this.handleErrors(error)
  //         });
  //       }
  //     },
  //     error: (error) => this.handleErrors(error)
  //   });
  // }


  savebuttonClick(): void {
    if (this.EmployeeID == 0) {
      this.showMessage(`Please select the Employee`, 'warning', 'Warning Message');
      return;
    }

    this.showLoadingSpinner = true;

    const AdvanceDate = this.employeeUniformLoanForm.get('AdvanceTakenDate')?.value;
    const dateYear = new Date(AdvanceDate);
    this.year = dateYear.getFullYear();
    this.month = dateYear.getMonth() + 1;

    // ✅ Prepare main object
    this.salaryMonthlyAdvance = this.employeeUniformLoanForm.value;
    this.salaryMonthlyAdvance.AdvanceDate = new Date(this.formatDate(AdvanceDate));
    this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(this.formatDate(AdvanceDate));
    this.salaryMonthlyAdvance.LastUpdatedBy = this.currentUser;
    this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID;

    // ✅ STEP 1: SAVE MAIN
    this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance)
      .subscribe({
        next: (response) => {

          const advanceId = response?.SalaryAdvance?.ID;

          // ✅ STEP 2: PREPARE ITEM DTO LIST
          const items: any[] = [];

          if (this.itemFormArray && this.itemFormArray.length > 0) {

            this.itemFormArray.controls.forEach((ctrl, index) => {

              const quantity = ctrl.get('Quantity')?.value;
              const item = this.dataSource.data[index];

              // skip empty
              if (!quantity || quantity <= 0) return;

              items.push({
                ID: item.ID || 0, // new insert
                AdvanceID: advanceId,
                ItemID: item.ItemID,
                Price: item.Price,
                Quantity: quantity,
                LastUpdatedBy: this.currentUser
              });
            });
          }

          // ✅ STEP 3: SAVE ITEMS (OPTIONAL)
          if (items.length > 0) {
            this._payrollService.saveEmployeeItems(items)
              .subscribe({
                next: () => this.afterSaveSuccess(response),
                error: (err) => this.handleErrors(err)
              });
          } else {
            this.afterSaveSuccess(response);
          }

        },
        error: (error) => this.handleErrors(error)
      });
  }

  afterSaveSuccess(response: any) {
    this._dataService.setUsername(this.currentUser);

    if (response.Success === 'Success') {
      this.showMessage(`${response.Message}`, 'success', 'Success Message');

      this._router.navigate(
        ['/payroll/uniform-loan-report'],
        { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' }
      );
    }

    this.hideSpinner();
  }
  clearEmployeeLoanDetails(): void {
    this.employeeUniformLoanForm.reset();

  }
  onDeleteClick(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this employee uniform loan details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          if (this.userRole?.toLowerCase() === 'superadmin') {
            forkJoin({
              deleteResult: this._payrollService.deleteSalaryAdvance(this.advanceID, this.currentUser),
            }).subscribe(
              ({ deleteResult }) => {
                if (deleteResult.success == true) {
                  this.showMessage(`${deleteResult.message}`, 'success', 'Success Message');
                  this.clearEmployeeLoanDetails();
                }
                this.hideSpinner();
              },
              (error) => {
                this.handleErrors(error);
              }
            );
            return;
          }

          const advanceDate = this.formatDate(this.employeeUniformLoanForm.value.AdvanceDate);
          if (this.isEdit == true) {
            if (this.employeeListModel.length > 0) {
              const emp = this.employeeListModel.find((x: any) => x.ID === this.employeeUniformLoanForm.value.EmployeeID);
              this.EmployeeID = emp ? emp.EMP_ID : 0;
            } else {
              this.EmployeeID = this.employeeUniformLoanForm.value.EmployeeID
            }
          } else {
            this.EmployeeID = this.employeeUniformLoanForm.value.EmployeeID
          }
          if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
            const requests = [
              this._payrollService.getSalaryAdvances(advanceDate, this.EmployeeID.toString(), '3')
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
                    salaryProcessed: this._payrollService.getSalaryProcessDate(response[0].EmployeeID, this.year, this.month).pipe(
                      catchError(() => of(false)) // Handle errors and fallback to false
                    )
                  }).subscribe({
                    next: ({ salaryProcessed }) => {
                      if (salaryProcessed) {
                        this.showMessage(
                          `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
                          'warning',
                          'Warning Message'
                        );
                      } else {
                        forkJoin({
                          deleteResult: this._payrollService.deleteSalaryAdvance(this.advanceID, this.currentUser),
                        }).subscribe(
                          ({ deleteResult }) => {
                            if (deleteResult.success == true) {
                              this.showMessage(`${deleteResult.message}`, 'success', 'Success Message')
                              this.clearEmployeeLoanDetails();
                            }
                          },
                          (error) => {
                            error: (error: any) => this.handleErrors(error)
                          }
                        );
                      }
                    },
                    error: (error) => this.handleErrors(error)
                  });
                }
              },
              (error) => {
                this.handleErrors(error);
              }
            );
          } else {
            this.showMessage(
              `Please select Advance Process. Data is a mandatory field.`,
              'warning',
              'Warning Message'
            );
          }
        } else {
          this.hideSpinner();
        }
      })

  }
  OnPrintClick(): void {
    this._router.navigate(['/payroll/uniform-loan-report'], { queryParams: { id: this.advanceID }, queryParamsHandling: 'merge' });
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
  canSaveEmployee(): boolean {

    const empType = this.employeeUniformLoanForm.get('EmployeeType')?.value;

    // Superadmin
    if (this.userRole === 'superadmin') {
      return true;
    }

    // Staff
    if (empType === 'Staff') {
      return !!(this.staffAdminAccessModel?.createAccess || this.staffAdminAccessModel?.updateAccess);
    }

    // Guard / Others
    return !!(this.userAccessModel?.createAccess || this.userAccessModel?.updateAccess);
  }
  canDeleteEmployee(): boolean {

    const empType = this.employeeUniformLoanForm.get('EmployeeType')?.value;

    // Superadmin
    if (this.userRole === 'superadmin') {
      return true;
    }

    // Staff
    if (empType === 'Staff') {
      return !!this.staffAdminAccessModel?.deleteAccess;
    }

    // Guard / Others
    return !!this.userAccessModel?.deleteAccess;
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
    return;
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showMessage(`${error}`, 'error', 'Error Message');
    }
  };

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
