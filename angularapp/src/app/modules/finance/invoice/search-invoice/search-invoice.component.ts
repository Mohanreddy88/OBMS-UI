import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort, Sort} from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
export interface PeriodicElement {
  s_no: number;
  invoice_no: string;
  amount: string;
  invoice_date: string;
  payment_date: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {s_no: 1, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
  {s_no: 3, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
  {s_no: 4, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
  {s_no: 5, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
  {s_no: 2, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
  {s_no: 6, invoice_no: '123456', amount: '	23.00', invoice_date: '06-Dec-2023', payment_date: '06-Dec-2023'},
];
@Component({
  selector: 'app-search-invoice',
  templateUrl: './search-invoice.component.html',
  styleUrls: ['./search-invoice.component.css']
})
export class SearchInvoiceComponent implements AfterViewInit {
  frm!: FormGroup;
  displayedColumns: string[] = ['s_no', 'invoice_no', 'amount', 'invoice_date', 'payment_date', 'action'];
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog) {}



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
}

