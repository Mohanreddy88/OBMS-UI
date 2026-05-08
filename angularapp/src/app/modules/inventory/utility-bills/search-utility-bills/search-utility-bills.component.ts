import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from "../../../../service/inventory.service";
import { DatasharingService } from "../../../../service/datasharing.service";
import { Router } from '@angular/router';

export interface PeriodicElement {
  s_no: number;
  InvoiceNo: string;
  Total: string;
  InvoiceDate: string;
  PaymentDate: string;
}

@Component({
  selector: 'app-search-utility-bills',
  templateUrl: './search-utility-bills.component.html',
  styleUrls: ['./search-utility-bills.component.css']
})
export class SearchUtilityBillsComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  frm!: FormGroup;
  displayedColumns: string[] = ['s_no', 'InvoiceNo', 'Total', 'InvoiceDate', 'PaymentDate', 'action'];
  dataSource = new MatTableDataSource();
  branchList: any = [];
  supplierList: any = [];
  currentUser: string = '';
  searchOption: string = 'Invoice No';
  pageSizeOptions: number[] = [];

  private formatDate(date: any) {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);
    //let milliseconds = ('00' + d.getMilliseconds()).slice(-3);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  constructor(public fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private service: InventoryService,
    private _dataService: DatasharingService, private router: Router) {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    service.getUtilityMaster("U", "", this.currentUser).subscribe((d: any) => {
      this.branchList = d['branchList'];
      this.supplierList = d['supplierList'];
    });
    this.frm = fb.group({
      Branch: ['', Validators.required],
      Supplier: ['', Validators.required],
      payment_date: [''],
      invoice_date: [''],
      invoice_no: [''],
      search_option: ['Invoice No'],
    })
    this._dataService.setSelectedInvoice([]);
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


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
    if (this.frm.get('Branch')?.value != "" && this.frm.get('Supplier')?.value != "") {
      // this.service.GetUtilitySearchList(this.frm.get('Branch')?.value, this.frm.get('Supplier')?.value, "U").subscribe((d: any) => {
      //   this.dataSource = new MatTableDataSource(d);
      // })
    }
  }
  searchOptionCahnge(event: any) {
    this.searchOption = event.value;
  }
  onSearchClick() {
    const form = this.frm.value;
    let invoiceDate: string | null = null;
    let paymentDate: string | null = null;

    if (this.frm.value.invoice_date) {
      invoiceDate = this.formatDate(new Date(this.frm.value.invoice_date));
    }

    if (this.frm.value.payment_date) {
      paymentDate = this.formatDate(new Date(this.frm.value.payment_date));
    }

    let payload: any = {
      branch: form.Branch,
      supplier: form.Supplier,
      invoiceNo: null,
      invoiceDate: invoiceDate,
      paymentDate: paymentDate
    };

    switch (this.searchOption) {
      case 'Invoice No':
        payload.invoiceNo = form.invoice_no;
        break;

      case 'Invoice Date':
        payload.invoiceDate = invoiceDate;
        break;

      case 'Payment Date':
        payload.paymentDate = paymentDate;
        break;
    }

    this.service.getUtilitySearchList(payload)
      .subscribe(res => {
        this.dataSource = new MatTableDataSource(
          res.map((x: any) => ({
            ...x,
            Total: x.Total != null ? Number(x.Total).toFixed(2) : null
          }))
        );
      });
    this.pageSizeOptions = [];
    const totalRows = this.dataSource.data.length;
    for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
      this.pageSizeOptions.push(i);
    }
    if (totalRows > 0 && totalRows < 10) {
      this.pageSizeOptions.push(totalRows);
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  selectEmp(element: any) {
    // this.dialogRef.close(element);
    this._dataService.setSelectedInvoice(element);
    this.router.navigate(['/inventory/utility-bills']);
  }
}

