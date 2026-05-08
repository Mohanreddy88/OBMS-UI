import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { OBMSBanksModel } from 'src/app/model/OBMSBanksModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-user-bank-access',
  templateUrl: './new-user-bank-access.component.html',
  styleUrls: ['./new-user-bank-access.component.css']
})
export class NewUserBankAccessComponent implements OnInit {
  showLoadingSpinner: boolean = false;
  userBankAccessTitle: string = 'new';
  obmsBanks: OBMSBanksModel[] = [new OBMSBanksModel()];
  dynamicForm!: FormGroup;
  userBankAccessForm!: FormGroup;
  userName!: string;
  branchCode: string = 'null';
  bankCount: number = 50;
  currentUser: string = '';
  isAllowedEditable: boolean = false;
  userAccessModel!: UserAccessModel;
  existingFormData!: any;

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
    private _router: Router, private _activatedRoute: ActivatedRoute, private _masterService: MastermoduleService,
    private _commonService: CommonService) {
    this.userBankAccessForm = this.fb.group({
      ID: [0],
      Name: [''],
      BankID: [''],
      BankCode: [''],
      IsAllowed: [false],
      LastUpdatedDate: [this.formatDate(new Date)],
      LastUpdatedBy: ['']
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
    this.getUserAccessRights(this.currentUser, 'User Bank Access');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['name'] != undefined) {
        this.userBankAccessTitle = 'edit';
        this.userName = params['name'];
        this.getBankMasterList();
      }
    });
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
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
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
  updateFormFields(data: any, permissions: any): void {
    console.log(permissions);
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    // Loop through existing data and set formArray fields
    for (let i = 0; i < data.length; i++) {
      const bankId = data[i].ID;
      const bankCode = data[i].BankCode;

      // Find the corresponding permission for this branch
      const permission = permissions.find((p: any) => p.BankID === bankId);
      console.log(permission);

      // Set the form group with data and update IsAllowed from permissions
      formArray.push(this.fb.group({
        ID: [data[i].ID ? data[i].ID : 0],
        Name: [this.userName],
        BankID: [bankId],
        BankCode: [bankCode],
        IsAllowed: [permission ? permission.IsAllowed : false], // Use the IsAllowed from permission if found, else false
        LastUpdatedDate: this.formatDate(this.formatDate(new Date())),
        LastUpdatedBy: [this.userName],
      }));
    }
  }
  checkboxChanged(index: number, controlName: string) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const control = formArray.at(index) as FormGroup
    if (controlName === 'IsAllowed') {
      control.get('Name')?.patchValue(this.userName, { emitEvent: false });
    }
  }

  getBankMasterList(): void {
    this.showLoadingSpinner = true;
    this._commonService.getBankList().subscribe(
      (data) => {
        this.existingFormData = data;
        this.getObmsBanksPermission(this.userName);
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getObmsBanksPermission(userName: string): void {
    this._commonService.getObmsBanksPermission(userName).subscribe(
      (permissions) => {
        this.updateFormFields(this.existingFormData, permissions);
      },
      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    // Loop through the formArray backwards to avoid index issues while removing items
    for (let i = formArray.length - 1; i >= 0; i--) {
      const formGroup = formArray.at(i) as FormGroup;
      if (!formGroup.get('Name')?.value) { // If Name is null or empty
        formArray.removeAt(i);
      }
    }
    this.obmsBanks = formArray.value;
    this._commonService.saveAndUpdateObmsBanks(this.obmsBanks)
      .subscribe(response => {
        if (response.Success == 'Success') {
          this._router.navigate(['/administration/user-bank-access']);
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: response.Message,
            icon: 'success',
            showCloseButton: false,
            timer: 3000,
            width: '600px',
            customClass: {
              popup: 'swal-top-offset'
            }
          });
        }
        this.showLoadingSpinner = false;
      },
        (error) => this.handleErrors(error)
      );
  }

  clearUserBranchAccesstDetails(): void {
    this.dynamicForm.reset();
    this.userBankAccessTitle = 'new';
    this._router.navigate(['/administration/new-user-bank-access']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
