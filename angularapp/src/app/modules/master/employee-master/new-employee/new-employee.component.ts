import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeService } from "../../../../service/employee.service";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { DatasharingService } from "../../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { debounceTime, forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.component.html',
  styleUrls: ['./new-employee.component.css']
})
export class NewEmployeeComponent implements OnInit {
  frm!: FormGroup;
  isForeigner: boolean = false;
  isBank: boolean = true;
  isBank2: boolean = true;
  data: any;
  branchList: any;
  bankList: any;
  stateList: any;
  icColorList: any;
  nationalityList: any;
  raceList: any;
  clientList: any;
  salaryStructureList: any;
  employeeCheckInfoValidation: boolean = true;
  currentUser: string = '';
  empId: any;
  isEdit: boolean = false;
  empCodeData: any | undefined;
  check: any = 1;
  checkList: any = [
    {
      id: 0,
      display: ""
    }
  ];

  empChkError: any = [];
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  checklistItems = [
    { value: 0, label: 'Application Form' },
    { value: 1, label: 'Copy of IC' },
    { value: 2, label: 'Bank Account Details' },
    { value: 3, label: 'Passport Size Photos' },
    { value: 4, label: 'Copy of Passport' },
    { value: 5, label: 'Copy of Visa' },
    { value: 6, label: 'Appointment Letter' },
    { value: 7, label: 'Confirmation Letter' },
    { value: 8, label: 'KDN Vetting' },
    { value: 9, label: 'CSG/TNG' },
  ];
  submitted = false;
  payMode: string = '';
  payMode2: string = '';
  existEMP_IC: string = ''

  branchSearchString: string = '';
  clientSearchString: string = '';
  filteredBranchList: any[] = [];
  filteredClientList: any[] = [];
  branchSearchSubject = new Subject<string>();
  clientSearchSubject = new Subject<string>();
  bankSearchSubject = new Subject<string>();
  bankSearchString: string = '';
  filteredBankList: any[] = [];
  staffAdminAccessModel!: UserAccessModel;
  userRole!: string;
  actualWorkingDays: number = 0;

  constructor(private fb: FormBuilder, public dialog: MatDialog, public service: EmployeeService, private activatedRoute: ActivatedRoute, private route: Router, private _dataService: DatasharingService,
    private _masterService: MastermoduleService) {

    this.empId = this.activatedRoute.snapshot.params['EMP_ID'];
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    service.getEmployeeMaster(this.currentUser).subscribe((data: any) => {
      this.data = data;
      this.branchList = data['branchList'];
      this.bankList = data['bankList'];
      this.stateList = data['stateList'];
      this.icColorList = data['icColorList'];
      this.nationalityList = data['nationalityList'];
      this.raceList = data['raceList'];
      this.clientList = data['clientList'];
      this.salaryStructureList = data['salaryStructureList'];

      this.filteredBranchList = [...this.branchList];
      this.filteredClientList = [...this.clientList];
      this.filteredBankList = [...this.bankList];

    });
    this.frm = this.fb.group({
      EMP_ID: [0],
      EMP_CODE: [''],
      EMP_BRANCH_CODE: ['', [Validators.required]],
      EMP_CLIENT: [''],
      EMP_ROLE: ['None', [Validators.required]],
      EMP_NAME: ['', [Validators.required]],
      EMP_SEX: ['Male'],
      EMP_DATE_OF_BIRTH: [''],
      age: [''],
      EMP_CITIZEN: ['0'],
      EMP_NATIONAL: [''],
      EMP_IC_NEW: [''],
      EMP_IC_OLD: [''],
      EMP_PASSPORT_NO: [''],
      EMP_RACE: [''],
      EMP_ADDRESS1: ['', [Validators.required]],
      EMP_ADDRESS2: ['', [Validators.required]],
      EMP_POST_CODE: ['', [Validators.required, Validators.maxLength(5)]],
      EMP_TOWN: ['', [Validators.required]],
      EMP_STATE: [''],
      EMP_PHONE: ['', [Validators.required]],
      EMP_MOBILEPHONE: [''],
      EMP_MARTIAL_STATUS: ['', Validators.required],
      EM_WORK_EXP: [''],
      EMP_HGH_EDU: [''],
      EMP_SPOUSE_NAME: [''],
      EMP_SP_IC: [''],
      EMP_SP_WORK: ['0'],
      EMP_SP_TEL_NO: [''],
      EMP_NO_CHILD: [0],
      EMP_PER_NAME_CONTACT: [''],
      EMP_CONTACT_ADDRESS1: ['', [Validators.required]],
      EMP_CONTACT_ADDRESS2: ['', [Validators.required]],
      EMP_CONTACT_POST_CODE: ['', [Validators.required, Validators.maxLength(5)]],
      EMP_CONTACT_TOWN: ['', [Validators.required]],
      EMP_CONTACT_STATE: ['', [Validators.required]],
      EMP_CONTACT_TELEPHONE: ['', [Validators.required]],
      EMPPAY_JOB_TITLE: ['', [Validators.required]],
      EMPPAY_CATEGORY: ['', [Validators.required]],
      EMPPAY_DATE_JOINED: [''],
      EMPPAY_DATE_RESIGNED: [''],
      salary_structure: [''],
      SALARYLAB: [0],
      NewSalaryStructure: ['N'],
      SalaryStructure1000_3h: ['0'],
      EMPPAY_BASIC_RATE: ['', [Validators.required]],
      ATTENDANCEALLOWANCE: [0],
      AttendanceAllowanceWorkingDays: [0],
      AttendanceAllowanceFollowCalendar: [false],
      SpecialAllowance: [0],
      PAYMODE: ['Bank'],
      KPI: [null],
      SplitSalaryPayment: ['', [Validators.required]],
      EMPFL_BANK: ['', [Validators.required]],
      EMPFL_BK_ACCNO: ['', [Validators.required]],
      PAYMODE2: ['Bank'],
      EMPFL_2ndBank: ['', [Validators.required]],
      EMPFL_2ndBK_ACCNO: ['', [Validators.required]],
      TMPGUARD: ['', Validators.required],
      INCOMETAXDETECT: ['', Validators.required],
      SOCSODETECT: ['', Validators.required],
      EMPFL_SOSCO_NO: [''],
      EPFDETECT: ['', Validators.required],
      DETECTBYND55: ['', Validators.required],
      EMPFL_EPFNO: [''],
      EMPFL_TAX_NO: [''],
      application_form: [''],
      copy_ic: [''],
      bank_ac_detail: [''],
      passport_size_photo: [''],
      copy_of_passport: [''],
      copy_of_visa: [''],
      appointment_letter: [''],
      confirm_letter: [''],
      kdn_vetting: [''],
      HasTransfered: [false],
      TransferDate: [''],
      KDNVetting: [],
      EMP_CHECKLIST: [],
      EMPPAY_ID: [0],
      EMPFL_ID: [0]
    });

    this.checklistItems.forEach((item) => {
      this.frm.addControl(`checklistItem_${item.value}`, new FormControl(false));
    });

    if (this.empId != 0 && this.empId != undefined) {
      this.isEdit = true;

      service.getEmployeeById(this.empId).subscribe(
        (d: any) => {
          const result = d?.Result ?? {};
          const employee = result?.employee ?? {};
          const employment = result?.employment ?? {};
          const salaryDetail = result?.salaryDetail ?? {};

          // Safely assign pay modes
          this.payMode = salaryDetail?.PAYMODE ?? '';
          this.payMode2 = salaryDetail?.PAYMODE2 ?? '';

          // Trigger dependent changes safely
          this.nationalityChange(employee?.EMP_CITIZEN ?? '');
          this.changePaymentMode(this.payMode);
          this.changePaymentMode2(this.payMode2);
          this.clientChange(employee?.EMP_BRANCH_CODE?.toString() ?? '');

          // Only clean EMP_NAME if exists
          if (employee?.EMP_NAME) {
            employee.EMP_NAME = employee.EMP_NAME.replace(/''/g, "'");
          }
          this.actualWorkingDays = employment?.AttendanceAllowanceWorkingDays;
          // Patch forms safely
          this.frm.patchValue(employee ?? {});
          this.frm.patchValue(employment ?? {});
          this.frm.patchValue(salaryDetail ?? {});

          this.frm.get('EMP_ROLE')?.setValue((employee?.EMP_ROLE ?? '').toString());
          this.frm.get('EMP_CLIENT')?.setValue((employee?.EMP_CLIENT ?? '').toString());
          this.frm.get('EMP_CITIZEN')?.setValue((employee?.EMP_CITIZEN ?? '').toString());
          this.frm.get('SALARYLAB')?.setValue((employment?.SALARYLAB ?? 0).toString());
          this.frm.get('EMP_SP_WORK')?.setValue(employee?.EMP_SP_WORK ? "1" : "0");
          this.frm.get('TMPGUARD')?.setValue(salaryDetail?.TMPGUARD === false ? "0" : "1");
          this.frm.get('INCOMETAXDETECT')?.setValue(salaryDetail?.INCOMETAXDETECT ? "Yes" : "No");
          this.frm.get('SOCSODETECT')?.setValue(salaryDetail?.SOCSODETECT ? "Yes" : "No");
          this.frm.get('EPFDETECT')?.setValue(salaryDetail?.EPFDETECT ? "Yes" : "No");
          this.frm.get('DETECTBYND55')?.setValue(salaryDetail?.DETECTBYND55 ? "Yes" : "No");
          this.frm.get('AttendanceAllowanceFollowCalendar')?.setValue(employment?.AttendanceAllowanceFollowCalendar === "Y");
          this.frm.get('KPI')?.setValue(employment?.KPI ?? null);
          this.frm.get('SplitSalaryPayment')?.setValue(salaryDetail?.SplitSalaryPayment === 1 ? "true" : "false");

          // Trigger calendar event safely
          this.calendarChangeEvent(employment?.AttendanceAllowanceFollowCalendar === "Y");

          // Set employee IC safely
          this.existEMP_IC = employee?.EMP_IC_NEW?.toString() ?? '';

          // Checklist logic
          const oEmployeeCheckList = employee?.EMP_CHECKLIST ?? 0; // 256+128+64+32+16+8+4+2+1
          this.frm.get('EMP_ROLE')?.disable({ onlySelf: true });
          this.checklistItems.forEach((item) => {
            const formControl = this.frm.get(`checklistItem_${item.value}`);
            if (formControl) {
              formControl.setValue(!!(oEmployeeCheckList & (1 << item.value)));
            }
          });
        },
        (error) => {
          // Handle error if needed
          console.error('Failed to get employee:', error);
        },
        () => {
          // After complete
          this.calculateAge();
          this.typeChange();
        }
      );
    } else {
      service.getEmployeeMaster(this.currentUser).subscribe((data: any) => {
        this.data = data;
        this.empCodeData = data['emp']['Result'];

        if (!this.isEdit && this.frm.get('EMP_ROLE')?.value != 'None') {
          this.setEmpCode();
        }
      });
    }
    this.frm.get('EMP_CODE')?.disable({ onlySelf: true });
    this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });
    this.frm.get("EMPPAY_BASIC_RATE")?.disable({ onlySelf: true });
    this.frm.get("AttendanceAllowanceWorkingDays")?.disable({ onlySelf: true });

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
      this.branchList = [...this.filteredBranchList];
    });

    // Client search debounce
    this.clientSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.clientSearchString = '';
      this.clientList = [...this.filteredClientList];
    });

    // Bank search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.bankList = [...this.filteredBankList];
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser);

    this.frm.get('EMPPAY_DATE_RESIGNED')?.valueChanges.subscribe(value => {
      const currentPayMode = this.frm.get('PAYMODE')?.value;
      const currentPayMode2 = this.frm.get('PAYMODE2')?.value;
      if ((value) && currentPayMode !== 'Cheque') {
        this.frm.get('PAYMODE')?.setValue('Cheque');
        this.frm.get('EMPFL_BANK')?.clearValidators();
        this.frm.get('EMPFL_BK_ACCNO')?.clearValidators();
        this.frm.get('EMPFL_BANK')?.disable({ onlySelf: true })
        this.frm.get('EMPFL_BK_ACCNO')?.disable({ onlySelf: true })
      } else {
        if (this.payMode != null) {
          if (this.payMode == 'Cash' || this.payMode == 'Cheque') {
            this.frm.get('PAYMODE')?.setValue(this.payMode);
            this.frm.get('EMPFL_BANK')?.clearValidators();
            this.frm.get('EMPFL_BK_ACCNO')?.clearValidators();
            this.frm.get('EMPFL_BANK')?.disable({ onlySelf: true })
            this.frm.get('EMPFL_BK_ACCNO')?.disable({ onlySelf: true })
          } else {
            this.frm.get('PAYMODE')?.setValue(this.payMode);
            this.frm.get('EMPFL_BANK')?.enable({ onlySelf: true })
            this.frm.get('EMPFL_BK_ACCNO')?.enable({ onlySelf: true })

            this.frm.get("EMPFL_BANK")?.setValidators([Validators.required])
            this.frm.get("EMPFL_BK_ACCNO")?.setValidators([Validators.required])
          }
        } else {
          this.frm.get('PAYMODE')?.setValue('Cheque');
          this.frm.get('EMPFL_BANK')?.clearValidators();
          this.frm.get('EMPFL_BK_ACCNO')?.clearValidators();
          this.frm.get('EMPFL_BANK')?.disable({ onlySelf: true })
          this.frm.get('EMPFL_BK_ACCNO')?.disable({ onlySelf: true })
        }

      }
      if ((value) && currentPayMode2 !== 'Cheque') {
        this.frm.get('PAYMODE2')?.setValue('Cheque');
        this.frm.get('EMPFL_2ndBank')?.clearValidators();
        this.frm.get('EMPFL_2ndBK_ACCNO')?.clearValidators();
        this.frm.get('EMPFL_2ndBank')?.disable({ onlySelf: true })
        this.frm.get('EMPFL_2ndBK_ACCNO')?.disable({ onlySelf: true })
      } else {
        if (this.payMode2 != null) {
          if (this.payMode2 == 'Cash' || this.payMode2 == 'Cheque') {
            this.frm.get('PAYMODE2')?.setValue(this.payMode2);
            this.frm.get('EMPFL_2ndBank')?.clearValidators();
            this.frm.get('EMPFL_2ndBK_ACCNO')?.clearValidators();
            this.frm.get('EMPFL_2ndBank')?.disable({ onlySelf: true })
            this.frm.get('EMPFL_2ndBK_ACCNO')?.disable({ onlySelf: true })
          } else {
            this.frm.get('PAYMODE2')?.setValue(this.payMode2);
            this.frm.get('EMPFL_2ndBank')?.enable({ onlySelf: true })
            this.frm.get('EMPFL_2ndBK_ACCNO')?.enable({ onlySelf: true })

            this.frm.get("EMPFL_2ndBank")?.setValidators([Validators.required])
            this.frm.get("EMPFL_2ndBK_ACCNO")?.setValidators([Validators.required])
          }
        } else {
          this.frm.get('PAYMODE2')?.setValue('Cheque');
          this.frm.get('EMPFL_2ndBank')?.clearValidators();
          this.frm.get('EMPFL_2ndBK_ACCNO')?.clearValidators();
          this.frm.get('EMPFL_2ndBank')?.disable({ onlySelf: true })
          this.frm.get('EMPFL_2ndBK_ACCNO')?.disable({ onlySelf: true })
        }
      }
    });
  }

  // getUserAccessRights(userName: string, screenName: string) {
  //   this._masterService.getUserAccessRights(userName, screenName).subscribe(
  //     (data) => {
  //       if (data != null) {
  //         this.userAccessModel.readAccess = data.Read
  //         this.userAccessModel.deleteAccess = data.Delete;
  //         this.userAccessModel.updateAccess = data.Update;
  //         this.userAccessModel.createAccess = data.Create;
  //         if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
  //         } else {
  //           if (this.userAccessModel.readAccess === true) {
  //             this.warningMessage = '';
  //           } else {
  //             this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
  //                       You do not have permissions to view this page. <br>
  //                       If you feel you should have access to this page, Please contact administrator. <br>
  //                       Thank you`;

  //           }
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
      employeeAccess: this._masterService.getUserAccessRights(userName, 'Employee Master'),
      staffAdminAccess: this._masterService.getUserAccessRights(userName, 'Employee Master Staff Admin')
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

  nationalityChange(value: any) {
    this.isForeigner = value == 1;

    if (this.isForeigner) {
      this.frm.get('EMP_IC_NEW')?.setValue("");
      this.frm.get('EMP_IC_OLD')?.setValue("");
      this.frm.get('EMP_IC_NEW')?.disable({ onlySelf: true });
      this.frm.get('EMP_IC_OLD')?.disable({ onlySelf: true });
      this.frm.get('EMP_POST_CODE')?.disable({ onlySelf: true });
      this.frm.get('EMP_STATE')?.disable({ onlySelf: true });
      this.frm.get('EMP_CONTACT_POST_CODE')?.disable({ onlySelf: true });
      this.frm.get('EMP_CONTACT_STATE')?.disable({ onlySelf: true });
    } else {
      this.frm.get('EMP_IC_NEW')?.setValue(this.existEMP_IC);
      this.frm.get('EMP_IC_NEW')?.enable({ onlySelf: true });
      this.frm.get('EMP_IC_OLD')?.enable({ onlySelf: true });
      this.frm.get('EMP_POST_CODE')?.enable({ onlySelf: true });
      this.frm.get('EMP_STATE')?.enable({ onlySelf: true });
      this.frm.get('EMP_CONTACT_POST_CODE')?.enable({ onlySelf: true });
      this.frm.get('EMP_CONTACT_STATE')?.enable({ onlySelf: true });
    }

  }

  clientChange(value: any) {
    this.service.getClientsFromBranchId(value, this.frm.get('EMP_ROLE')?.value).subscribe((data: any) => {
      //this.empCodeData = data.emp      
      this.clientList = data['clientList'];
      this.filteredClientList = [...this.clientList];
      this.setEmpCode();
    })
  }

  typeChange() {
    if (this.frm.get('EMP_ROLE')?.value == 'None') {
      this.frm.get('EMP_CODE')?.setValue('');
    }
    if (this.empCodeData != undefined) {
      this.setEmpCode();
    }

    if (this.frm.get('EMP_ROLE')?.value === 'Staff') {
      this.frm.get("EMP_CLIENT")?.setValue("");
      this.frm.get("EMP_CLIENT")?.disable({ onlySelf: true });
    } else {
      this.frm.get("EMP_CLIENT")?.enable({ onlySelf: true });
    }

  }

  setEmpCode() {
    if (this.empCodeData != undefined && this.empCodeData != null && this.frm.get('EMP_ROLE')?.value != 'None') {
      let empCode = this.empCodeData["ShortName"] + this.frm.get('EMP_ROLE')?.value[0] + this.empCodeData["Code"];
      this.frm.get('EMP_CODE')?.setValue(empCode);
    }
  }

  calculateAge() {
    let dob = this.frm.get('EMP_DATE_OF_BIRTH')?.value
    if (dob) {
      const birthDate = new Date(dob);
      const currentDate = new Date();
      this.frm.get('age')?.setValue(currentDate.getFullYear() - birthDate.getFullYear());
    }
  }


  changePaymentMode(value: any) {
    this.isBank = value === "Bank";

    if (this.isBank) {
      this.frm.get('EMPFL_BANK')?.enable({ onlySelf: true })
      this.frm.get('EMPFL_BK_ACCNO')?.enable({ onlySelf: true })

      this.frm.get("EMPFL_BANK")?.setValidators([Validators.required])
      this.frm.get("EMPFL_BK_ACCNO")?.setValidators([Validators.required])
    } else {
      //this.frm.get('EMPFL_BANK')?.setValue("");
      //this.frm.get('EMPFL_BK_ACCNO')?.setValue("");
      this.frm.get('EMPFL_BANK')?.clearValidators(); // Clear validators
      this.frm.get('EMPFL_BK_ACCNO')?.clearValidators(); // Clear validators
      this.frm.get('EMPFL_BANK')?.disable({ onlySelf: true })
      this.frm.get('EMPFL_BK_ACCNO')?.disable({ onlySelf: true })

      // Update validation status for the form controls
      this.frm.get('EMPFL_BANK')?.updateValueAndValidity();
      this.frm.get('EMPFL_BK_ACCNO')?.updateValueAndValidity();
    }
  }

  changePaymentMode2(value: any) {
    if (value != null) {
      this.isBank2 = value === "Bank";

      if (this.isBank2) {
        this.frm.get('EMPFL_2ndBank')?.enable({ onlySelf: true })
        this.frm.get('EMPFL_2ndBK_ACCNO')?.enable({ onlySelf: true })

        this.frm.get("EMPFL_2ndBank")?.setValidators([Validators.required])
        this.frm.get("EMPFL_2ndBK_ACCNO")?.setValidators([Validators.required])
      } else {
        //this.frm.get('EMPFL_BANK')?.setValue("");
        //this.frm.get('EMPFL_BK_ACCNO')?.setValue("");
        this.frm.get('EMPFL_2ndBank')?.clearValidators(); // Clear validators
        this.frm.get('EMPFL_2ndBK_ACCNO')?.clearValidators(); // Clear validators
        this.frm.get('EMPFL_2ndBank')?.disable({ onlySelf: true })
        this.frm.get('EMPFL_2ndBK_ACCNO')?.disable({ onlySelf: true })

        // Update validation status for the form controls
        this.frm.get('EMPFL_2ndBank')?.updateValueAndValidity();
        this.frm.get('EMPFL_2ndBK_ACCNO')?.updateValueAndValidity();
      }
    } else {
      this.frm.get('PAYMODE2')?.setValue('Cheque');
      this.frm.get('EMPFL_2ndBank')?.clearValidators();
      this.frm.get('EMPFL_2ndBK_ACCNO')?.clearValidators();
      this.frm.get('EMPFL_2ndBank')?.disable({ onlySelf: true })
      this.frm.get('EMPFL_2ndBK_ACCNO')?.disable({ onlySelf: true })

      this.frm.get('EMPFL_2ndBank')?.updateValueAndValidity();
      this.frm.get('EMPFL_2ndBK_ACCNO')?.updateValueAndValidity();
    }
  }

  onResignDateChange() {
    // --------- Check if empId is valid ---------
    if (this.empId > 0) {

      const resignedDateValue = this.frm.value.EMPPAY_DATE_RESIGNED;
      const joinDateValue = this.frm.value.EMPPAY_DATE_JOINED;

      if (!resignedDateValue || !joinDateValue) return;

      const resignedDate = new Date(resignedDateValue);
      const joinDate = new Date(joinDateValue);

      // --------- 1. Resigned Date cannot be less than Join Date ---------
      if (resignedDate <= joinDate) {
        this.showMessage(
          "Resigned Date cannot be lesser than Join Date.",
          "warning",
          "Warning Message"
        );
        this.frm.patchValue({ EMPPAY_DATE_RESIGNED: null });
        return;
      }

      // --------- 2. Continue with salary & attendance validations ---------
      const year = resignedDate.getFullYear();
      const month = resignedDate.getMonth() + 1;

      forkJoin({
        latestSalaryAdvanceDate: this.service.getLatestSalaryAdvanceDate(this.empId),
        lastAttendanceDate: this.service.getLastAttendanceDate(this.empId),
        isSalaryProcessed: this.service.getSalaryProcessed(this.empId, year, month),
        latestSalaryProcessDate: this.service.getLatestSalaryProcessDate(this.empId, year, month)
      }).subscribe(res => {

        const latestSalaryAdvanceDate = new Date(res.latestSalaryAdvanceDate);
        const lastAttendanceDate = new Date(res.lastAttendanceDate);
        const latestSalaryProcessDate = new Date(res.latestSalaryProcessDate);

        const username = this.currentUser?.toLowerCase();

        // --------- Salary Process Logic ---------
        if (username !== 'admin' && username !== 'superadmin') {
          if (!(latestSalaryProcessDate.getMonth() + 1 === month &&
            latestSalaryProcessDate.getFullYear() === year)) {
            if (res.isSalaryProcessed) {
              if (resignedDate < latestSalaryProcessDate) {
                this.showMessage(
                  `Resigned Date Cannot be Less than ${this.formatDate(latestSalaryProcessDate)} (Latest Salary Process Date)!`,
                  'warning',
                  'Warning Message'
                );
                this.resetResignDate();
                return;
              }
            }
          }
        }

        // --------- Latest Salary Advance Date ---------
        if (resignedDate < latestSalaryAdvanceDate) {
          this.showMessage(
            `Resigned Date Cannot be Less than ${this.formatDate(latestSalaryAdvanceDate)} (Latest Salary Advance Date)!`,
            'warning',
            'Warning Message'
          );
          this.resetResignDate();
          return;
        }

        // --------- Last Attendance Date ---------
        if (resignedDate < lastAttendanceDate) {
          this.showMessage(
            `Resigned Date Cannot be Less than ${this.formatDate(lastAttendanceDate)} (Last Attendance Date)!`,
            'warning',
            'Warning Message'
          );
          this.resetResignDate();
          return;
        }

      }, err => this.handleErrors(err));

    } else {
      const resignedDateValue = this.frm.value.EMPPAY_DATE_RESIGNED;
      const joinDateValue = this.frm.value.EMPPAY_DATE_JOINED;

      if (!resignedDateValue || !joinDateValue) return;

      const resignedDate = new Date(resignedDateValue);
      const joinDate = new Date(joinDateValue);

      // --------- 1. Resigned Date cannot be less than Join Date ---------
      if (resignedDate <= joinDate) {
        this.showMessage(
          "Resigned Date cannot be lesser than Join Date.",
          "warning",
          "Warning Message"
        );
        this.frm.patchValue({ EMPPAY_DATE_RESIGNED: null });
        return;
      }
    }
  }

  onJoinDateChange() {
    const resignedDateValue = this.frm.value.EMPPAY_DATE_RESIGNED;
    const joinDateValue = this.frm.value.EMPPAY_DATE_JOINED;

    if (!resignedDateValue || !joinDateValue) return;

    const resignedDate = new Date(resignedDateValue);
    const joinDate = new Date(joinDateValue);

    // --------- 1. Resigned Date cannot be less than Join Date ---------
    if (resignedDate <= joinDate) {
      this.showMessage(
        "Resigned Date cannot be lesser than Join Date.",
        "warning",
        "Warning Message"
      );
      this.frm.patchValue({ EMPPAY_DATE_RESIGNED: null });
      return;
    }
  }
  resetResignDate() {
    this.frm.patchValue({
      EMPPAY_DATE_RESIGNED: null
    });
  }
  formatDate(date: any): string {
    if (!date) return '';

    const d = new Date(date);

    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  onSubmit() {

    this.submitted = true;

    if (this.frm.invalid) {
      return; // block only for truly invalid required fields
    }
    if (this.frm.get('EMP_ROLE')?.value == 'None') {
      return;
    }
    if (this.frm.get('EMP_BRANCH_CODE')?.value == '' || this.frm.get('EMP_BRANCH_CODE')?.value == undefined) {
      return;
    }
    // if (this.frm.invalid) {
    //   // Special case: KPI is null but untouched → allow save
    //   const kpiControl = this.frm.get('KPI');
    //   if (kpiControl && !kpiControl.touched && kpiControl.value === null) {
    //     // ignore KPI invalid
    //   } else {
    //     return; // block save normally
    //   }
    // }

    if (!this.employeeCheckInfoValidation && this.isForeigner) {
      this.showMessage('Employee already has this IC number. Please choose a different IC number.', 'warning', 'Warning Message');
      return;
    }


    let data = this.frm.getRawValue();

    data['EMP_SP_WORK'] = this.frm.get('EMP_SP_WORK')?.value == '1' ? true : false;

    data['OldBranch'] = '';
    data['EMP_IC_COLOR'] = 'test';
    data['LastUpdatedBy'] = 'admin';
    data['TMPGUARD'] = this.frm.get('TMPGUARD')?.value == '0' ? false : true;
    data['DETECTBYND55'] = this.frm.get('DETECTBYND55')?.value == 'Yes';
    data['INCOMETAXDETECT'] = this.frm.get('INCOMETAXDETECT')?.value == 'Yes';
    data['SOCSODETECT'] = this.frm.get('SOCSODETECT')?.value == 'Yes';
    data['EPFDETECT'] = this.frm.get('EPFDETECT')?.value == 'Yes';
    data['KDNVetting'] = false;

    data['AttendanceAllowanceFollowCalendar'] = this.frm.get('AttendanceAllowanceFollowCalendar')?.value ? 'Y' : 'N';

    data['EMP_DATE_OF_BIRTH'] = this.returnDate(this.frm.get('EMP_DATE_OF_BIRTH')?.value);
    data['TransferDate'] = this.returnDate();
    data['LASTUPDATE'] = this.returnDate();
    data['EMPPAY_DATE_JOINED'] = this.returnDate(this.frm.get('EMPPAY_DATE_JOINED')?.value);
    data['EMPPAY_DATE_RESIGNED'] = this.frm.get('EMPPAY_DATE_RESIGNED')?.value ? this.returnDate(this.frm.get('EMPPAY_DATE_RESIGNED')?.value) : null;
    let total = 0;
    this.checklistItems.forEach((item) => {
      const formControl = this.frm.get(`checklistItem_${item.value}`);

      if (formControl && formControl.value) {
        total += Math.pow(2, item.value);
        if (Math.pow(2, item.value) == 256) {
          data['KDNVetting'] = true;
        }
      }
    });

    data['EMP_CHECKLIST'] = total;
    data['EMP_POST_CODE'] = this.frm.get('EMP_POST_CODE')?.value ?? "";
    data['EMP_STATE'] = this.frm.get('EMP_STATE')?.value ?? "";
    data['EMP_CONTACT_POST_CODE'] = this.frm.get('EMP_CONTACT_POST_CODE')?.value ?? "";
    data['EMP_CONTACT_STATE'] = this.frm.get('EMP_CONTACT_STATE')?.value ?? "";
    const kpiValue = this.frm.get('KPI')?.value;
    data['KPI'] = kpiValue !== null && kpiValue !== '' ? Number(kpiValue) : 0;

    data['SplitSalaryPayment'] = this.frm.get('SplitSalaryPayment')?.value == 'true' ? true : false;
    console.log('data', data)
    this.service.saveEmployee(data).subscribe((d: any) => {
      if (d.Success == 'Success') {
        if (this.isEdit) {
          this.showMessage('Successfully Updated Employee Details', 'success', 'Success Message')
        } else {
          this.showMessage('Successfully Saved Employee Details', 'success', 'Success Message')
        }
        this.route.navigate(['/master/employee-master']);
      } else {
        if (d.Success == 'Warning') {
          this.showMessage(d.Message, 'warning', 'Warning Message');
        }
      }
    })
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

  calendarChange(event: any) {
    this.calendarChangeEvent(event.checked);
  }

  // calendarChangeEvent(flag: boolean) {
  //   if (flag) {
  //     this.frm.get('AttendanceAllowanceWorkingDays')?.setValue("0");
  //     this.frm.get('AttendanceAllowanceWorkingDays')?.disable({ onlySelf: true });
  //   } else {
  //     this.frm.get('AttendanceAllowanceWorkingDays')?.setValue("0");
  //     this.frm.get('AttendanceAllowanceWorkingDays')?.enable({ onlySelf: true });
  //   }
  // }

  calendarChangeEvent(flag: boolean) {
    const control = this.frm.get('AttendanceAllowanceWorkingDays');

    if (!control) return;

    if (flag) {
      // FollowCalendar = true → auto set + disable
      const value = this.actualWorkingDays = 0;
      control.setValue(value);
      control.disable({ onlySelf: true });

    } else {
      // FollowCalendar = false → enable manual input
      control.enable({ onlySelf: true });

      // DO NOT overwrite if user already typed
      if (!control.value || control.value === 0) {
        control.setValue(this.actualWorkingDays ?? 0);
      }
    }
  }

  salaryStructureChange(event: any) {
    if (event.value == 'N') {
      this.frm.get('EMPPAY_BASIC_RATE')?.enable({ onlySelf: true });
      this.frm.get('EMPPAY_BASIC_RATE')?.setValue("");
    } else {
      this.frm.get('EMPPAY_BASIC_RATE')?.setValue("0");
      this.frm.get('EMPPAY_BASIC_RATE')?.disable({ onlySelf: true });
    }
  }

  isTemporaryEmployeeChange(value: any) {
    if (value == '0') {
      this.frm.get("INCOMETAXDETECT")?.setValue("No");
      this.frm.get("SOCSODETECT")?.setValue("No");
      this.frm.get("EPFDETECT")?.setValue("No");
      this.frm.get("DETECTBYND55")?.setValue("No");
      this.frm.get("EMPFL_TAX_NO")?.disable({ onlySelf: true });
      this.frm.get("EMPFL_EPFNO")?.disable({ onlySelf: true });
      this.frm.get("EMPFL_SOSCO_NO")?.disable({ onlySelf: true });

    } else {
      this.frm.get("INCOMETAXDETECT")?.setValue("Yes");
      this.frm.get("SOCSODETECT")?.setValue("Yes");
      this.frm.get("EPFDETECT")?.setValue("Yes");
      this.frm.get("DETECTBYND55")?.setValue("Yes");

      this.frm.get("EMPFL_TAX_NO")?.enable({ onlySelf: true });
      this.frm.get("EMPFL_EPFNO")?.enable({ onlySelf: true });
      this.frm.get("EMPFL_SOSCO_NO")?.enable({ onlySelf: true });
    }
  }

  checkEmployeeInfo(from: any) {
    let _trigger = true;
    let data;
    if (from == "NewIC") {
      data = this.frm.get("EMP_IC_NEW")?.value;
    } else if (from == "OldIC") {
      data = this.frm.get("EMP_IC_OLD")?.value;
    } else if (from == "Passport") {
      data = this.frm.get("EMP_PASSPORT_NO")?.value;
    } else if (from == "SOCSONo") {
      data = this.frm.get("EMPFL_SOSCO_NO")?.value;
    } else if (from == "EPFNo") {
      data = this.frm.get("EMPFL_EPFNO")?.value;
    } else if (from == "BankAccount") {
      if (this.frm.get("EMPFL_BANK")?.value != "" && this.frm.get("EMPFL_BK_ACCNO")?.value != "") {
        data = this.frm.get("EMPFL_BANK")?.value + "//" + this.frm.get("EMPFL_BK_ACCNO")?.value;
        _trigger = true;
      } else {
        _trigger = false;
      }
    }
    else if (from == "BankAccount2") {
      if (this.frm.get("EMPFL_2ndBank")?.value != "" && this.frm.get("EMPFL_2ndBK_ACCNO")?.value != "") {
        data = this.frm.get("EMPFL_2ndBank")?.value + "//" + this.frm.get("EMPFL_2ndBK_ACCNO")?.value;
        _trigger = true;
      } else {
        _trigger = false;
      }
    }

    if (_trigger) {
      this.service.checkEmployeeInfo(from, data).subscribe((d: any) => {
        var result = d['Result'];
        result.EMP_ID = result?.EMP_ID == 0 ? -1 : result?.EMP_ID;
        if (result?.EMP_ID != this.empId) {
          this.empChkError[from] = result?.MESSAGE;
          this.employeeCheckInfoValidation = result?.MESSAGE == "success";
        }
      })
    }
  }

  maritalStatusChange(event: any) {
    if (event.value == "Married") {
      this.frm.get("EMP_NO_CHILD")?.enable({ onlySelf: true });
    } else {
      this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });
    }
  }

  salaryStructureChangeSlab(data: any) {
    console.log(data.value);

    // SalaryBand
    // WorkingDays

    let da = this.salaryStructureList.filter((x: any) => x.SalaryId == data.value)
    console.log(da);
    this.frm.get("EMPPAY_BASIC_RATE")?.setValue(da[0]['SalaryBand'])
    this.frm.get("AttendanceAllowanceWorkingDays")?.setValue(da[0]['WorkingDays'])


  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString' | 'clientSearchString' | 'bankSearchString',
    listProp: 'branchList' | 'clientList' | 'bankList',
    filteredListProp: 'filteredBranchList' | 'filteredClientList' | 'filteredBankList',
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

    // Superadmin always allowed
    if (this.userRole === 'superadmin') {
      return true;
    }

    const role = this.frm.get('EMP_ROLE')?.value;

    if (role === 'Guard') {
      return this.isEdit
        ? !!this.userAccessModel?.updateAccess
        : !!this.userAccessModel?.createAccess;
    }

    if (role === 'Staff') {
      return this.isEdit
        ? !!this.staffAdminAccessModel?.updateAccess
        : !!this.staffAdminAccessModel?.createAccess;
    }

    return false;
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
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
