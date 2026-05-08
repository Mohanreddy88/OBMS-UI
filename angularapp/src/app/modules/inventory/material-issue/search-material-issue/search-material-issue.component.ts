import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatTableDataSource} from "@angular/material/table";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort, Sort} from "@angular/material/sort";
import {InventoryService} from "../../../../service/inventory.service";
import {DatasharingService} from "../../../../service/datasharing.service";

export interface PeriodicElement {

  item: string,
  price: string,
  unit: string,
  total: string,
}


@Component({
  selector: 'app-search-material-issue',
  templateUrl: './search-material-issue.component.html',
  styleUrls: ['./search-material-issue.component.css']
})
export class SearchMaterialIssueComponent implements AfterViewInit {
  frm!: FormGroup;


  displayedColumns: string[] = ['InvoiceNo', 'InvoiceDate', 'action'];
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource();
  currentUser: string = '';
  branchList: any = [];

  constructor(public fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog, private service: InventoryService, public dialogRef: MatDialogRef<SearchMaterialIssueComponent>, private _dataService: DatasharingService) {

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    service.GetMaterialMasterList(this.currentUser).subscribe((d: any) => {
      this.branchList = d['branchList'];
    })
    this.frm = fb.group({
      Branch: ['', Validators.required]
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

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  onChange() {
    if (this.frm.get('Branch')?.value != "") {
      this.service.GetMaterialSearchList(this.frm.get('Branch')?.value).subscribe((d: any) => {
        console.log(d);
        this.dataSource = new MatTableDataSource(d);
      })
    }
  }

  select(element: any) {
    this.dialogRef.close(element);
  }
}
