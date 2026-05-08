import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SOCSO } from 'src/app/model/socsoModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-socso-slab',
  templateUrl: './new-socso-slab.component.html',
  styleUrls: ['./new-socso-slab.component.css']
})
export class NewSocsoSlabComponent implements OnInit {

  socsoForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  socsoModel!: SOCSO;
  socsoTitleStatus: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute) {
    this.socsoForm = this.fb.group({
      socso_id: [0],
      socso_from: [''],
      socso_to: [''],
      socso_worker: [''],
      socso_employer: [''],
      socso_50year: [''],
      lASTUPDATE: [new Date],
      lastUpdatedBy: ['Admin']
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
    this.getUserAccessRights(this.currentUser, 'SOCSO Slab');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.getSOCSOMasterList(params['id']);
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
  getSOCSOMasterList(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getSOCSOMaster(id).subscribe(
      (data) => {
        this.socsoTitleStatus = 'edit';
        this.socsoForm.patchValue({
          socso_id: data[0].socso_id,
          socso_from: data[0].socso_from,
          socso_to: data[0].socso_to,
          socso_worker: data[0].socso_worker,
          socso_employer: data[0].socso_employer,
          socso_50year: data[0].socso_50year,
          LastUpdatedBy: data[0].lastUpdatedBy,
          LastUpdate: data[0].lastUpdate,
        });
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.socsoModel = this.socsoForm.value;
    this._masterService.saveAndUpdateSOCSOMaster(this.socsoModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this._router.navigate(['/master/socso-slab']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update socso master deatials',
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

  clearSOCSODetails(): void {
    this.socsoForm.reset();

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

}
