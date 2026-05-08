import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { UserRegistration } from 'src/app/model/userregistration';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  registerForm!: FormGroup;
  register!: UserRegistration;
  errorMessage!: string;
  typePass: string = "password";
  showLoadingSpinner = false;
  hidePassword = true;
  registerTitle: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  private secretKey: string = 'mySecretKey';
  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(private fb: FormBuilder, private _commonService: CommonService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _masterService: MastermoduleService,
    private _dataService: DatasharingService) {
    this.initializeRegisterFormModel();
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('Password')?.value;
    const confirmPassword = control.get('ConfirmPassword')?.value;

    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
  ngOnInit(): void {
    this.initializeRegisterModel();

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'User Administration');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.showLoadingSpinner = true;
        this.getUserRegisterbyId(params['id']);
      }
    });

  }
  initializeRegisterModel() {
    this.register = {
      UserId: 0,
      Name: '',
      Password: '',
      Designation: '',
      Description: '',
      LastUpdatedBy: '',
      isView: false,
      IsAdmin: '0',
      Email: '',
      ContactNo: '',
      IsDeleted: false,
      CreatedBy: '',
      CreatedDate: new Date(),
      LastUpdatedDate: new Date(),
    };
  }
  initializeRegisterFormModel() {
    this.registerForm = this.fb.group({
      UserId: [0],
      Name: ['', [Validators.required]],
      Password: ['', [Validators.required]],
      ConfirmPassword: ['', Validators.required],
      ContactNo: [''],
      Email: ['', [Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')]],
      IsAdmin: ['0', [Validators.required]],
      isView: [true],
      IsDeleted: [false],
      CreatedBy: ['Admin'],
      CreatedDate: [new Date],
      LastUpdatedDate: [new Date],
      Designation: [''],
      Description: [''],
      LastUpdatedBy: ['']
    }, {
      validator: this.passwordMatchValidator
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
  getUserRegisterbyId(userId: number): void {
    this._commonService.getUserById(userId.toString()).subscribe(users => {
      this.registerTitle = 'edit';
      this.registerForm.patchValue({
        UserId: users.UserId,
        Name: users.Name,
        // Password: users.Password,
        Designation: users.Designation,
        Description: users.Description,
        isView: users.isView,
        // IsAdmin: users.IsAdmin === '2' ? (users.Name === 'superadmin' ? '2' : '1') : '0',
        IsAdmin: users.IsAdmin === '2'  ? (users.IsAdmin === '2' ? '2' : '1')  : (users.IsAdmin === '1' ? '1' : '0'),
        Email: users.Email,
        ContactNo: users.ContactNo,
        IsDeleted: users.IsDeleted,
        CreatedDate: this.formatDate(users.CreatedDate),
        CreatedBy: users.CreatedBy,
        LastUpdatedDate: this.formatDate(users.LastUpdatedDate),
        LastUpdatedBy: users.LastUpdatedBy,
      });
      this.showLoadingSpinner = false;
    });
  }
  // Decrypt the stored encrypted password
  private decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  saveUser(): void {
    this.register = this.registerForm.value;
    this.register.Password = this.hashPassword(this.register.Password);
    if (this.registerForm.value.IsAdmin === '1') {
      this.register.IsAdmin = '1';
    } else if (this.registerForm.value.IsAdmin === '2') {
      this.register.IsAdmin = '2';
    } else {
      this.register.IsAdmin = '0';
    }
    this._commonService.addUser(this.register).subscribe((responseData) => {
      if (responseData.Success == 'Success') {
        this.registerForm.reset();
        this.initializeRegisterFormModel();
        this.initializeRegisterModel();
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: responseData.Message,
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
          width: '600px',
          customClass: {
            popup: 'swal-top-offset'
          }
        });
      }
    },
      (error) => this.handleErrors(error)
    );
  }

  // Hash password deterministically (same input will give the same output)
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
    }
  }

}
