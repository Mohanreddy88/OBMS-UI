import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, forkJoin, of, Subject } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { BranchModel } from 'src/app/model/branchModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { SalaryMonthlyAdvance } from 'src/app/model/salaryMonthlyAdvance';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { twoDecimalPlacesValidator } from 'src/app/shared/validators/custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-employee-loan',
  templateUrl: './new-employee-loan.component.html',
  styleUrls: ['./new-employee-loan.component.css']
})
export class NewEmployeeLoanComponent implements OnInit {
  isEdit: boolean = false;
  employeeLoanForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  employeeAdvanceTitleStatus: string = 'new';
  branchCode: string = 'null';
  clientCode: string = 'null';
  employeeModel!: EmployeeMonthlyAdvance[];
  salaryMonthlyAdvance: SalaryMonthlyAdvance = new SalaryMonthlyAdvance();
  minDate = new Date();
  branchModel!: BranchModel[];
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  employeeListModel: EmployeeAdvanceListModel[] = [];
  year!: number;
  month!: number;
  EmployeeID!: number;
  btnPrint: boolean = false;
  btnDelete: boolean = false;
  salaryAdvanceID: number = 0;
  employeeNameMap: { [key: number]: string } = {};
  StartPeriod!: string;
  EndPeriod!: string;

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


  constructor(private fb: FormBuilder, public dialog: MatDialog, public employeeService: EmployeeService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _payrollService: PayrollModuleService,
    private _dataService: DatasharingService) {
    this.employeeLoanForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      EmployeeType: ['Guard'],
      BranchCode: [''],
      AdvanceTakenDate: ['', [Validators.required]],
      AdvanceDate: ['', [Validators.required]],
      VoucherNo: [''],
      Amount: ['', [Validators.required, twoDecimalPlacesValidator()]],
      NoOfInstallments: ['', [Validators.required]],
      PaymentType: ['Bank'],
      Particulars: [''],
      TransType: ['3'],
      IsDeleted: [false],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
      MonthlyRepayment: [''],
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
    this.salaryMonthlyAdvance.TransType = 3;
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
    //this.getEmployeeMasterList();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.salaryAdvanceID = params['id'];
        this.btnDelete = true;
        this.btnPrint = true;
        this.isEdit = true
        this.getEmployeeUniformList(params['id']);
      } else {
        this.salaryAdvanceID = 0;
        this.isEdit = false;
        this.btnDelete = false;
        this.btnPrint = false;
      }
    });

    // ... after fetching staffAdminAccessModel
    if (!this.staffAdminAccessModel.readAccess && this.employeeLoanForm.value.EmployeeType === 'Staff') {
      this.employeeLoanForm.patchValue({ EmployeeType: 'Guard' });
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Employee Loan'),
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
  getEmployeeUniformList(loanId: number): void {
    forkJoin({
      loan: this._payrollService.getEmployeeLoanById(loanId, 3)
    }).subscribe({
      next: ({ loan }) => {
        if (loan) {
          this.employeeLoanForm.patchValue({
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
            LastUpdatedBy: loan.LastUpdatedBy || 'Admin'
          });
          if (loan.Amount && loan.NoOfInstallments) {
            const monthlyRepayment = (loan.Amount / loan.NoOfInstallments).toFixed(2);
            this.employeeLoanForm.patchValue({ MonthlyRepayment: monthlyRepayment });
          }
          this.getBranchCodeByEmployeeId(loan.EmployeeID);
        }
      },
      error: (err) => {
        console.error('Error loading loan', err);
      }
    });
  }
  changeAdvanceTakenDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeLoanForm.value.AdvanceTakenDate = this.formatDate(`${type}: ${event.value}`);
    this.employeeLoanForm.patchValue({
      AdvanceDate: this.formatDate(event.value)
    })
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.employeeLoanForm.value.AdvanceDate = this.formatDate(`${type}: ${event.value}`);
  }
  onBranchSelectionChange(event: any) {
    if (event.value != '' && event.value != undefined) {
      const advanceDate = this.formatDate(this.employeeLoanForm.get('AdvanceDate')?.value);
      const branchCode = this.employeeLoanForm.get('BranchCode')?.value;
      if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
        this.getEmployeeListByEmployeeType(advanceDate, branchCode, this.employeeLoanForm.value.EmployeeType, 3, 0, 'All')
        this.getAdvanceVoucherNo(event.value, '3');
      }
    } else {
      this.employeeListModel = [];
      this.EmployeeID = 0;
      this.employeeLoanForm.patchValue({
        Amount: '',
        NoOfInstallments: '',
        MonthlyRepayment: ''
      })
    }

  }
  radioButtonTypeSelectionChange(event: any) {
    const employeeSelectedType = event.value
    const advanceDate = this.formatDate(this.employeeLoanForm.get('AdvanceTakenDate')?.value);
    const branchCode = this.employeeLoanForm.get('BranchCode')?.value;
    if ((branchCode != null && branchCode != 'NaN-NaN-NaN' && branchCode != '')
      && advanceDate != null && advanceDate != 'NaN-NaN-NaN' && advanceDate != '') {
      this.errorMessage = '';
      this.getEmployeeListByEmployeeType(advanceDate, branchCode, employeeSelectedType, 3, 0, 'All');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
    }

  }
  onEmployeeSelectionChange(event: any) {
    const selectedId = event.value; // This is employee.ID (DB key)
    if (this.isEdit == true) {
      const emp = this.employeeListModel.find((x: any) => x.ID === selectedId);
      // ✅ Map ID -> EMP_ID for API call
      this.EmployeeID = emp ? emp.EMP_ID : 0;
    } else {
      this.EmployeeID = event.value;
    }


    const advanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);

    if (advanceDate != null && advanceDate != 'NaN-NaN-NaN') {
      forkJoin([
        this._payrollService.getSalaryAdvances(advanceDate, this.EmployeeID.toString(), '3')
      ]).subscribe(
        (responses: any[]) => {
          const responseList = responses[0];
          // Filter by current form ID
          const matchedRecord = responseList.find((x: any) => x.ID === selectedId);

          if (matchedRecord) {
            this.salaryAdvanceID = matchedRecord.ID;
            this.employeeLoanForm.patchValue({
              ID: matchedRecord.ID,
              EmployeeID: matchedRecord.ID,
              AdvanceTakenDate: matchedRecord.AdvanceTakenDate,
              AdvanceDate: matchedRecord.AdvanceDate,
              Amount: matchedRecord.Amount,
              VoucherNo: matchedRecord.VoucherNo,
              NoOfInstallments: matchedRecord.NoOfInstallments,
              MonthlyRepayment: matchedRecord.Amount / matchedRecord.NoOfInstallments,
              PaymentType: matchedRecord.PaymentType,
              Particulars: matchedRecord.Particulars,
              TransType: matchedRecord.TransType,
              IsDeleted: matchedRecord.IsDeleted,
              LastUpdate: this.formatDate(new Date(matchedRecord.LastUpdate || new Date())),
              LastUpdatedBy: matchedRecord.LastUpdatedBy || 'Admin'
            });
            this.btnDelete = true;
            this.btnPrint = true;
          } else {
            // No record with that ID
            this.salaryAdvanceID = 0;
            this.btnDelete = false;
            this.btnPrint = false;
          }
        },
        (error) => {
          this.handleErrors(error);
        }
      );
      this.getEmployeeName(selectedId)
    } else {
      this.showMessage(
        `Please select Advance Process. Data is a mandatory field.`,
        'warning',
        'Warning Message'
      );
    }
  }
  getEmployeeListByEmployeeType(advanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): void {
    const attendancePeriod = this.formatDate(this.employeeLoanForm.get('AdvanceDate')?.value);
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(attendancePeriod)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(attendancePeriod)));
    forkJoin([
      this._payrollService.getListByEmplyeeType(advanceDate, branchCode, employeeType, transType, advanceAmount, race),
      this._payrollService.getListByEmployee(branchCode, employeeType.toString(), this.StartPeriod, this.EndPeriod, 'Active'),
    ]).subscribe(

      ([employeeData, employeeList]) => {
        if (this.isEdit == true) {
          this.employeeListModel = employeeData;
          // Remove staff if user doesn't have staff admin read access
          if (!this.staffAdminAccessModel.readAccess) {
            this.employeeListModel = this.employeeListModel.filter(
              (emp: any) => emp.EMP_TYPE?.toLowerCase() !== 'staff'
            );
          }
          this.filteredEmployeeList = [...this.employeeListModel];

          const currentEmpId = this.employeeLoanForm.value.ID;

          // Re-patch EmployeeID if it's set and exists in the list → forces highlight
          if (currentEmpId && this.employeeListModel.some(e => e.ID === currentEmpId)) {
            this.employeeLoanForm.patchValue({
              EmployeeID: currentEmpId
            });
          }
          this.employeeNameMap = Object.fromEntries(
            this.employeeListModel.map((e: any) => [e.ID, e.EMP_NAME])
          );
        } else {
          this.employeeListModel = employeeList;
          // Remove staff if user doesn't have staff admin read access
          if (!this.staffAdminAccessModel.readAccess) {
            this.employeeListModel = this.employeeListModel.filter(
              (emp: any) => emp.EMP_TYPE?.toLowerCase() !== 'staff'
            );
          }
          this.filteredEmployeeList = [...this.employeeListModel];
        }
      }
      ,
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  amountChange(event: any) {
    if (this.employeeLoanForm.value.NoOfInstallments != '' && this.employeeLoanForm.value.NoOfInstallments != undefined
      && this.employeeLoanForm.value.Amount != 0) {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: event.target.value / this.employeeLoanForm.value.NoOfInstallments
      });
    } else {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  noOfInstallmentsChange(event: any) {
    if (this.employeeLoanForm.value.Amount != '' && this.employeeLoanForm.value.Amount != undefined
      && this.employeeLoanForm.value.NoOfInstallments != '0') {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: this.employeeLoanForm.value.Amount / event.target.value
      });
    } else {
      this.employeeLoanForm.patchValue({
        MonthlyRepayment: ''
      });
    }
  }
  getAdvanceVoucherNo(branch: string, transType: string): void {
    forkJoin({
      voucherNo: this._payrollService.getAdvanceVoucherNo(branch, transType),
    }).subscribe(
      ({ voucherNo }) => {
        // Assuming the response contains VoucherNo directly
        this.employeeLoanForm.patchValue({
          VoucherNo: voucherNo.VoucherNo || voucherNo
        });
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  getEmployeeMasterList(): void {
    this.showLoadingSpinner = true;
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
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
        const employee = response?.Result?.employee;   // ✅ Extract actual employee

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
        this.employeeLoanForm.patchValue({
          BranchCode: employee?.EMP_BRANCH_CODE || ''
        });

        // Trigger branch selection event
        const branchCode = this.employeeLoanForm.get('BranchCode')?.value;
        if (branchCode) {
          this.onBranchSelectionChange({ value: branchCode });
        }
      },
      error: (err) => {
        console.error('Error loading employee:', err);
      }
    });
  }

  onDeleteClick(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this employee loan details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          // SUPERADMIN DIRECT DELETE
          if (this.userRole === 'superadmin') {
            if (this.userRole === 'superadmin') {
              forkJoin({
                deleteResult: this._payrollService.deleteSalaryAdvance(this.salaryAdvanceID, this.currentUser),
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
            return;
          }

          // EXISTING LOGIC
          const advanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);
          if (this.isEdit == true) {
            if (this.employeeListModel.length > 0) {
              const emp = this.employeeListModel.find((x: any) => x.ID === this.employeeLoanForm.value.EmployeeID);
              this.EmployeeID = emp ? emp.EMP_ID : 0;
            } else {
              this.EmployeeID = this.employeeLoanForm.value.EmployeeID
            }
          } else {
            this.EmployeeID = this.employeeLoanForm.value.EmployeeID
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
                          deleteResult: this._payrollService.deleteSalaryAdvance(this.salaryAdvanceID, this.currentUser),
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
    this._router.navigate(['/payroll/loan-voucher-report'], { queryParams: { id: this.salaryAdvanceID }, queryParamsHandling: 'merge' });
  }
  // savebuttonClick(): void {
  //   if (this.EmployeeID == 0) {
  //     this.showMessage(`Please select the Employee`, 'warning', 'Warning Message')
  //   } else {
  //     this.showLoadingSpinner = true;
  //     var AdvanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);
  //     var AdvanceTakenDate = this.formatDate(this.employeeLoanForm.value.AdvanceTakenDate);
  //     //this.EmployeeID = this.employeeLoanForm.value.EmployeeID;
  //     var dateYear = new Date(AdvanceDate);
  //     this.year = dateYear.getFullYear();
  //     var dateMonth = new Date(AdvanceDate);
  //     this.month = dateMonth.getMonth() + 1;

  //     this.salaryMonthlyAdvance = this.employeeLoanForm.value;
  //     this.salaryMonthlyAdvance.AdvanceDate = new Date(AdvanceDate)
  //     this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(AdvanceTakenDate)
  //     this.salaryMonthlyAdvance.ID = this.salaryAdvanceID == 0 ? 0 : this.salaryAdvanceID
  //     this.salaryMonthlyAdvance.LastUpdatedBy = this.currentUser;
  //     if (this.isEdit == true) {
  //       const emp = this.employeeListModel.find((x: any) => x.ID === this.employeeLoanForm.value.EmployeeID);
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

  //                 if (new Date(AdvanceDate) > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {
  //                   this.showMessage(
  //                     `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
  //                     'warning',
  //                     'Warning Message'
  //                   );
  //                 } else {
  //                   // Save or update the salary advance
  //                   this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe((response) => {
  //                     if (response.Exists == 'Exists') {
  //                       this._dataService.setUsername(this.currentUser);
  //                       this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
  //                     }
  //                     if (response.Success == 'Success') {
  //                       this._dataService.setUsername(this.currentUser);
  //                       this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //                       this._router.navigate(['/payroll/loan-voucher-report'], { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' });
  //                     }
  //                     setTimeout(() => {
  //                       this.hideSpinner();
  //                     }, 3000);

  //                   },
  //                     (error) => this.handleErrors(error)
  //                   );
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

  savebuttonClick(): void {

    if (this.EmployeeID == 0) {
      this.showMessage(`Please select the Employee`, 'warning', 'Warning Message')
    } else {

      this.showLoadingSpinner = true;

      var AdvanceDate = this.formatDate(this.employeeLoanForm.value.AdvanceDate);
      var AdvanceTakenDate = this.formatDate(this.employeeLoanForm.value.AdvanceTakenDate);

      var dateYear = new Date(AdvanceDate);
      this.year = dateYear.getFullYear();

      var dateMonth = new Date(AdvanceDate);
      this.month = dateMonth.getMonth() + 1;

      this.salaryMonthlyAdvance = this.employeeLoanForm.value;
      this.salaryMonthlyAdvance.AdvanceDate = new Date(AdvanceDate);
      this.salaryMonthlyAdvance.AdvanceTakenDate = new Date(AdvanceTakenDate);
      this.salaryMonthlyAdvance.ID = this.salaryAdvanceID == 0 ? 0 : this.salaryAdvanceID;
      this.salaryMonthlyAdvance.LastUpdatedBy = this.currentUser;

      if (this.isEdit == true) {
        const emp = this.employeeListModel.find((x: any) => x.ID === this.employeeLoanForm.value.EmployeeID);
        this.EmployeeID = emp ? emp.EMP_ID : 0;
        this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID
      } else {
        this.salaryMonthlyAdvance.EmployeeID = this.EmployeeID
      }

      // SUPERADMIN BYPASS
      if (this.userRole.toLowerCase() === 'superadmin') {

        this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe(
          (response) => {

            if (response.Exists == 'Exists') {
              this._dataService.setUsername(this.currentUser);
              this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
            }

            if (response.Success == 'Success') {
              this._dataService.setUsername(this.currentUser);
              this.showMessage(`${response.Message}`, 'success', 'Success Message');
              this._router.navigate(
                ['/payroll/loan-voucher-report'],
                { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' }
              );
            }

            setTimeout(() => {
              this.hideSpinner();
            }, 3000);

          },
          (error) => this.handleErrors(error)
        );

        return;
      }

      // EXISTING LOGIC CONTINUES FOR OTHER USERS
      this._payrollService.checkExistAdvance(this.EmployeeID, this.formatDate(AdvanceDate), 4).subscribe({
        next: (exists) => {

          if (exists) {
            this.showMessage(`Record Exists. Please check.`, 'warning', 'Warning Message');
          } else {

            forkJoin({
              salaryProcessed: this._payrollService.getSalaryProcessDate(this.EmployeeID, this.year, this.month).pipe(
                catchError(() => of(false))
              ),
              resignDate: this._payrollService.getResignDateByEmployeeID(this.EmployeeID).pipe(
                catchError(() => of('1900-01-01T00:00:00'))
              )
            }).subscribe({

              next: ({ salaryProcessed, resignDate }) => {

                if (salaryProcessed) {

                  this.showMessage(
                    `Salary already processed for this Guard/Staff. You do not have the right to update or save. Please contact HQ for more information.`,
                    'warning',
                    'Warning Message'
                  );

                } else {

                  const resignDate1 = new Date(resignDate);
                  const referenceDate = new Date('1900-01-01T00:00:00');

                  if (new Date(AdvanceDate) > resignDate1 && resignDate1.getTime() !== referenceDate.getTime()) {

                    this.showMessage(
                      `Advance Date cannot exceed the Guard/Staff Resign Date. Please contact HQ for more information.`,
                      'warning',
                      'Warning Message'
                    );

                  } else {

                    this._payrollService.saveAndUpdateSalaryMonthlyAdvance(this.salaryMonthlyAdvance).subscribe(
                      (response) => {

                        if (response.Exists == 'Exists') {
                          this._dataService.setUsername(this.currentUser);
                          this.showMessage(`${response.Message}`, 'warning', 'Warning Message');
                        }

                        if (response.Success == 'Success') {
                          this._dataService.setUsername(this.currentUser);
                          this.showMessage(`${response.Message}`, 'success', 'Success Message');
                          this._router.navigate(
                            ['/payroll/loan-voucher-report'],
                            { queryParams: { id: response.SalaryAdvance.ID }, queryParamsHandling: 'merge' }
                          );
                        }

                        setTimeout(() => {
                          this.hideSpinner();
                        }, 3000);

                      },
                      (error) => this.handleErrors(error)
                    );

                  }
                }
              },
              error: (error) => this.handleErrors(error)
            });
          }
        },
        error: (error) => this.handleErrors(error)
      });

    }
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
    const empType = this.employeeLoanForm.get('EmployeeType')?.value;

    if (this.userRole === 'superadmin') {
      return true;
    }

    if (empType === 'Staff') {
      return !!(this.staffAdminAccessModel?.createAccess || this.staffAdminAccessModel?.updateAccess);
    }

    return !!(this.userAccessModel?.createAccess || this.userAccessModel?.updateAccess);
  }
  canDeleteOrPrint(): boolean {
    return this.currentUser === 'superadmin' || !!this.userAccessModel?.deleteAccess;
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
  clearEmployeeLoanDetails(): void {
    this.salaryAdvanceID = 0
    this.btnDelete = false;
    this.btnPrint = false;
    this.employeeLoanForm.reset();

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

