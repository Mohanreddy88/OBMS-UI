import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BankListModel } from 'src/app/model/bankListModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-bank-list',
  templateUrl: './new-bank-list.component.html',
  styleUrls: ['./new-bank-list.component.css']
})
export class NewBankListComponent implements OnInit {
  bankListForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  bankListTitle: string = 'new';
  bankList: BankListModel = new BankListModel();
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
    this.bankListForm = this.fb.group({
      ID: [0],
      BankCode: ['', [Validators.required]],
      BankName: ['', [Validators.required]],
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: ['Admin'],
    });

    this.bankList.ID = 0;
    this.bankList.BankCode = '';
    this.bankList.BankName = '';
    this.bankList.LastUpdate = new Date();
    this.bankList.LastUpdatedBy = '';
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'User Bank Access');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.bankListTitle = 'edit';
        this.getBankListById(params['id']);
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
  getBankListById(id: number): void {
    this.showLoadingSpinner = true;
    this._commonService.GetBankListById(id).subscribe(
      (data) => {
        this.bankListForm.patchValue({
          ID: data.ID,
          BankCode: data.BankCode,
          BankName: data.BankName,
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
    this.bankList = this.bankListForm.value;
    this.bankList.LastUpdate = new Date(this.formatDate(new Date()));
    this._commonService.saveAndUpdateBankDetails(this.bankList)
      .subscribe(response => {
        if (response.Success == 'Success') {
          this._router.navigate(['/administration/bank-list']);
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

  clearBankListDetails(): void {
    this.bankListForm.reset();
    this.bankListTitle = 'new';
    this._router.navigate(['/administration/new-bank-list']);

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

}
