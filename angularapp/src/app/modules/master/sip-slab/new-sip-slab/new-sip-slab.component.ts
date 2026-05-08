import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SIPModel } from 'src/app/model/SIPModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-sip-slab',
  templateUrl: './new-sip-slab.component.html',
  styleUrls: ['./new-sip-slab.component.css']
})
export class NewSipSlabComponent implements OnInit {
  sipModel!: SIPModel;
  sipForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  sipTitleStatus: string = 'new';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _masterService: MastermoduleService,
    private _router: Router, private _dataService: DatasharingService,
    private _activatedRoute: ActivatedRoute) {
    this.sipForm = this.fb.group({
      SIP_id: [0],
      SIP_from: [''],
      SIP_to: [''],
      SIP_worker: [''],
      SIP_boss: [''],
      SIP_total: [0],
      LastUpdate: [''],
      LastUpdatedBy: [''],
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
    this.getUserAccessRights(this.currentUser, 'SIP Slab');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.getSIPMasterList(params['id']);
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
  getSIPMasterList(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getSIPhMaster(id).subscribe(
      (data) => {
        this.sipTitleStatus = 'edit';
        this.sipForm.patchValue({
          SIP_id: data[0].SIP_id,
          SIP_from: data[0].SIP_from,
          SIP_to: data[0].SIP_to,
          SIP_worker: data[0].SIP_worker,
          SIP_boss: data[0].SIP_boss,
          LastUpdatedBy: data[0].LastUpdatedBy,
          LastUpdate: data[0].LastUpdate,
        });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }
  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.sipModel = {
      SIP_id: 0,
      SIP_from: 0,
      SIP_to: 0,
      SIP_worker: 0,
      SIP_boss: 0,
      SIP_total: 0,
      LastUpdate: new Date(),
      LastUpdatedBy: 'Admin',
    }
    this.sipModel = this.sipForm.value;
    this.sipModel.LastUpdate = new Date();
    this._masterService.saveAndUpdateSIPMaster(this.sipModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this.sipModel = response.Client;
        this._router.navigate(['/master/sip-slab']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update sip master deatials',
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
  clearSIPDetails(): void {
    this.sipForm.reset();
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      // this.errorMessage = error;
      this.showLoadingSpinner = true;
    }
  };
}
