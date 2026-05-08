import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-legal-demand-action',
  templateUrl: './new-legal-demand-action.component.html',
  styleUrls: ['./new-legal-demand-action.component.css']
})
export class NewLegalDemandActionComponent implements OnInit {

  frm!: FormGroup
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  branchList: any;
  clientList: any = [];
  ID: any;
  isEdit: boolean = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _dataService: DatasharingService, private _masterService: MastermoduleService,
    private _financeService: FinanceService, private route: Router, private activatedRoute: ActivatedRoute
  ) {
    this.frm = this.fb.group({
      ID:['0'],
      Branch: ['', Validators.required],
      Client: [''],
      ActionTaken: ['', Validators.required],
      DateIssue: ['', Validators.required],
      Remarks: ['', Validators.required],
      DeletionRemarks: [''],
      CreatedBy: [''],
      UpdatedBy: ['']
    })
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    this.ID = this.activatedRoute.snapshot.params['ID'];
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Legal Demand Action');

    if (this.ID != 0 && this.ID != undefined) {
      this.isEdit = true;

      this._financeService.getLegalDemandByID(this.ID).subscribe((d: any) => {
        const item = d
        this.frm.patchValue({
          ID: item.ID,
          Branch: item.BranchCode,
          Client: item.ClientCode,
          ActionTaken: item.ActionTaken,
          DateIssue: item.DateIssue,
          Remarks: item.Remarks,
          DeletionRemarks: item.DeletionRemarks
        });
        this.branchChange(item.BranchCode);
      });
    }
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
        this._financeService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
          this.branchList = d;
        })
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  branchChange(data: any) {
    this._masterService.getClientMsterListByBranch(data).subscribe((d: any) => {
      this.clientList = d;
    })
  }

  onSaveClick() {
    this.frm.get('CreatedBy')?.setValue(this.currentUser);
    this.frm.get('UpdatedBy')?.setValue(this.currentUser);
    this.frm.get('DateIssue')?.setValue(this.returnDate(this.frm.get('DateIssue')?.value));
    this.showLoadingSpinner = true;
    this._financeService.saveOrUpdateLegalDemand(this.frm.value).subscribe({
      next: () => {
        this.showMessage("Legal Demand Action save/update Successfully", 'success', 'Success Message');
        this.frm.reset();
        this.route.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
          this.route.navigate(['/finance/legal-demand-action']);
        });
      },
      error: (err) => {
        this.showMessage(`Restore failed: ${err}`, 'error', 'Error Message');
      }
    });
  }

  onCancelClick() {
    this.ID = 0;
    this.isEdit = false;
    this.frm.reset();
    this.route.navigate(['/finance/legal-demand-action/new-legal-demand-action']);
  }
  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px', 
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideSpinner();
    return;
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }

}
