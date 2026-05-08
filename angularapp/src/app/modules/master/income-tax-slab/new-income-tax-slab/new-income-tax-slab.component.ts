import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IncomeTaxModel } from 'src/app/model/incomeTaxModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-income-tax-slab',
  templateUrl: './new-income-tax-slab.component.html',
  styleUrls: ['./new-income-tax-slab.component.css']
})
export class NewIncomeTaxSlabComponent implements OnInit {

  incomeTaxForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  incomTaxModel!: IncomeTaxModel;
  incomeTaxTitleStatus: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute) {
    this.incomeTaxForm = this.fb.group({
      IT_ID: ['0'],
      IT_SAL_FROM: [''],
      IT_SAL_TO: [''],
      IT_CATEGORY1: [''],
      K_2: [''],
      KA1_2: [''],
      KA2_2: [''],
      KA3_2: [''],
      KA4_2: [''],
      KA5_2: [''],
      KA6_2: [''],
      KA7_2: [''],
      KA8_2: [''],
      KA9_2: [''],
      KA10_2: [''],
      K_3: [''],
      KA1_3: [''],
      KA2_3: [''],
      KA3_3: [''],
      KA4_3: [''],
      KA5_3: [''],
      KA6_3: [''],
      KA7_3: [''],
      KA8_3: [''],
      KA9_3: [''],
      KA10_3: [''],
      LASTUPDATE: [new Date],
      LastUpdatedBy: ['Admin'],
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
    this.getUserAccessRights(this.currentUser, 'Income Tax Slab');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.getIncomeTaxMasterList(params['id']);
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
  getIncomeTaxMasterList(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getIncomeTaxMaster(id).subscribe(
      (data) => {
        this.incomeTaxTitleStatus = 'edit';
        this.incomeTaxForm.patchValue({
          IT_ID: data[0].IT_ID,
          IT_SAL_FROM: data[0].IT_SAL_FROM,
          IT_SAL_TO: data[0].IT_SAL_TO,
          IT_CATEGORY1: data[0].IT_CATEGORY1,
          K_2: data[0].K_2,
          KA1_2: data[0].KA1_2,
          KA2_2: data[0].KA2_2,
          KA3_2: data[0].KA3_2,
          KA4_2: data[0].KA4_2,
          KA5_2: data[0].KA5_2,
          KA6_2: data[0].KA6_2,
          KA7_2: data[0].KA7_2,
          KA8_2: data[0].KA8_2,
          KA9_2: data[0].KA9_2,
          KA10_2: data[0].KA10_2,
          K_3: data[0].K_3,
          KA1_3: data[0].KA1_3,
          KA2_3: data[0].KA2_3,
          KA3_3: data[0].KA3_3,
          KA4_3: data[0].KA4_3,
          KA5_3: data[0].KA5_3,
          KA6_3: data[0].KA6_3,
          KA7_3: data[0].KA7_3,
          KA8_3: data[0].KA8_3,
          KA9_3: data[0].KA9_3,
          KA10_3: data[0].KA10_3,
          LastUpdatedBy: data[0].LastUpdatedBy,
          LastUpdate: data[0].LastUpdate,
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
    this.incomTaxModel = this.incomeTaxForm.value;

    this._masterService.saveAndUpdateIncomeTaxMaster(this.incomTaxModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this._router.navigate(['/master/income-tax-slab']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update sip income tax deatials',
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
  clearIncomeTaxDetails(): void {
    this.incomeTaxForm.reset();

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

}
