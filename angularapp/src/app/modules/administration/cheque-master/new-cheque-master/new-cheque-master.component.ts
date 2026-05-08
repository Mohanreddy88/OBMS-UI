import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChequeMaster } from 'src/app/model/ChequeMaster';
import { BankMasterModel } from 'src/app/model/bankMasterModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-cheque-master',
  templateUrl: './new-cheque-master.component.html',
  styleUrls: ['./new-cheque-master.component.css']
})
export class NewChequeMasterComponent implements OnInit {
  chequeMasterForm!: FormGroup;
  bankMasterList!: BankMasterModel[];
  showLoadingSpinner: boolean = false;
  chequeMasterTitle: string = 'new';
  chequeMaster: ChequeMaster = new ChequeMaster();
  currentUser: string = '';
  userAccessModel!: UserAccessModel;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _masterService: MastermoduleService,
    private _commonService: CommonService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.chequeMasterForm = this.fb.group({
      ID: [0],
      BankId: [0],
      AccountName: [''],
      ChequeStart: ['', [Validators.required]],
      ChequeEnd: ['', [Validators.required]],
      IsActive: [true],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
    });

    this.chequeMaster.ID = 0;
    this.chequeMaster.BankID = 0;
    this.chequeMaster.ChequeStart = 0;
    this.chequeMaster.ChequeEnd = 0;
    this.chequeMaster.AccountName = '';
    this.chequeMaster.IsActive = true;
    this.chequeMaster.LastUpdate = new Date();
    this.chequeMaster.LastUpdatedBy = '';
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Cheque Master');

    this.getBankMasterList();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.chequeMasterTitle = 'edit';
        this.chequeMasterForm.patchValue({
          ID: params['id']
        })
        this.getChequeMasterById(params['id']);
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
  getBankMasterList(): void {
    this._commonService.getBankMasterList().subscribe(bankList => {
      this.bankMasterList = bankList;
    });
  }
  getChequeMasterById(id: number): void {
    this.showLoadingSpinner = true;
    this._commonService.getChequeListById(id).subscribe(
      (data) => {
        this.chequeMasterForm.patchValue({
          ID: data.ID,
          BankId: data.BankID,
          AccountName: data.AccountName,
          ChequeStart: data.ChequeStart,
          ChequeEnd: data.ChequeEnd,
          IsActive: data.IsActive,
          LastUpdate: this.formatDate(data.LastUpdate),
          LastUpdatedBy: data.LastUpdatedBy,
        });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }
  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.chequeMaster = this.chequeMasterForm.value;
    this.chequeMaster.LastUpdate = new Date(this.formatDate(new Date()));
    this._commonService.saveAndUpdateChequeMasterDetails(this.chequeMaster)
      .subscribe(response => {
        if (response.Success == 'Success') {
          this._router.navigate(['/administration/cheque-master']);
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: response.Message,
            icon: 'success',
            showCloseButton: false,
            width: '600px',
            timer: 3000,
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

  clearMasterListDetails(): void {
    this.chequeMasterForm.reset();
    this.chequeMasterTitle = 'new';
    this._router.navigate(['/administration/new-cheque-master']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
