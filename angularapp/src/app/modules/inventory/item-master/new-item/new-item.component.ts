import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from "../../../../service/inventory.service";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.css']
})
export class NewItemComponent implements OnInit {

  frm!: FormGroup;
  categories: any;
  isEdit: boolean = false;
  ID: any;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private activatedRoute: ActivatedRoute, private service: InventoryService, private route: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      ID: [0],
      type: ['P'],
      CategoryID: ['', Validators.required],
      Name: ['', Validators.required],
      Quantity: ['0'],
      qty: ['', Validators.required],
      Price: ['', Validators.required],
      SellPrice: ['', Validators.required],
      Remarks: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.ID = this.activatedRoute.snapshot.params['ID'];
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Item Master');
    if (this.ID != 0 && this.ID != undefined) {
      this.isEdit = true;

      this.service.getItemByID(this.ID).subscribe((d: any) => {
        const item = d['item'];
        const itemType = d['type'];
        this.frm.patchValue({
          ID: item.ID,
          type: itemType,
          CategoryID: item.CategoryID,
          Name: item.Name,
          Quantity: item.Quantity,
          Price: item.Price,
          SellPrice: item.SellPrice,
          Remarks: item.Remarks,
        });
      });
    }
    this.frm.get('Quantity')?.disable({ onlySelf: true });
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
        this.updateCategories('d');
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  updateCategories(cat: string) {
    this.service.getCategoryByCat(cat).subscribe(
      (d: any) => {
        this.categories = d;
      },
      (error) => this.handleErrors(error)
    );
  }

  onSubmit() {

    if (this.frm.invalid) {
      return;
    }

    let data = this.frm.getRawValue();

    data['Quantity'] = Number(this.frm.get('Quantity')?.value) + Number(this.frm.get('qty')?.value);
    this.service.saveItem(data).subscribe((d: any) => {      
      this.showMessage("Item Saved/Updated Successfully", 'success', 'Success Message');
      this.frm.reset();
      this.route.navigate(['/inventory/item-master']);
    });

  }
  onCancelClick() {
    this.ID = 0;
    this.isEdit = false;
    this.frm.reset();
    this.route.navigate(['/inventory/item-master/new-item']);
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
    this.hideLoadingSpinner();
    return;
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
