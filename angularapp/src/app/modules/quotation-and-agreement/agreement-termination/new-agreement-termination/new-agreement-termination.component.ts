import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AgreementService } from "../../agreement.service";
import { MatTableDataSource } from "@angular/material/table";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { DatasharingService } from "../../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-new-agreement-termination',
  templateUrl: './new-agreement-termination.component.html',
  styleUrls: ['./new-agreement-termination.component.css']
})
export class NewAgreementTerminationComponent implements OnInit {
  frm!: FormGroup
  data: any;
  branchList: any;
  clientList: any;
  errorTxt: any = "";
  isEdit: boolean = false;

  ID: any;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  currentUser: string = '';
  userAccessModel!: UserAccessModel;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private activatedRoute: ActivatedRoute, public service: AgreementService,
    private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.ID = this.activatedRoute.snapshot.params['ID'];
    this.frm = this.fb.group({
      ID: [0],
      TerminationDate: ['', Validators.required],
      Branch: ['', Validators.required],
      Client: ['', Validators.required],
      Reason: ['', Validators.required],
      Note: [''],
    });
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Agreement Termination');

    this.service.getAgreementMaster(this.currentUser).subscribe((data: any) => {
      this.data = data;
      this.branchList = data['branchList'];
      this.clientList = data['clientList'];
    }, () => {
    },
      () => {
        if (this.ID != 0 && this.ID != undefined) {
          this.isEdit = true;
          this.service.getAgreementTerminationById(this.ID).subscribe((d: any) => {
            console.log(d);
            let data = d['Result'];
            this.frm.patchValue(data['terminatedAgreement']);
          })
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
  getClientsByBranchID(value: any) {
    this.service.getClientsOnlyByBranchID(value, this.currentUser).subscribe((d: any) => {
      console.log(d);
      this.clientList = d;

    }, () => {
    },
      () => {
        this.changeValue();
      });
  }

  changeValue() {

    if (this.frm.get('Branch')?.value != "" && this.frm.get('Client')?.value != "" && this.returnDate(this.frm.get('TerminationDate')?.value != "")) {
      this.service.GetAgreementListByBranchId(this.frm.get('Branch')?.value, this.frm.get('Client')?.value, this.returnDate(this.frm.get('TerminationDate')?.value)).subscribe((d: any) => {
        console.log(d);
        let result = d['Result'];
        this.errorTxt = result['message']
      });
    }
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

  onSubmit() {

    if (this.frm.invalid) {
      return;
    }
    let msg = "";
    let data = this.frm.getRawValue();
    data['TerminationDate'] = this.returnDate(this.frm.get('TerminationDate')?.value);
    if (this.errorTxt == "") {
      this.service.SaveAndUpdateAgreementTermination(data).subscribe((d: any) => {
        if (this.isEdit) {
          msg = 'Successfully Updated Agreement Termination';
        } else {
          msg = 'Successfully Saved Agreement Termination';
        }
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: msg,
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
          width: '600px',
          customClass: {
            popup: 'swal-top-offset'
          }
        });
        this.route.navigate(['/quotation-and-agreement/agreement-termination']);
      })
    }
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
