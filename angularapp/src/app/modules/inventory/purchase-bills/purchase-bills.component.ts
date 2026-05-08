import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SearchInvoiceComponent } from '../../finance/invoice/search-invoice/search-invoice.component';
import { CommonService } from "../../../service/common.service";
import { InventoryService } from "../../../service/inventory.service";
import { Router } from "@angular/router";
import { UserRegistration } from "../../../model/userregistration";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { SearchPurchaseBillsComponent } from "./search-purchase-bills/search-purchase-bills.component";
import Swal from "sweetalert2";
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

export interface IItemDetails {
  ID: number,
  InvoicePeriodFrom: Date,
  InvoicePeriodTo: Date,
  Amount: number,
  Note: string,
  index: number,
  SerialNo: number,
  ItemCategoryID: number,
  ItemID: number,
  ItemName: string,
  NoOfUnits: number,
  CostPerUnit: number,
  ValuePeriod: number,
  ValuePercentage: number,
  ValueStatus: string,
}


@Component({
  selector: 'app-purchase-bills',
  templateUrl: './purchase-bills.component.html',
  styleUrls: ['./purchase-bills.component.css']
})
export class PurchaseBillsComponent implements AfterViewInit {
  displayedColumns: string[] = ['SerialNo', 'ItemName', 'CostPerUnit', 'NoOfUnits', 'Amount', 'ValueStatus', 'ValuePeriod', 'ValuePercentage', 'Note', 'action'];
  dataSource = new MatTableDataSource<IItemDetails>();
  frm!: FormGroup
  branchList: any = [];
  supplierList: any = [];
  categoryList: any = [];
  user: UserRegistration;
  itemList: any = [];
  detailEdit: boolean = false;
  errorDescription: string = "";
  details: IItemDetails[] = [];
  returnResult: any;
  isEdit: boolean = false;
  _row: any = null;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, commonService: CommonService, private service: InventoryService, private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.user = commonService.getLocalUser();
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Purchase Bills');

    this.frm = this.fb.group({
      ID: [0],
      Branch: [''],
      Supplier: [''],
      InvoiceNo: [''],
      InvoiceDate: [''],
      PaymentDate: [''],
      details: this.fb.group({
        ID: [0],
        ItemCategoryID: [''],
        ItemID: [''],
        ItemName: [''],
        CostPerUnit: [''],
        NoOfUnits: [''],
        Amount: [''],
        ValueStatus: ['D'],
        ValuePercentage: [''],
        ValuePeriod: [''],
        Note: [''],
        index: [-1],
        SerialNo: [0],
      })
    });

    this.frm.get('details.CostPerUnit')?.disable({ onlySelf: true });
    this.frm.get('details.Amount')?.disable({ onlySelf: true });

  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {

  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.service.getUtilityMaster("P", "P", this.currentUser).subscribe((d: any) => {
              this.branchList = d['branchList'];
              this.supplierList = d['supplierList'];
              this.categoryList = d['categoryList'];
            })
            this.hideLoadingSpinner();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  searchinvoice() {
    const dialogRef = this.dialog.open(SearchPurchaseBillsComponent, {
      disableClose: true,
      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
      //  position: { right: '0'}
    });
    dialogRef.afterClosed().subscribe(result => {
      this.returnResult = result
      this.frm.patchValue(result);
      this.frm.get("Supplier")?.setValue(result['Supplier'].toString());
      this.getData();
    });
  }

  getData() {
    let id = this.frm.get("ID")?.value;
    if (id != 0) {
      this.isEdit = true;
      this.frm.get("RecID")?.setValue(this.returnResult['RecID'].toString());
      this.service.GetUtilityDetailListByInvoiceId(id).subscribe((d: any) => {
        console.log(d);
        this.details = [...d];
        this.detailDataSource();
      })
    }
  }

  getItems(value: any) {
    this.service.GetItemByCategoryId(value).subscribe((d: any) => {
      this.itemList = d;
    }, () => {
    }, () => {
      if (this.isEdit) {
        this.frm.get('details.ItemID')?.setValue(this._row['ItemID'].toString());
      }
    })
  }

  changeCategory() {
    this.getItems(this.frm.get('details.ItemCategoryID')?.value);
  }

  addItemDetails(action: string) {

    let frmData = this.frm.getRawValue();
    let details = frmData['details'];

    if (details['CostPerUnit'] == "") {
      this.errorDescription = "please fill the field";
      return;
    }


    if (action == 'add') {
      details['ID'] = 0;
      this.details.push(details);
    } else if (details['index'] >= 0 && action == 'update') {
      this.details[details['index']] = details;
    }

    this.detailDataSource();


    this.emptyDetailData(details);
    this.detailEdit = false;
  }

  editRow(row: IItemDetails, index: any) {
    this.detailEdit = true;
    row['index'] = index;
    this.frm.get('details')?.patchValue(row);
    this.frm.get('details.ItemCategoryID')?.setValue(row['ItemCategoryID'].toString());
    if (this.isEdit) {
      this._row = row;
      this.getItems(row['ItemCategoryID']);
    }
  }

  deleteRow(row: IItemDetails, index: any) {
    if (row.ID != 0) {
      this.service.DeleteUtilityDetailById(row.ID + "").subscribe((d: any) => {
        console.log(d);
      })
    }
    this.details.splice(index, 1);
    this.detailDataSource();
  }

  emptyDetailData(details?: any) {
    let emptyData = {
      ID: 0,
      ItemID: 0,
      ItemCategoryID: 0,
      ItemName: "",
      CostPerUnit: 0,
      NoOfUnits: 0,
      Amount: 0,
      ValueStatus: "D",
      ValuePeriod: 0,
      ValuePercentage: 0,
      Note: "",
      index: -1,
      SerialNo: 0
    }

    this.frm.get('details')?.setValue(emptyData);
    this.frm.get('details.ItemCategoryID')?.setValue(details['ItemCategoryID']);
  }

  dataCalculation() {

    let CostPerUnit = this.frm.get('details.CostPerUnit')?.value;
    let NoOfUnits = this.frm.get('details.NoOfUnits')?.value;

    this.frm.get('details.Amount')?.setValue(parseInt(CostPerUnit) * parseInt(NoOfUnits));
  }

  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  itemChange(data: any) {
    let value = this.itemList.filter((d: any) => d.ID == data)[0];
    this.frm.get('details.CostPerUnit')?.setValue(value.Price ?? 0);
    this.frm.get('details.ItemName')?.setValue(value.Name ?? '');
  }

  returnDate(date?: any) {
    console.log(date);
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
      return
    }

    let data = this.frm.getRawValue();

    let total = 0;
    this.details.forEach((d: any, index) => {
      d['SerialNo'] = index + 1;
      d['LastUpdatedBy'] = this.currentUser;
      total += parseInt(d['Amount']);
    });


    data['Total'] = total;
    data['details'] = this.details;

    data['InvoiceType'] = "P";
    data['InvoiceDate'] = this.returnDate(this.frm.get('InvoiceDate')?.value);
    data['PaymentDate'] = this.returnDate(this.frm.get('PaymentDate')?.value);
    data['LastUpdatedBy'] = this.currentUser;

    console.log(data);
    let msg = "";
    this.service.saveUtility(data).subscribe((d: any) => {
      if (this.isEdit) {
        msg = 'Successfully Updated Purchase Details';
      } else {
        msg = 'Successfully Saved Purchase Details';
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
      this.route.navigate(['/inventory/purchase-bills']);
      this.frm.reset();
      this.details = [];
      this.detailDataSource();
    })
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

