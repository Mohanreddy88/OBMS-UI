import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { OBMSBranchesModel } from 'src/app/model/OBMSBranchesModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-user-branch-access',
  templateUrl: './new-user-branch-access.component.html',
  styleUrls: ['./new-user-branch-access.component.css']
})
export class NewUserBranchAccessComponent implements OnInit {
  showLoadingSpinner: boolean = false;
  userBranchAccessTitle: string = 'new';
  obmsBranches: OBMSBranchesModel[] = [new OBMSBranchesModel()];
  dynamicForm!: FormGroup;
  userBranchAccessForm!: FormGroup;
  userName!: string;
  branchCode: string = 'null';
  branchCount: number = 100;
  currentUser: string = '';
  //isAllowedEditable: boolean = false;
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
    private _router: Router, private _activatedRoute: ActivatedRoute,
    private _commonService: CommonService, private _masterService: MastermoduleService) {
    this.userBranchAccessForm = this.fb.group({
      ID: [0],
      Name: [''],
      BranchCode: [''],
      IsAllowed: [false],
      LastUpdatedBy: ['Admin']
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
    this.getUserAccessRights(this.currentUser, 'User Branch Access');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['name'] != undefined) {
        this.userBranchAccessTitle = 'edit';
        this.userName = params['name'];
        this.getBranchMasterList();
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

  checkboxChanged(index: number, controlName: string) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const control = formArray.at(index) as FormGroup
    if (controlName === 'IsAllowed') {
      control.get('Name')?.patchValue(this.userName, { emitEvent: false });
    }
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
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    // Loop through existing data and set formArray fields
    for (let i = 0; i < data.length; i++) {
      const branchCode = data[i].Code;

      // Find the corresponding permission for this branch
      const permission = permissions.find((p: any) => p.BranchCode === branchCode);

      // Set the form group with data and update IsAllowed from permissions
      formArray.push(this.fb.group({
        ID: [data[i].ID ? data[i].ID : 0],
        Name: [data[i].Name],
        BranchCode: [branchCode],
        IsAllowed: [permission ? permission.IsAllowed : false], // Use the IsAllowed from permission if found, else false
        LastUpdatedDate: this.formatDate(this.formatDate(new Date())),
        LastUpdatedBy: [data[i].LastUpdatedBy],
      }));
    }
  }
  getBranchMasterList(): void {
    this.showLoadingSpinner = true;
    this._masterService.getBranchMasterList().subscribe(
      (data) => {
        if (data.length > 0 && data !== undefined) {
          this.existingFormData = data;
          this.getObmsBranchesPermissionByUser(this.userName);
          this.showLoadingSpinner = false;
        }
      },
      (error) => this.handleErrors(error)
    );
  }
  getObmsBranchesPermissionByUser(userName: string): void {
    this._commonService.getObmsBranchesPermissionByUser(userName).subscribe(
      (permissions) => {
        this.updateFormFields(this.existingFormData, permissions);
        this.showLoadingSpinner = false;
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
    this.obmsBranches = formArray.value;
    this._commonService.SaveAndUpdateObmsBranches(this.obmsBranches)
      .subscribe(response => {
        if (response.Success == 'Success') {
          this._router.navigate(['/administration/user-branch-access']);
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
    this.userBranchAccessTitle = 'new';
    this._router.navigate(['/administration/new-user-branch-access']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
