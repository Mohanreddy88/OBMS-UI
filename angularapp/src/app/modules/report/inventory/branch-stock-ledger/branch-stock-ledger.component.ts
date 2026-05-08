import { Component, OnInit } from '@angular/core';
import {environment} from "../../../../../environments/environment";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MastermoduleService} from "../../../../service/mastermodule.service";
import {InventoryService} from "../../../../service/inventory.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

@Component({
  selector: 'app-branch-stock-ledger',
  templateUrl: './branch-stock-ledger.component.html',
  styleUrls: ['./branch-stock-ledger.component.css']
})
export class BranchStockLedgerComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Inventory/BranchStockLedgerReport.aspx?"
  frm!: FormGroup;
  branchList: any = [];
  itemList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private service: InventoryService, 
    private fb: FormBuilder,private _dataService: DatasharingService) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.url += this.currentUrl;
    this.url += "LoginID=" + this.currentUser;

    this.frm = fb.group({
      Branch: ["", Validators.required],
      ItemID: ["", Validators.required],
      StartDate: ["", Validators.required],
      EndDate: ["", Validators.required]
    })
    this.userAccessModel = {
      readAccess: false,
      updateAccess:false,
      deleteAccess:false,
      createAccess:false,
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Branch Stock Ledger Report');
  }
  getUserAccessRights(userName: string, screenName: string) { 
    this.showLoadingSpinner = true;  
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create; 
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
           this. _masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });
        
            this.service.GetReportHQMaster().subscribe((d: any) => {
              this.itemList = d;
            })
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;                      
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner(){
    this.showLoadingSpinner = false;
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
    let localURL = "";
    if (this.frm.invalid) {
      return;
    }
    localURL += "&StartDate=" + this.returnDate(this.frm.get("StartDate")?.value)
    localURL += "&EndDate=" + this.returnDate(this.frm.get("EndDate")?.value)
    localURL += "&ItemID=" + this.frm.get("ItemID")?.value
    localURL += "&Branch=" + this.frm.get("Branch")?.value
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + localURL);
  }
// ?Branch=FWG-VALLI&StartDate=02-May-2021&EndDate=16-May-2024&ItemID=1&LoginId=superuser

}
