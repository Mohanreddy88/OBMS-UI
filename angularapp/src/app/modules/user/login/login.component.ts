import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginModel } from 'src/app/model/loginModel';
import { UserRegistration } from 'src/app/model/userregistration';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  register!: UserRegistration;
  loginModel!: LoginModel;
  errorMessage!: string;
  typePass: string = "password";
  loginSuccess: any;
  message: any;
  showLoadingSpinner = false;
  userName: string = '';
  warningMessage: string = '';
  token!: string;
  dDayLeft: number = 0;
  showPasswordExpiryWarning: boolean = false;
  warningMsg: string = '';
  response: any;
  nobuttonenabled!: string;
  passwordChange!: string;

  constructor(private fb: FormBuilder, private _router: Router, private _commonService: CommonService,
    private _dataSharingService: DatasharingService, private authService: AuthService) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
  get Name(): FormControl {
    return this.loginForm.get('userName') as FormControl;
  }
  get PWD(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }
  ngOnInit(): void {
    const manualLogout = localStorage.getItem('manualLogout') === 'true';
    this.token = this.authService.getToken() || '';
    if (this.token && !manualLogout) {
      this.authService.clearToken();
      this.warningMessage = 'Your session is expired! Please login to continue...';
    } else {
      this.warningMessage = '';
      localStorage.removeItem('manualLogout');
    }
  }
  validateUser() {
    this.showLoadingSpinner = true;
    this.loginModel = {
      userName: this.loginForm.value.userName!,
      password: this.hashPassword(this.loginForm.value.password)
    }
    this.passwordChange = this.loginForm.value.password
    sessionStorage.setItem('password', this.passwordChange);
    this._commonService.loginUser(this.loginModel).subscribe((response) => {
      this.response = response;
      if (response.Failure == 'Failure') {
        this.errorMessage = response.Message;
      } else if (response.Success == 'Success') {
        // Check password expiration after successful login
        this.checkPasswordExpiration(response);
      }

      this.showLoadingSpinner = false;
    },
      (error) => this.handleErrors(error)
    );
  }

  // Function to check password expiration
  checkPasswordExpiration(response: any) {
    this._dataSharingService.setUsername(response.Users.Name);
    sessionStorage.setItem('username', this.response.Users.Name);
    sessionStorage.setItem('userrole', this.response.Users.IsAdmin);
    const dtLastUpdatedDate = new Date(response.Users.LastUpdatedDate);
    const dtCurrentDate = new Date();
    const expirationDate = new Date(dtLastUpdatedDate);
    expirationDate.setDate(dtLastUpdatedDate.getDate() + 20);

    if (expirationDate >= dtCurrentDate) {
      const timeDifference = expirationDate.getTime() - dtCurrentDate.getTime();
      this.dDayLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

      if (this.dDayLeft > 0 && this.dDayLeft < 8) {

        this.showPasswordExpiryWarning = true;
        this.warningMsg = `Your password will expire in ${this.dDayLeft} days. Do you want to change it?`;
      } else {
        this.nobuttonenabled = '';
        this.showPasswordExpiryWarning = false;
        this.successLogin(this.response);
      }
    } else {
      this.nobuttonenabled = 'no';
      this.showPasswordExpiryWarning = true;
      this.warningMsg = `Your password expired. You have to change your password..`;
    }
  }

  successLogin(response: any) {
    this.userName = response.Users.Name;
    this._dataSharingService.setUsername(response.Users.Name);
    sessionStorage.setItem('username', response.Users.Name);
    this.register = response.Users;
    let data = this.register
    data['Password'] = "";
    sessionStorage.setItem('currentUser', JSON.stringify(data));
    this.authService.setToken(response.token);
    this._router.navigate(['/dashboard']);
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
  onYesClick() {
    sessionStorage.setItem('password', this.passwordChange);
    this.nobuttonenabled = '';
    this._router.navigate(['/changepassword']);
  }

  onNoClick() {   
    sessionStorage.setItem('password', this.passwordChange);
    if (this.nobuttonenabled == 'no') {
      this.showPasswordExpiryWarning = false;
    } else {
      this.showPasswordExpiryWarning = false;
      this.successLogin(this.response);
    }

  }
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = false;
    }
  };
}
