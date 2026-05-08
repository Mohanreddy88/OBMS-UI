import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BankListModel } from 'src/app/model/bankListModel';
import { BankMasterModel } from 'src/app/model/bankMasterModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-bank-master',
  templateUrl: './new-bank-master.component.html',
  styleUrls: ['./new-bank-master.component.css']
})
export class NewBankMasterComponent implements OnInit {
  bankMasterForm!: FormGroup;
  bankList!: BankListModel[];
  showLoadingSpinner: boolean = false;
  bankMasterTitle: string = 'new';
  bankMaster: BankMasterModel = new BankMasterModel();
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
    this.bankMasterForm = this.fb.group({
      BankId: [0],
      BankCode: ['', [Validators.required]],
      Accname: [''],
      Accno: [''],
      AccShortName: [''],
      PREFIX: [''],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
    });

    this.bankMaster.BankId = 0;
    this.bankMaster.BankCode = '';
    this.bankMaster.Accname = '';
    this.bankMaster.Accno = '';
    this.bankMaster.AccShortName = '';
    this.bankMaster.PREFIX = '';
    this.bankMaster.LASTUPDATE = new Date();
    this.bankMaster.LastUpdatedBy = '';
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Bank Master');
    this.getBankList();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.bankMasterTitle = 'edit';
        this.getBankMasterById(params['id']);
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
  getBankList(): void {
    this._commonService.getBankList().subscribe(bankList => {
      this.bankList = bankList;
    });
  }
  getBankMasterById(id: number): void {
    this.showLoadingSpinner = true;
    this._commonService.getBankMasterById(id).subscribe(
      (data) => {
        this.bankMasterForm.patchValue({
          BankId: data.BankId,
          BankCode: data.BankCode,
          Accname: data.Accname,
          AccShortName: data.AccShortName,
          Accno: data.Accno,
          PREFIX: data.PREFIX,
          LASTUPDATE: this.formatDate(data.LASTUPDATE),
          LastUpdatedBy: data.LastUpdatedBy,
        });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }
  onBankCodeChange(event: any) {
    this.getPerfixNumber(event.value);
  }
  getPerfixNumber(code: string): void {
    this._commonService.getBankPrefixNoByBankID(code).subscribe(
      (data) => {
        this.bankMasterForm.patchValue({
          PREFIX: data.Prefix
        });
      });
  }
  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.bankMaster = this.bankMasterForm.value;
    this.bankMaster.LASTUPDATE = new Date(this.formatDate(new Date()));
    this._commonService.saveAndUpdateBankMasterDetails(this.bankMaster)
      .subscribe(response => {
        if (response.Success == 'Success') {
          this._router.navigate(['/administration/bank-master']);
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

        this.showLoadingSpinner = false;
      },
        (error) => this.handleErrors(error)
      );
  }

  clearBankMasterDetails(): void {
    this.bankMasterForm.reset();
    this.bankMasterTitle = 'new';
    this._router.navigate(['/administration/new-bank-master']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };
}
