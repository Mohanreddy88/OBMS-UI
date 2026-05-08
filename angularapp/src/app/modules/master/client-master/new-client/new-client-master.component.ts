import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BranchModel } from 'src/app/model/branchModel';
import { ClientModel } from 'src/app/model/clientModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-client-master',
  templateUrl: './new-client-master.component.html',
  styleUrls: ['./new-client-master.component.css']
})
export class NewClientMasterComponent implements OnInit {
  clientCodeStatus: string = 'new';
  //clientModel!: ClientModel;
  clientModel: ClientModel = new ClientModel();
  clientModelDropdown!: ClientModel[];
  clientForm: FormGroup;
  disableSelect: boolean = false;
  branchModel!: BranchModel[];
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  clientCode: string = 'null';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  branchSearchSubject = new Subject<string>();
branchSearchString: string = '';
filteredBranchList: any[] = [];

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
  private formatDateWithTime(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    let hours = '' + d.getHours();
    let minutes = '' + d.getMinutes();
    let seconds = '' + d.getSeconds();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;
    return [year, month, day].join('-') + ' ' + [hours, minutes, seconds].join(':');
  }
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


  constructor(private fb: FormBuilder, private _masterService: MastermoduleService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _dataService: DatasharingService) {
    this.clientForm = this.fb.group({
      Id: this.fb.control(0),
      Code: this.fb.control('', [Validators.required]),
      Name: this.fb.control('', [Validators.required]),
      Address1: this.fb.control('', [Validators.required]),
      Address2: this.fb.control('', [Validators.required]),
      PostCode: this.fb.control('', [Validators.required]),
      City: this.fb.control('', [Validators.required]),
      State: this.fb.control('', [Validators.required]),
      Branch: this.fb.control('null', [Validators.required]),
      Status: this.fb.control('Active'),
      PersonIncharge: this.fb.control('', [Validators.required]),
      ShortName: this.fb.control('', [Validators.required]),
      Phone: this.fb.control('', [Validators.required]),
      Fax: this.fb.control(''),
      UserEmail: this.fb.control(''),
      IsClientHeadQuarters: this.fb.control(false),
      AgreementStart: this.fb.control(''),
      AgreementEnd: this.fb.control(''),
      CreatedDate: this.fb.control(this.formatDate(new Date)),
      LastUpdatedDate: this.fb.control(null),
      LastUpdatedBy: this.fb.control('Admin'),
      SuperClientCode: this.fb.control(''),
      SpecialOTHours: this.fb.control(0),
      KPIHours: this.fb.control(0)
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    // Branch search debounce
this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
  this.branchSearchString = '';
  this.branchModel = [...this.filteredBranchList];
});
	
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Client Master');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['code'] != undefined) {
        this.getClientMasterList(params['code'], params['status']);
        this.getBranchMasterListByUser(this.currentUser);
        this.getAllClientMasterList(params['code'], params['status']);
      } else {
        //this.getAllClientMasterList(this.clientCode, 'Active');
        this.getBranchMasterListByUser(this.currentUser);
        this.getNewVoucherNumber();
      }
    });
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        console.log(data);
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
  getNewVoucherNumber(): void {
    this._masterService.getNClientMasterCode().subscribe(
      result => {
        this.clientForm.patchValue({
          Code: result.ClientCode
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  changeAgreementStart(type: string, event: MatDatepickerInputEvent<Date>) {
    this.clientForm.value.AgreementStart = this.formatDate(`${type}: ${event.value}`);
  }
  changeAgreementEnd(type: string, event: MatDatepickerInputEvent<Date>) {
    this.clientForm.value.AgreementEnd = this.formatDate(`${type}: ${event.value}`);
  }
  getBranchMasterList() {
    this._masterService.getBranchMaster(this.branchCode).subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
        this.filteredBranchList = [...this.branchModel];
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getAllClientMasterList(clientCode: string, status: string): void {
    this._masterService.getClienthMaster(clientCode, status, this.currentUser).subscribe(
      (data) => {
        this.clientModelDropdown = data;
        //this.clientForm.patchValue(data); 
      },
      (error) => this.handleErrors(error)
    );
  }

  getClientMasterList(clientCode: string, status: string) {
    this.showLoadingSpinner = true;
    this._masterService.getClienthMaster(clientCode, status, this.currentUser).subscribe((responseData) => {
      if (responseData != null) {
        this.clientCodeStatus = 'edit';
        this.clientForm.patchValue({
          Id: responseData[0].ID,
          Code: responseData[0].Code,
          Branch: responseData[0].Branch,
          Name: responseData[0].Name,
          ShortName: responseData[0].Shortname,
          Address1: responseData[0].Address1,
          Address2: responseData[0].Address2,
          PostCode: responseData[0].PostCode,
          City: responseData[0].City,
          State: responseData[0].State,
          SuperClientCode: responseData[0].SuperClientCode,
          Status: responseData[0].Status,
          PersonIncharge: responseData[0].PersonIncharge,
          Phone: responseData[0].Phone,
          Fax: responseData[0].Fax,
          UserEmail: (responseData[0].Email != 'null' ? responseData[0].Email : ''),
          LastUpdatedBy: responseData[0].LastUpdatedBy,
          IsClientHeadQuarters: responseData[0].IsClientHeadQuarters,
          LastUpdatedDate: this.formatDate(responseData[0].LastUpdatedDate),
          //AgreementStart: this.formatDate(responseData[0].AgreementStart),
          //AgreementEnd: this.formatDate(responseData[0].AgreementEnd == null ? 'null' : responseData[0].AgreementEnd),
          CreatedDate: this.formatDate(responseData[0].CreatedDate),
          SpecialOTHours: responseData[0].SpecialOTHours,
          KPIHours: responseData[0].KPIHours,
        });
      }
      if (responseData[0].isClientHeadQuarters == false) {
        this.clientForm.get('IsClientHeadQuarters')?.setValue(responseData[0].IsClientHeadQuarters);
        this.disableSelect = false
      } else {
        this.clientForm.get('IsClientHeadQuarters')?.setValue(responseData[0].IsClientHeadQuarters);
        this.disableSelect = false
      }
      if (responseData[0].AgreementStart == null) {
        this.clientForm.get('AgreementStart')?.setValue('');
      } else {
        this.clientForm.get('AgreementStart')?.setValue(responseData[0].AgreementStart);
      }
      if (responseData[0].AgreementEnd == null) {
        this.clientForm.get('AgreementEnd')?.setValue('');
      } else {
        this.clientForm.get('AgreementEnd')?.setValue(responseData[0].AgreementEnd);
      }
      this.showLoadingSpinner = false;
    },

      (error) => this.handleErrors(error)
    );
  }

  onCheckboxChange(e: MatCheckboxChange) {
    if (e.checked) {
      this.disableSelect = true
    } else {
      this.disableSelect = false
    }
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
if (!searchString) return [...list]; // if empty, return full list
return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
}

onKeyDropdown(
event: KeyboardEvent,
searchStringProp:  'branchSearchString',
listProp:  'branchModel',
filteredListProp: 'filteredBranchList',
keyName: string,
subject: Subject<string>
) {
const key = event.key;

this[searchStringProp] = this[searchStringProp] || '';

if (key.length === 1) {
  this[searchStringProp] += key.toLowerCase();
} else if (key === 'Backspace') {
  this[searchStringProp] = this[searchStringProp].slice(0, -1);
} else if (key === 'Escape') {
  this[searchStringProp] = '';
}

// Apply filter immediately
this[listProp] = this.searchDropdown(this[searchStringProp], this[filteredListProp], keyName);

// Trigger debounce to reset after 2s of inactivity
subject.next(this[searchStringProp]);
}
  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.clientModel = this.clientForm.value;

    this.clientModel.AgreementStart = this.clientForm.value.AgreementStart == null ? null : this.clientForm.value.AgreementStart;
    this.clientModel.AgreementEnd = this.clientForm.get('AgreementEnd')?.value ? this.clientForm.get('AgreementEnd')?.value : '1990-01-01';
    this.clientModel.LastUpdatedDate = this.clientForm.get('LastUpdatedDate')?.value ? this.clientForm.get('LastUpdatedDate')?.value : '1990-01-01';
    this.clientModel.Email = (this.clientForm.value.UserEmail == '' || this.clientForm.value.UserEmail == 'null') ? 'null' : this.clientForm.value.UserEmail;
    this.clientModel.LastUpdatedBy = this.currentUser;

    this._masterService.saveAndUpdateClientMaster(this.clientModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this.clientModel = response.Client;
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/master/client-master']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update client master deatials',
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
  clearClientDetails(): void {
    this.clientForm.reset();
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      // this.errorMessage = error;
      this.showLoadingSpinner = false;
    }
  };
}
