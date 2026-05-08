import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SearchInvoiceComponent } from '../../finance/invoice/search-invoice/search-invoice.component';
import { InventoryService } from "../../../service/inventory.service";
import { DatasharingService } from "../../../service/datasharing.service";
import { IItemDetails } from "../purchase-bills/purchase-bills.component";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { SearchMaterialIssueComponent } from "./search-material-issue/search-material-issue.component";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

export interface PeriodicElement {

  item: string,
  price: string,
  unit: string,
  total: string,
}

const ELEMENT_DATA: PeriodicElement[] = [
  { item: 'Test', price: '10', unit: '3', total: '30' },
];

@Component({
  selector: 'app-material-issue',
  templateUrl: './material-issue.component.html',
  styleUrls: ['./material-issue.component.css']
})
export class MaterialIssueComponent implements AfterViewInit {
  displayedColumns: string[] = ['item', 'price', 'unit', 'total', 'action'];
  dataSource = new MatTableDataSource<IItemDetails>();
  frm!: FormGroup
  currentUser: string = '';
  branchList: any = [];
  categoryList: any = [];
  errorDescription: string = "";
  details: IItemDetails[] = [];
  detailEdit: boolean = false;
  itemList: any = [];
  isEdit: boolean = false;
  _row: any = null;
  returnResult: any;
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private service: InventoryService, private _dataService: DatasharingService, private route: Router, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Material Issue');

    this.frm = this.fb.group({
      ID: [0],
      Branch: [''],
      InvoiceNo: [''],
      InvoiceDate: [''],
      // Category: [''],
      InvoiceRemarks: [''],
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
      }),
    });

    this.frm.get('details.CostPerUnit')?.disable({ onlySelf: true });
    this.frm.get('details.Amount')?.disable({ onlySelf: true });
  }


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
            this.service.GetMaterialMasterList(this.currentUser).subscribe((d: any) => {
              this.branchList = d['branchList'];
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
    const dialogRef = this.dialog.open(SearchMaterialIssueComponent, {
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
      this.service.GetMaterialDetailListByInvoiceId(id).subscribe((d: any) => {
        console.log(d);
        this.details = [...d];
        this.details.map((d: any) => d.Amount = d?.NoOfUnits * d?.CostPerUnit)
        this.detailDataSource();
      })
    }
  }

  getinvoiceNo() {
    this.service.GetMaterialInvoiceByBranch(this.frm.get('Branch')?.value).subscribe((d: any) => {
      this.frm.get("InvoiceNo")?.setValue(d?.value);
    })
  }

  getItemByCategoryById() {

    this.getItems(this.frm.get("details.ItemCategoryID")?.value);
  }

  getItems(value: any) {
    this.service.GetMaterialInvoiceItemByCategoryID(value).subscribe((d: any) => {
      console.log(d);
      this.itemList = d;
    }, () => {
    }, () => {
      if (this.isEdit) {
        this.frm.get('details.ItemID')?.setValue(this._row['ItemID'].toString());
      }
    })
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


  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

  itemChange(data: any) {
    let value = this.itemList.filter((d: any) => d.ID == data)[0];
    console.log(value.Name);
    this.frm.get('details.CostPerUnit')?.setValue(value.Price ?? 0);
    this.frm.get('details.ItemName')?.setValue(value.Name ?? '');
  }

  dataCalculation() {

    let CostPerUnit = this.frm.get('details.CostPerUnit')?.value;
    let NoOfUnits = this.frm.get('details.NoOfUnits')?.value;

    this.frm.get('details.Amount')?.setValue(parseInt(CostPerUnit) * parseInt(NoOfUnits));
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

    this.details.forEach((d: any, index) => {
      d['LastUpdatedBy'] = this.currentUser;
    });


    data['details'] = this.details;

    data['InvoiceDate'] = this.returnDate(this.frm.get('InvoiceDate')?.value);
    data['LastUpdatedBy'] = this.currentUser;

    console.log(data);
    let msg = "";
    this.service.saveMaterial(data).subscribe((d: any) => {
      if (this.isEdit) {
        msg = 'Successfully Updated Material Details';
      } else {
        msg = 'Successfully Saved Material Details';
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
      this.route.navigate(['/inventory/material-issue']);
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

