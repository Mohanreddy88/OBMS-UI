import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { OBMSPermissions } from 'src/app/model/OBMSPermissions';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-user-access-rights',
  templateUrl: './new-user-access-rights.component.html',
  styleUrls: ['./new-user-access-rights.component.css']
})
export class NewUserAccessRightsComponent implements OnInit {
  @Output() categorySelected = new EventEmitter<string>();

  categories: string[] = ['Accounting', 'Administration', 'Master', 'Quotation & Agreement', 'Inventory', 'Finance', 'Payroll'];
  selectedCategory: string = 'Master';
  data = ['ScreenName', 'Create', 'Read', 'Update', 'Delete'];

  userAccessForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  userAccessTitle: string = 'new';
  categoryName: string = '';
  obmsPermissions: OBMSPermissions[] = [new OBMSPermissions()];
  permissions!: OBMSPermissions[];
  dynamicForm!: FormGroup;
  userName!: string;
  currentUser: string = '';
  isReadEditable: boolean = false;
  isCreateEditable: boolean = false;
  isUpdateEditable: boolean = false;
  isDeleteEditable: boolean = false;
  userAccessModel!: UserAccessModel;
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


  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _masterService: MastermoduleService,
    private _commonService: CommonService, private _dataService: DatasharingService) {
    this.userAccessForm = this.fb.group({

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
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == '1') {
      this.userRole = 'admin'
    } else if (this.userRole == '2') {
      this.userRole = 'superadmin'
    } else {
      this.userRole = 'user'
    }
    this.getUserAccessRights(this.currentUser, 'User Access Rights');
    this.createForm();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['name'] != undefined) {
        this.userAccessTitle = 'edit';
        this.userName = params['name'];
        if (this.userRole == 'admin' || this.userRole == 'superadmin' || this.currentUser == 'admin' || this.currentUser == 'superadmin') {
          this.isReadEditable = false;
          this.isCreateEditable = false;
          this.isUpdateEditable = false;
          this.isDeleteEditable = false;
        } else {
          this.isReadEditable = true;
          this.isCreateEditable = true;
          this.isUpdateEditable = true;
          this.isDeleteEditable = true;
        }
        this.getScreensByCategoryandUsername('Master', params['name']);
      }
    });
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
  updateFormFields(data: any) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    for (let i = 0; i < data.length; i++) {
      formArray.push(this.fb.group({
        ID: [data[i].ID],
        Name: [this.userName],
        ScreenName: [data[i].ScreenName],
        Read: [false],
        Create: [false],
        Update: [false],
        Delete: [false],
        LastUpdatedBy: [this.userName],
      }));
    }
  }

  handleButtonClick(action: string) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      if (action == 'View') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Read')?.patchValue(isChecked.Read === false ? true : false, { emitEvent: false });
      }
      if (action == 'new') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Create')?.patchValue(isChecked.Create === false ? true : false, { emitEvent: false });
      }
      if (action == 'update') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Update')?.patchValue(isChecked.Update === false ? true : false, { emitEvent: false });
      }
      if (action == 'delete') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Delete')?.patchValue(isChecked.Delete === false ? true : false, { emitEvent: false });
      }
    }
  }
  onCategoryChange() {
    this.getScreensByCategoryandUsername(this.selectedCategory, this.userName);
  }

  getScreensByCategory(categoryName: string): void {
    this.showLoadingSpinner = true;
    this._commonService.getScreensByCategory(categoryName).subscribe(
      (data) => {
        this.updateFormFields(data);
        const formArray = this.dynamicForm.get('formArray') as FormArray;
        data.forEach((item: any, index: any) => {
          const control = formArray.at(index) as FormGroup;
          control.get('ID')?.patchValue(0, { emitEvent: false });
          control.get('Name')?.patchValue(this.userName, { emitEvent: false });
          control.get('ScreenName')?.patchValue(item.ScreenName, { emitEvent: false });
          control.get('Create')?.patchValue(false, { emitEvent: false });
          control.get('Read')?.patchValue(false, { emitEvent: false });
          control.get('Update')?.patchValue(false, { emitEvent: false });
          control.get('Delete')?.patchValue(false, { emitEvent: false });
          control.get('LastUpdatedBy')?.patchValue(this.userName, { emitEvent: false });
        });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getScreensByCategoryandUsername(screenName: string, userName: string): void {
    this.showLoadingSpinner = true;
    this._commonService.getPermissionsWithScreens(screenName, userName).subscribe(
      (data) => {
        if (data.length > 0 && data !== undefined) {
          this.updateFormFields(data);
          const formArray = this.dynamicForm.get('formArray') as FormArray;

          data.forEach((item: any, index: any) => {
            const control = formArray.at(index) as FormGroup;
            control.get('ID')?.patchValue(item.ID, { emitEvent: false });
            control.get('Name')?.patchValue(item.Name, { emitEvent: false });
            control.get('ScreenName')?.patchValue(item.ScreenName, { emitEvent: false });
            control.get('Create')?.patchValue(item.Create === true ? true : false, { emitEvent: false });
            control.get('Read')?.patchValue(item.Read === true ? true : false, { emitEvent: false });
            control.get('Update')?.patchValue(item.Update === true ? true : false, { emitEvent: false });
            control.get('Delete')?.patchValue(item.Delete === true ? true : false, { emitEvent: false });
            control.get('LastUpdatedBy')?.patchValue(this.userName, { emitEvent: false });
          });
          this.showLoadingSpinner = false;
        } else {
          this.getScreensByCategory(screenName)
        }
      },
      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    this.obmsPermissions = formArray.value;
    this._commonService.saveAndUpdateObmsPermissions(this.obmsPermissions)
      .subscribe(response => {
        if (response.Success == 'Success') {
          //this._router.navigate(['/administration/user-access-rights']);
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

  clearUserAccesstDetails(): void {
    this.userAccessForm.reset();
    this.userAccessTitle = 'new';
    this._router.navigate(['/administration/new-user-access-rights']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

}
