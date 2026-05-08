import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-branch',
  templateUrl: './new-branch.component.html',
  styleUrls: ['./new-branch.component.css']
})
export class NewBranchComponent implements OnInit {

  branchForm!: FormGroup;
  branchModel!: BranchModel;
  branchCodeStatus: string = 'new';
  showLoadingSpinner: boolean = false;
  errorMessage: string = '';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  statesList: any[] = [
    { id: 1, name: 'Johor' },
    { id: 2, name: 'Kedah' },
    { id: 3, name: 'Kuala Lumpur' },
    { id: 4, name: 'Kelantan' },
    { id: 5, name: 'Labuan' },
    { id: 6, name: 'Melaka' },
    { id: 7, name: 'Negeri Sembilan' },
    { id: 8, name: 'Pahang' },
    { id: 9, name: 'Perak' },
    { id: 10, name: 'Perlis' },
    { id: 11, name: 'Pulau Pinang' },
    { id: 12, name: 'PutraJaya' },
    { id: 13, name: 'Sabah' },
    { id: 14, name: 'Sarawak' },
    { id: 15, name: 'Selangor' },
    { id: 16, name: 'Terengganu' },
    { id: 17, name: 'Wilayah Persekutuan' },

  ]

  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _dataService: DatasharingService) {
    this.branchForm = this.fb.group({
      ID: this.fb.control(0),
      Code: this.fb.control('', [Validators.required]),
      Name: this.fb.control(''),
      Address1: this.fb.control('', [Validators.required]),
      Address2: this.fb.control('', [Validators.required]),
      PostCode: this.fb.control('', [Validators.required]),
      City: this.fb.control('', [Validators.required]),
      State: this.fb.control('', [Validators.required]),
      BankName: this.fb.control('null'),
      BankBranch: this.fb.control('null'),
      BankAccount: this.fb.control('null'),
      PersonIncharge: this.fb.control('', [Validators.required]),
      ShortName: this.fb.control('', [Validators.required, Validators.maxLength(10)]),
      UbsCode: this.fb.control(''),
      Phone: this.fb.control('', [Validators.required]),
      Fax: this.fb.control(''),
      UserEmail: this.fb.control(''),
      IsHeadQuarters: this.fb.control(false),
      Description: this.fb.control(''),
      ParentBranch: this.fb.control(''),
      LastUpdate: this.fb.control(new Date),
      LastUpdatedBy: this.fb.control(this.currentUser),
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
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        this.branchForm.patchValue({
          LastUpdatedBy: this.currentUser
        })
      });
    } else {
      this.branchForm.patchValue({
        LastUpdatedBy: this.currentUser
      });
    }
    this.getUserAccessRights(this.currentUser, 'Branch Master');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['code'] != undefined) {
        this.getBranchMasterList(params['code']);
      } else {
        this.getBranchCode();
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
  getBranchCode(): void {
    this._masterService.getBranchMasterCode().subscribe(
      result => {
        this.branchForm.patchValue({
          Code: result.ClientCode
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterList(branchCode: string) {
    this.showLoadingSpinner = true;
    this._masterService.getBranchMaster(branchCode).subscribe((responseData) => {
      if (responseData != null) {
        this.branchCodeStatus = 'edit';
        this.branchForm.patchValue({
          ID: responseData[0].ID,
          Code: responseData[0].Code,
          UbsCode: responseData[0].UbsCode,
          Name: responseData[0].Name,
          ShortName: responseData[0].ShortName,
          Address1: responseData[0].Address1,
          Address2: responseData[0].Address2,
          PostCode: responseData[0].PostCode,
          City: responseData[0].City,
          State: responseData[0].State,
          BankName: responseData[0].BankName,
          BankBranch: responseData[0].BankBranch,
          BankAccount: responseData[0].BankAccount,
          PersonIncharge: responseData[0].PersonIncharge,
          Phone: responseData[0].Phone,
          Fax: responseData[0].Fax,
          UserEmail: responseData[0].Email,
          IsHeadQuarters: responseData[0].IsHeadQuarters,
          Description: responseData[0].Description,
          LastUpdate: responseData[0].LastUpdate,
          LastUpdatedBy: responseData[0].LastUpdatedBy,
          ParentBranch: responseData[0].ParentBranch,
        });
      }
      this.showLoadingSpinner = false;
    },

      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.branchModel = {
      ID: 0,
      Code: '',
      Name: '',
      UbsCode: 'null',
      ShortName: '',
      Address1: '',
      Address2: '',
      PostCode: 0,
      City: '',
      State: '',
      Phone: 0,
      Fax: 0,
      Email: 'NULL',
      BankName: '',
      BankBranch: '',
      BankAccount: 0,
      PersonIncharge: '',
      IsHeadQuarters: false,
      Description: '',
      LastUpdate: new Date(),
      LastUpdatedBy: '',
      ParentBranch: '',
    }

    this.branchModel = this.branchForm.value;
    if (this.branchForm.value.UserEmail != undefined && this.branchForm.value.UserEmail != "") {
      this.branchModel.Email = this.branchForm.value.UserEmail;
    } else {
      this.branchModel.Email = 'null';
    }
    this.branchModel.ParentBranch = this.branchForm.value.Code;
    this.branchModel.LastUpdatedBy = this.currentUser;
    this._masterService.saveAndUpdateBranchMaster(this.branchModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this.branchModel = response.Branch;
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/master/branch-master']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update brnach deatials',
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
  clearBranchDetails(): void {
    this.branchForm.reset();
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = false;
    }
  };
}