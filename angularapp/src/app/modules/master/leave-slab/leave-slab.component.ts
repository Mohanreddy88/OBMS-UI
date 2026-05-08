import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaveSystem } from 'src/app/model/leaveSystemModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-leave-slab',
  templateUrl: './leave-slab.component.html',
  styleUrls: ['./leave-slab.component.css']
})
export class LeaveSlabComponent implements OnInit {

  leaveForm!: FormGroup;
  leaveModel!: LeaveSystem;
  showLoadingSpinner: boolean = false;
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute) {
    this.leaveForm = this.fb.group({
      lS_ID: ['0'],
      al0to1: ['8.0', [Validators.required]],
      aL1to2: ['8.0', [Validators.required]],
      aL2to5: ['12.0', [Validators.required]],
      aL6: ['16.0', [Validators.required]],
      ml0to2: ['14.0', [Validators.required]],
      ml2to5: ['18.0', [Validators.required]],
      mL6: ['22.0', [Validators.required]],
      hL: ['60.0', [Validators.required]],
      mtnyL: ['98.0', [Validators.required]],
      ptnyL: ['7.0', [Validators.required]],
      lASTUPDATE: [new Date],
      lastUpdatedBy: ['Admin'],
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
    this.getUserAccessRights(this.currentUser, 'Leave Slab');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
              this.showLoadingSpinner = false;
            }
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.leaveModel = this.leaveForm.value;

    this._masterService.saveAndUpdateLeaveMaster(this.leaveModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this._router.navigate(['/master/leave-slab']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update sip leave system deatials',
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

  clearLeaveDetails(): void {
    this.leaveForm.reset();

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

}
