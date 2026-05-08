import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchModel } from 'src/app/model/branchModel';
import { BranchResponseModel } from 'src/app/model/branchResponseModel';
import { SalaryDynamicStructure } from 'src/app/model/SalaryDynamicStructure';
import { SalaryStructure } from 'src/app/model/salaryStructure';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-salary-slab',
  templateUrl: './new-salary-slab.component.html',
  styleUrls: ['./new-salary-slab.component.css']
})
export class NewSalarySlabComponent implements OnInit {

  salaryForm!: FormGroup;
  salaryDynamicForm!: FormGroup;
  salaryModel!: SalaryStructure;
  salaryDynamicModel!: SalaryDynamicStructure;
  branchModel!: BranchModel[];
  salaryTitleStatus: string = 'new';
  showLoadingSpinner: boolean = false;
  radioEmployeeType: string = "None";
  radioNationalityType: string = 'Local';
  branchCode: string = 'null'
  salaryID: number = 0;
  branchListObj: any = {
    dropdownValue: 'null',
    branchCode: 'null'
  }
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute) {
    this.salaryForm = this.fb.group({
      SalaryId: ['0'],
      BranchCode: ['NULL'],
      EmployeeType: ['Guard'],
      EmployeeNationality: ['L'],
      Name: ['', [Validators.required]],
      ActualDays: ['26'],
      EICC: [false],
      WorkingDays: ['', [Validators.required]],
      WorkingHours: ['8'],
      GeneralDayRate: ['', [Validators.required]],
      GeneralDayHours: ['8'],
      GeneralDayOTRate: ['', [Validators.required]],
      GeneralDayOTAmount: [''],
      OffDayRate: ['', [Validators.required]],
      OffDayAmount: [''],
      OffDayOTRate: ['', [Validators.required]],
      OffDayOTAmount: [''],
      HolidayRate: ['', [Validators.required]],
      HolidayAmount: [''],
      HolidayOTRate: ['', [Validators.required]],
      HolidayOTAmount: [''],
      SalaryBand: [''],
      TravelAllowance: ['0.00'],
      Status: ['Active'],
      Active: ['None'],
      NonStructure: [false]
    });

    this.salaryDynamicForm = this.fb.group({
      dSalaryId: ['0'],
      dBranchCode: ['NULL'],
      dEmployeeType: ['Guard'],
      dEmployeeNationality: ['L'],
      dName: ['', [Validators.required]],
      dActualDays: ['26'],
      dEICC: [false],
      dWorkingDays: ['', [Validators.required]],
      dWorkingHours: ['8'],
      dGeneralDayRate: ['', [Validators.required]],
      dGeneralDayHours: ['8'],
      dGeneralDayOTRate: ['', [Validators.required]],
      dGeneralDayOTAmount: [''],
      dOffDayRate: ['', [Validators.required]],
      dOffDayAmount: [''],
      dOffDayOTRate: ['', [Validators.required]],
      dOffDayOTAmount: [''],
      dHolidayRate: ['', [Validators.required]],
      dHolidayAmount: [''],
      dHolidayOTRate: ['', [Validators.required]],
      dHolidayOTAmount: [''],
      dSalaryBand: [''],
      dTravelAllowance: ['0.00'],
      dStatus: ['Active'],
      dActive: ['None'],
      dNonStructure: [false]
    });
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
    this.getUserAccessRights(this.currentUser, 'Salary Slab');
    this.getBranchMasterList()
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.salaryID = params['id'];
        this.getSalaryMasterList(this.salaryID, params['status']);
      }
    });

  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onInput(event: any, controlName: string): void {
    // Remove non-numeric characters from the input value
    const inputValue = event.target.value.replace(/[^0-9]/g, '');

    // Update the form control value with the cleaned input value
    this.salaryForm.get(controlName)?.setValue(inputValue);
  }
  getBranchMasterList() {
    this._masterService.getBranchMaster(this.branchCode).subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getSalaryMasterList(id: number, status: string): void {
    this.showLoadingSpinner = true;
    this._masterService.getSalaryMaster(id, status).subscribe(
      (data) => {
        this.salaryTitleStatus = 'edit';
        this.salaryForm.patchValue({
          SalaryId: data[0].SalaryId,
          BranchCode: data[0].BranchCode,
          EmployeeType: data[0].EmployeeType,
          EmployeeNationality: data[0].EmployeeNationality,
          Name: data[0].Name,
          ActualDays: 26,
          EICC: data[0].EICC,
          WorkingDays: data[0].WorkingDays,
          WorkingHours: data[0].WorkingHours,
          GeneralDayRate: Number(data[0].GeneralDayRate).toFixed(2),
          GeneralDayHours: data[0].GeneralDayHours,
          GeneralDayOTRate: data[0].GeneralDayOTRate,
          OffDayRate: data[0].OffDayRate,
          OffDayOTRate: data[0].OffDayOTRate,
          HolidayRate: data[0].HolidayRate,
          HolidayOTRate: data[0].HolidayOTRate,
          SalaryBand: data[0].SalaryBand,
          TravelAllowance: data[0].TravelAllowance,
          Status: data[0].Status,
          Active: data[0].Active,
          NonStructure: data[0].NonStructure,
        });
        this.salaryDynamicForm.patchValue({
          dSalaryId: data[0].SalaryId,
          dBranchCode: data[0].BranchCode,
          dEmployeeType: data[0].EmployeeType,
          dEmployeeNationality: data[0].EmployeeNationality,
          dName: data[0].Name,
          dActualDays: 26,
          dEICC: data[0].EICC,
          dWorkingDays: data[0].WorkingDays,
          dWorkingHours: data[0].WorkingHours,
          dGeneralDayRate: data[0].GeneralDayRate,
          dGeneralDayHours: data[0].GeneralDayHours,
          dGeneralDayOTRate: data[0].GeneralDayOTRate,
          dOffDayRate: data[0].OffDayRate,
          dOffDayOTRate: data[0].OffDayOTRate,
          dHolidayRate: data[0].HolidayRate,
          dHolidayOTRate: data[0].HolidayOTRate,
          dSalaryBand: data[0].SalaryBand,
          dTravelAllowance: data[0].TravelAllowance,
          dStatus: data[0].Status,
          dActive: data[0].Active,
          dNonStructure: data[0].NonStructure,
        });

        this.salaryForm.patchValue({
          OffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * data[0].OffDayRate).toFixed(2),
          HolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * data[0].HolidayRate).toFixed(2),
          GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].GeneralDayOTRate).toFixed(2),
          OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].OffDayOTRate).toFixed(2),
          HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].HolidayOTRate).toFixed(2)

        });
        this.salaryDynamicForm.patchValue({
          dOffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * data[0].OffDayRate).toFixed(7),
          dHolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * data[0].HolidayRate).toFixed(7),
          dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].GeneralDayOTRate).toFixed(7),
          dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].OffDayOTRate).toFixed(7),
          dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * data[0].HolidayOTRate).toFixed(7)

        });
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  employeeSelectionChanged(event: MatRadioChange) {
    this.radioEmployeeType = event.value;
    this.salaryDynamicForm.patchValue({
      dEmployeeType: event.value
    });
    if (this.radioEmployeeType === 'Staff') {
      if (this.salaryID == 0) {
        this.salaryForm.patchValue({
          ActualDays: '26',
          WorkingDays: '0',
          WorkingHours: '8',
          GeneralDayRate: '',
          GeneralDayHours: '8',
          GeneralDayOTRate: '',
          OffDayOTRate: '',
          HolidayRate: '',
          OffDayRate: '',
          HolidayOTRate: '',
          EmployeeNationality: 'L',
          OffDayAmount: '',
          HolidayAmount: '',
          GeneralDayOTAmount: '',
          OffDayOTAmount: '',
          HolidayOTAmount: '',
          TravelAllowance: '0.00',
          SalaryBand: ''
        });
      }
    }
    if (this.radioEmployeeType === 'Guard') {
      if (this.salaryID == 0) {
        this.salaryForm.patchValue({
          ActualDays: '26',
          WorkingDays: '0',
          WorkingHours: '8',
          GeneralDayRate: '',
          GeneralDayHours: '8',
          GeneralDayOTRate: '',
          OffDayOTRate: '',
          HolidayRate: '',
          OffDayRate: '',
          HolidayOTRate: '',
          OffDayAmount: '',
          HolidayAmount: '',
          GeneralDayOTAmount: '',
          OffDayOTAmount: '',
          HolidayOTAmount: '',
          TravelAllowance: '0.00',
          SalaryBand: ''
        });
      }
    }
  }

  nationalitySelectionChanged(event: MatRadioChange) {
    this.radioNationalityType = event.value;
    this.salaryDynamicForm.patchValue({
      dEmployeeNationality: event.value
    });
    if (this.radioNationalityType === 'F' && this.radioEmployeeType === 'Guard') {
      this.salaryForm.patchValue({
        ActualDays: 26,
        WorkingDays: '0',
        WorkingHours: 12,
        GeneralDayHours: 8,
        GeneralDayOTRate: '',
        OffDayOTRate: '',
        HolidayRate: '',
        OffDayRate: '',
        HolidayOTRate: '',
        OffDayAmount: '',
        HolidayAmount: '',
        GeneralDayOTAmount: '',
        OffDayOTAmount: '',
        HolidayOTAmount: '',
        TravelAllowance: '0.00',
        SalaryBand: ''
      });
    }
    if (this.radioNationalityType === 'L') {
      this.salaryForm.patchValue({
        ActualDays: 26,
        WorkingDays: '0',
        WorkingHours: '',
        GeneralDayHours: 8,
        GeneralDayOTRate: '',
        OffDayOTRate: '',
        HolidayRate: '',
        OffDayRate: '',
        HolidayOTRate: '',
        OffDayAmount: '',
        HolidayAmount: '',
        GeneralDayOTAmount: '',
        OffDayOTAmount: '',
        HolidayOTAmount: '',
        TravelAllowance: '0.00',
        SalaryBand: ''
      });
    }
  }
  onCheckboxChange(event: any) {
    if (event.checked) {
      this.salaryForm.patchValue({
        WorkingDays: 22
      });
      this.salaryDynamicForm.patchValue({
        dWorkingDays: 22
      });
      if (this.salaryForm.value.GeneralDayRate != '' && this.salaryForm.value.GeneralDayRate != undefined) {
        this.salaryForm.patchValue({
          SalaryBand: this.salaryForm.value.GeneralDayRate * this.salaryForm.value.WorkingDays
        });
        this.salaryDynamicForm.patchValue({
          dSalaryBand: this.salaryForm.value.GeneralDayRate * this.salaryForm.value.WorkingDays
        });
      }
    } else {
      this.salaryForm.patchValue({
        WorkingDays: '0'
      });
      this.salaryDynamicForm.patchValue({
        dWorkingDays: '0'
      });
      if (this.salaryForm.value.GeneralDayRate != '' && this.salaryForm.value.GeneralDayRate != undefined) {
        this.salaryForm.patchValue({
          SalaryBand: ''
        });
        this.salaryDynamicForm.patchValue({
          dSalaryBand: ''
        });
      }
    }
  }
  actualDaysChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined) {
      this.salaryForm.patchValue({
        GeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(7)
      });
      this.salaryForm.patchValue({
        OffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) * this.salaryForm.value.OffDayRate).toFixed(2),
        HolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) * this.salaryForm.value.HolidayRate).toFixed(2),
        GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(2),
        OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(2),
        HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dOffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) * this.salaryForm.value.OffDayRate).toFixed(7),
        dHolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) * this.salaryForm.value.HolidayRate).toFixed(7),
        dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(7),
        dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(7),
        dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(7)
      });
    }
  }
  actualWorkingDaysChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined) {
      this.salaryForm.patchValue({
        GeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(2),
        WorkingDays: Number(event.target.value),
        OffDayAmount: Number((this.salaryForm.value.SalaryBand / event.target.value) * this.salaryForm.value.OffDayRate).toFixed(2),
        HolidayAmount: Number((this.salaryForm.value.SalaryBand / event.target.value) * this.salaryForm.value.HolidayRate).toFixed(2),
        GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(2),
        OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(2),
        HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(7),
        dWorkingDays: Number(event.target.value),
        dOffDayAmount: Number((this.salaryForm.value.SalaryBand / event.target.value) * this.salaryForm.value.OffDayRate).toFixed(7),
        dHolidayAmount: Number((this.salaryForm.value.SalaryBand / event.target.value) * this.salaryForm.value.HolidayRate).toFixed(7),
        dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(7),
        dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(7),
        dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(7)
      });
    } else if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.SalaryBand != undefined) {
      this.salaryForm.patchValue({
        GeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(2),
        WorkingDays: Number(event.target.value)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayRate: Number(this.salaryForm.value.SalaryBand / event.target.value).toFixed(7),
        dWorkingDays: Number(event.target.value)
      });
    }
    else {
      this.salaryForm.patchValue({
        WorkingDays: Number(event.target.value)
      });

      this.salaryDynamicForm.patchValue({
        dWorkingDays: Number(event.target.value)
      });
    }
  }
  salaryBandChange(event: any) {
    if (this.radioEmployeeType === 'Staff') {
      this.salaryForm.patchValue({
        TravelAllowance: '0.00'
      });
      this.salaryDynamicForm.patchValue({
        dTravelAllowance: '0.00'
      });
    } else {
      this.salaryForm.patchValue({
        TravelAllowance: Number(event.target.value / 31).toFixed(2)
      });
      this.salaryDynamicForm.patchValue({
        dTravelAllowance: Number(event.target.value / 31).toFixed(7)
      });
    }
    if (this.salaryForm.value.WorkingDays != '' && this.salaryForm.value.WorkingDays != undefined) {
      this.salaryForm.patchValue({
        GeneralDayRate: Number(event.target.value / this.salaryForm.value.WorkingDays).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayRate: Number(event.target.value / this.salaryForm.value.WorkingDays).toFixed(7)
      });
    }
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.WorkingDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined) {
      this.salaryForm.patchValue({
        OffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * this.salaryForm.value.OffDayRate).toFixed(2),
        HolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * this.salaryForm.value.HolidayRate).toFixed(2),
        GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(2),
        OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(2),
        HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dSalaryBand: event.target.value,
        dOffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * this.salaryForm.value.OffDayRate).toFixed(7),
        dHolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * this.salaryForm.value.HolidayRate).toFixed(7),
        dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.GeneralDayOTRate).toFixed(7),
        dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.OffDayOTRate).toFixed(7),
        dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * this.salaryForm.value.HolidayOTRate).toFixed(7)
      });
    }
  }
  generalDayRateChange(event: any) {
    if (this.salaryForm.value.WorkingDays != '' && this.salaryForm.value.WorkingDays != undefined) {
      const value1 = event.target.value;
      const value2 = this.salaryDynamicForm.value.dGeneralDayRate;

      const isDecimal = /\.\d+$/.test(value1);

      const rawResult = this.calculateResult(value1, value2, isDecimal);

      //const rawResult = this.combineValues(value1, value2); // Get the combined value as a number
      const result = Number(rawResult.toFixed(7));

      this.salaryForm.patchValue({
        SalaryBand: Number(result * this.salaryForm.value.WorkingDays).toFixed(2),
        OffDayAmount: Number(result * this.salaryForm.value.OffDayRate).toFixed(2),
        HolidayAmount: Number(result * this.salaryForm.value.HolidayRate).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dSalaryBand: Number(result * this.salaryForm.value.WorkingDays).toFixed(7),
        dOffDayAmount: Number(result * this.salaryForm.value.OffDayRate).toFixed(7),
        dHolidayAmount: Number(result * this.salaryForm.value.HolidayRate).toFixed(7)
      });
    }

  }

  offDayRateChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.WorkingDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.WorkingDays != undefined) {
      this.salaryForm.patchValue({
        OffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * event.target.value).toFixed(2),
        OffDayRate: event.target.value
      });
      this.salaryDynamicForm.patchValue({
        dOffDayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * event.target.value).toFixed(7),
        dOffDayRate: Number(event.target.value).toFixed(7)
      });
    }
  }
  publicHolidayRateChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.WorkingDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.WorkingDays != undefined) {
      this.salaryForm.patchValue({
        HolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * event.target.value).toFixed(2),
        HolidayRate: Number(event.target.value).toFixed(2),
      });

      this.salaryDynamicForm.patchValue({
        dHolidayAmount: Number((this.salaryForm.value.SalaryBand / this.salaryForm.value.WorkingDays) * event.target.value).toFixed(7),
        dHolidayRate: Number(event.target.value).toFixed(7),
      });
    }
  }
  generalDayOverTimeRateChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != '' && this.salaryForm.value.GeneralDayHours != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined && this.salaryForm.value.GeneralDayHours != undefined) {
      this.salaryForm.patchValue({
        GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(2),
        GeneralDayOTRate: Number(event.target.value).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(7),
        dGeneralDayOTRate: Number(event.target.value).toFixed(7)
      });
    }
  }
  offDayOverTimeRateChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != '' && this.salaryForm.value.GeneralDayHours != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined && this.salaryForm.value.GeneralDayHours != undefined) {
      this.salaryForm.patchValue({
        OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(2),
        OffDayOTRate: Number(event.target.value).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(7),
        dOffDayOTRate: Number(event.target.value).toFixed(7)
      });
    }
  }
  publicHoliDayOverTimeRateChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != '' && this.salaryForm.value.GeneralDayHours != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined && this.salaryForm.value.GeneralDayHours != undefined) {
      this.salaryForm.patchValue({
        HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(2),
        HolidayOTRate: Number(event.target.value).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / this.salaryForm.value.GeneralDayHours) * event.target.value).toFixed(7),
        dHolidayOTRate: Number(event.target.value).toFixed(7)
      });
    }
  }
  workingHoursChange(event: any) {
       this.salaryForm.patchValue({
        WorkingHours: Number(event.target.value).toFixed(2)
       })
       this.salaryDynamicForm.patchValue({
        dWorkingHours: Number(event.target.value).toFixed(2)
       })

    // if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != ''
    //   && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined) {
    //   this.salaryForm.patchValue({
    //     WorkingHours: Number(event.target.value).toFixed(2),
    //     GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.GeneralDayOTRate).toFixed(2),
    //     OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.OffDayOTRate).toFixed(2),
    //     HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.HolidayOTRate).toFixed(2)
    //   });

    //   this.salaryDynamicForm.patchValue({
    //     dWorkingHours: Number(event.target.value).toFixed(2),
    //     dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.GeneralDayOTRate).toFixed(7),
    //     dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.OffDayOTRate).toFixed(7),
    //     dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.HolidayOTRate).toFixed(7)
    //   });
    // }else{
    //    this.salaryForm.patchValue({
    //     WorkingHours: Number(event.target.value).toFixed(2)
    //    })
    //    this.salaryDynamicForm.patchValue({
    //     dWorkingHours: Number(event.target.value).toFixed(2)
    //    })
    // }
  }

  generalDayRateHoursChange(event: any) {
    if (this.salaryForm.value.SalaryBand != '' && this.salaryForm.value.ActualDays != ''
      && this.salaryForm.value.SalaryBand != undefined && this.salaryForm.value.ActualDays != undefined) {
      this.salaryForm.patchValue({
        GeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.GeneralDayOTRate).toFixed(2),
        OffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.OffDayOTRate).toFixed(2),
        HolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.HolidayOTRate).toFixed(2),
        GeneralDayHours: Number(event.target.value).toFixed(2)
      });

      this.salaryDynamicForm.patchValue({
        dGeneralDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.GeneralDayOTRate).toFixed(7),
        dOffDayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.OffDayOTRate).toFixed(7),
        dHolidayOTAmount: Number(((this.salaryForm.value.SalaryBand / this.salaryForm.value.ActualDays) / event.target.value) * this.salaryForm.value.HolidayOTRate).toFixed(7),
        dGeneralDayHours: Number(event.target.value).toFixed(7)
      });
    }
  }
  private calculateResult(value1: number, value2: number, isDecimal: boolean) {
    if (isDecimal) {
      const rawResult = this.combineValues(value1, value2); // Get the combined value as a number
      return Number(rawResult.toFixed(7));
    } else {
      return Number(value1);
    }
  }
  combineValues(value1: number, value2: number): number {
    const integerPart = Math.floor(value1); // Get the integer part of the first value
    const fractionalPart = value2 - Math.floor(value2); // Get the fractional part of the second value
    const result = parseFloat(`${integerPart}.${fractionalPart.toString().split('.')[1] || '0'}`);
    return result;
  }
  saveSalary() {
     if (this.salaryForm.invalid) {
      return;
    }
    this.showLoadingSpinner = true;
    this.salaryModel = {
      SalaryId: 1,
      BranchCode: '',
      EmployeeType: '',
      EmployeeNationality: '',
      Name: '',
      GeneralDayRate: 0,
      GeneralDayHours: 0,
      GeneralDayOTRate: 0,
      OffDayRate: 0,
      OffDayOTRate: 0,
      HolidayRate: 0,
      HolidayOTRate: 0,
      WorkingDays: 0,
      WorkingHours: 0,
      SalaryBand: 0,
      TravelAllowance: 0.00,
      Status: 'Active',
      EICC: false,
      NonStructure: false,
      Active: 'None',
      ActualDays: 0,
      LastUpdatedBy: ''
    };
    this.salaryDynamicForm.patchValue({
      dName: this.salaryForm.value.Name,
      dBranchCode: this.salaryForm.value.BranchCode,
      dTravelAllowance: this.salaryForm.value.TravelAllowance,
      dStatus: this.salaryForm.value.Status,
      dActive: this.salaryForm.value.Active,
      dNonStructure: this.salaryForm.value.NonStructure
    });

    // this.salaryForm.patchValue({
    //   SalaryId: this.salaryDynamicForm.value.dSalaryId,
    //   BranchCode: this.salaryForm.value.BranchCode,
    //   EmployeeType: this.salaryDynamicForm.value.dEmployeeType,
    //   EmployeeNationality: this.salaryDynamicForm.value.dEmployeeNationality,
    //   Name: this.salaryDynamicForm.value.dName,
    //   ActualDays: 26,
    //   EICC: this.salaryDynamicForm.value.dEICC,
    //   WorkingDays: this.salaryDynamicForm.value.dWorkingDays,
    //   WorkingHours: this.salaryDynamicForm.value.dWorkingHours,
    //   GeneralDayRate: this.salaryDynamicForm.value.dGeneralDayRate,
    //   GeneralDayHours: this.salaryDynamicForm.value.dGeneralDayHours,
    //   GeneralDayOTRate: this.salaryDynamicForm.value.dGeneralDayOTRate,
    //   OffDayRate: this.salaryDynamicForm.value.dOffDayRate,
    //   OffDayOTRate: this.salaryDynamicForm.value.dOffDayOTRate,
    //   HolidayRate: this.salaryDynamicForm.value.dHolidayRate,
    //   HolidayOTRate: this.salaryDynamicForm.value.dHolidayOTRate,
    //   SalaryBand: this.salaryDynamicForm.value.dSalaryBand,
    //   TravelAllowance: this.salaryForm.value.TravelAllowance,
    //   Status: this.salaryForm.value.Status,
    //   Active: this.salaryForm.value.Active,
    //   NonStructure: this.salaryForm.value.NonStructure,
    // });

      this.salaryModel = {
      SalaryId: this.salaryDynamicForm.value.dSalaryId,
      BranchCode: this.salaryDynamicForm.value.dBranchCode,
      EmployeeType: this.salaryDynamicForm.value.dEmployeeType,
      EmployeeNationality: this.salaryDynamicForm.value.dEmployeeNationality,
      Name: this.salaryDynamicForm.value.dName,
      ActualDays: 26,
      EICC: this.salaryDynamicForm.value.dEICC,
      WorkingDays: this.salaryDynamicForm.value.dWorkingDays,
      WorkingHours: this.salaryDynamicForm.value.dWorkingHours,
      GeneralDayRate: this.salaryDynamicForm.value.dGeneralDayRate,
      GeneralDayHours: this.salaryDynamicForm.value.dGeneralDayHours,
      GeneralDayOTRate: this.salaryDynamicForm.value.dGeneralDayOTRate,
      OffDayRate: this.salaryDynamicForm.value.dOffDayRate,
      OffDayOTRate: this.salaryDynamicForm.value.dOffDayOTRate,
      HolidayRate: this.salaryDynamicForm.value.dHolidayRate,
      HolidayOTRate: this.salaryDynamicForm.value.dHolidayOTRate,
      SalaryBand: this.salaryDynamicForm.value.dSalaryBand,
      TravelAllowance: this.salaryDynamicForm.value.dTravelAllowance,
      Status: this.salaryDynamicForm.value.dStatus,
      Active: this.salaryDynamicForm.value.dActive,
      NonStructure: this.salaryDynamicForm.value.dNonStructure,
      LastUpdatedBy: this.currentUser
    };    
    
    this._masterService.saveAndUpdateSalaryMaster(this.salaryModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this.showMessage("Successfully save & update salary deatials", 'success', 'Success Message');
        this.salaryForm.reset();
        this.salaryDynamicForm.reset();
        this._router.navigate(['/master/salary-slab']);
      }
      this.showLoadingSpinner = false;
    },
      (error) => this.handleErrors(error)
    );
  }
  clearSalaryDetails(): void {
    this.salaryForm.reset();
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
    this.hideLoadingSpinner();
    return;
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false;
  }
}
