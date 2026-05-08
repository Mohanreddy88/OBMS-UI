import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatTableDataSource} from "@angular/material/table";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {InventoryService} from "../../../../service/inventory.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort, Sort} from "@angular/material/sort";
import {DatasharingService} from "../../../../service/datasharing.service";

export interface PeriodicElement {
  s_no: number;
  InvoiceNo: string;
  Total: string;
  InvoiceDate: string;
  PaymentDate: string;
}
@Component({
  selector: 'app-search-purchase-bills',
  templateUrl: './search-purchase-bills.component.html',
  styleUrls: ['./search-purchase-bills.component.css']
})
export class SearchPurchaseBillsComponent implements AfterViewInit {

  frm!: FormGroup;
  displayedColumns: string[] = ['s_no', 'InvoiceNo', 'Total', 'InvoiceDate', 'PaymentDate', 'action'];
  dataSource = new MatTableDataSource();

  branchList: any = [];
  supplierList: any = [];
 currentUser: string = '';
  constructor(public fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog, private service: InventoryService, public dialogRef: MatDialogRef<SearchPurchaseBillsComponent>, private _dataService: DatasharingService ) {
 this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    service.getUtilityMaster("P", "P",this.currentUser).subscribe((d: any) => {
      console.log(d);
      this.branchList = d['branchList'];
      this.supplierList = d['supplierList'];
    });
    this.frm = fb.group({
      Branch: ['', Validators.required],
      Supplier: ['', Validators.required],
    })
  }


  onChange() {
    if (this.frm.get('Branch')?.value != "" && this.frm.get('Supplier')?.value != "") {
      this.service.GetUtilitySearchList(this.frm.get('Branch')?.value, this.frm.get('Supplier')?.value,"P").subscribe((d: any) => {
        console.log(d);
        this.dataSource = new MatTableDataSource(d);
      })
    }
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

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  selectEmp(element: any) {
    this.dialogRef.close(element);
  }
}
