import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { ChangePasswordRequest } from 'src/app/model/ChangePasswordRequest';

@Component({
  selector: 'app-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.css']
})
export class PasswordChangeComponent implements OnInit {

  passwordForm: FormGroup;
  hidePassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  showLoadingSpinner = false;
  warningMessage: string = '';
  errorMessage!: string;
  currentUser: string = '';
  passwordRequest!: ChangePasswordRequest;

  constructor(private fb: FormBuilder, private commonService: CommonService, private _router: Router,
    private _dataService: DatasharingService) {
    this.passwordForm = this.fb.group({
      currentPassword: [''],
      newPassword: ['', [Validators.required]],
      confirmNewPassword: ['', Validators.required],
    }, {
      validator: this.passwordMatchValidator
    });

    this.passwordRequest = {
      CurrentUser: '',
      NewPassword: '',
      CurrentPassword: ''
    }
  }
  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    const sessionPassword = sessionStorage.getItem('password') || '';
    this.passwordForm.patchValue({
      currentPassword: sessionPassword,
      newPassword: '',
      confirmNewPassword: ''
    });
  }
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmNewPassword')?.value;

    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
  toggleNewPasswordVisibility(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }
  onSubmit() {
    this.passwordRequest.NewPassword = this.hashPassword(this.passwordForm.value.newPassword);
    this.passwordRequest.CurrentPassword = this.hashPassword(this.passwordForm.value.currentPassword);
    this.passwordRequest.CurrentUser = this.currentUser;
    this.commonService.changePassword(this.passwordRequest).subscribe(
      response => {
        if (response.Success == 'Success') {
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
          this._router.navigate(['/dashboard']);
        } else {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Error Message',
            text: response.Message,
            icon: 'error',
            showCloseButton: true,
            width: '600px',
            customClass: {
              popup: 'swal-top-offset'
            }
          });
        }
      },
      error => {
        // Handle error (e.g., show an error message)
        console.error('Error changing password', error);
      }
    );
  }
  // Hash password deterministically (same input will give the same output)
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  }
}
