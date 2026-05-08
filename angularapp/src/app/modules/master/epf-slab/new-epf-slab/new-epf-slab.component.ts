import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EPFModel } from 'src/app/model/epfModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-epf-slab',
  templateUrl: './new-epf-slab.component.html',
  styleUrls: ['./new-epf-slab.component.css']
})
export class NewEpfSlabComponent implements OnInit {

  epfForm!: FormGroup;
  epfModel!: EPFModel;
  showLoadingSpinner: boolean = false;
  epfTitleStatus: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute) {
    this.epfForm = this.fb.group({
      epf_id: [0],
      epf_from: [''],
      epf_to: [''],
      epf_worker: [''],
      epf_worker8Pa: [''],
      epf_boss: [''],
      epf_worker55: [''],
      epf_boss55: [''],
      LastUpdatedBy: [''],
      LastUpdate: ['']
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
    this.getUserAccessRights(this.currentUser, 'EPF Slab');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.getEPFMasterList(params['id']);
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

  getEPFMasterList(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getEPFMaster(id).subscribe(
      (data) => {
        this.epfTitleStatus = 'edit';
        this.epfForm.patchValue({
          epf_id: data[0].epf_id,
          epf_from: data[0].epf_from,
          epf_to: data[0].epf_to,
          epf_worker: data[0].epf_worker,
          epf_worker8Pa: data[0].epf_worker8Pa,
          epf_boss: data[0].epf_boss,
          epf_worker55: data[0].epf_worker55,
          epf_boss55: data[0].epf_boss55,
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
    this.epfModel = {
      epf_id: 0,
      epf_from: 0,
      epf_to: 0,
      epf_worker: 0,
      epf_worker8Pa: 0,
      epf_boss: 0,
      epf_worker55: 0,
      epf_boss55: 0,
      LastUpdate: new Date(),
      LastUpdatedBy: 'Admin',
    }
    this.epfModel.epf_id = this.epfForm.value.epf_id;
    this.epfModel.epf_from = this.epfForm.value.epf_from;
    this.epfModel.epf_to = this.epfForm.value.epf_to;
    this.epfModel.epf_worker = this.epfForm.value.epf_worker;
    this.epfModel.epf_worker8Pa = this.epfForm.value.epf_worker8Pa;
    this.epfModel.epf_boss = this.epfForm.value.epf_boss;
    this.epfModel.epf_worker55 = this.epfForm.value.epf_worker55;
    this.epfModel.epf_boss55 = this.epfForm.value.epf_boss55;
    this.epfModel.LastUpdate = new Date();
    this.epfModel.LastUpdatedBy = this.epfForm.value.LastUpdatedBy;
    this._masterService.saveAndUpdateEPFMaster(this.epfModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this._router.navigate(['/master/epf-slab']);
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

  clearEPFDetails(): void {
    this.epfForm.reset();

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
