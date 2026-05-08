import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FinanceService } from "../../../service/finance.service";
import { Router } from "@angular/router";
import { DatasharingService } from "../../../service/datasharing.service";
import Swal from "sweetalert2";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

export interface PeriodicElement {
  InvoiceNo: string,
  InvoiceDate: string
  ClientName: string,
}

@Component({
  selector: 'app-invoice-recycle-bin',
  templateUrl: './invoice-recycle-bin.component.html',
  styleUrls: ['./invoice-recycle-bin.component.css']
})
export class InvoiceRecycleBinComponent implements AfterViewInit {
  displayedColumns: string[] = ['action', 'InvoiceNo', 'InvoiceDate', 'ClientName'];
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource();

  frm!: FormGroup
  currentUser: string = '';
  branchList: any;
  invoiceList: any = [];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
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
    this.getUserAccessRights(this.currentUser, 'Invoice Recycle Bin');

    this.frm = this.fb.group({
      branch: [''],
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
            this.service.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            })
            this.showLoadingSpinner = false;
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.showLoadingSpinner = false;
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }


  deleteInvoiceDetailById() {
    this.service.DeletedInvoiceListByBranchId(this.frm.get("branch")?.value).subscribe((d: any) => {
      this.invoiceList = d;
      this.invoiceList.map((d: any) => d['isChecked'] = false);
      this.tableDataSource();
    })
  }

  tableDataSource() {
    this.dataSource = new MatTableDataSource(this.invoiceList);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  checkChange(element: any, index: any) {
    console.log(element.checked);
    console.log(index);
    console.log(this.invoiceList[index]);
    this.invoiceList[index]['isChecked'] = element.checked;
  }

  restoreSubmit() {
    var list = this.invoiceList.filter((d: any) => d.isChecked == true);
    let ID: any[] = [];
    list.forEach((d: any) => {
      ID.push(d['ID']);
    });
    this.service.RestoreInvoices(ID).subscribe((d: any) => {

      let msg = 'Invoice Restored ';

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
      this.deleteInvoiceDetailById();
    })
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = false
    }
  }
}
