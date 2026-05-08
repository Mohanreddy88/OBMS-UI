import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from 'src/app/service/finance.service';
import { forkJoin } from 'rxjs';
export interface PeriodicElement {
  voucher_no: string,
  payment_date: string,
  supplier_name: string,
  bank_code: string,
  cheque_no: string,
  pay_to: string,
  particulars: string,
  amount: string,
  category_name: string,
}

@Component({
  selector: 'app-category-search',
  templateUrl: './category-search.component.html',
  styleUrls: ['./category-search.component.css']
})
export class CategorySearchComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  frm!: FormGroup;
  totalBranchPaymentsAmount: string = '0.00';
  categoryList: any = [];
  // displayedColumns: string[] = ['voucher_no', 'payment_date', 'supplier_name', 'bank_code', 'cheque_no', 'pay_to', 'particulars', 'amount', 'category_name'];
  displayedColumns: string[] = ['voucher_no', 'payment_date', 'supplier_name', 'bank_code', 'cheque_no', 'amount', 'particulars'];
  dataSource: any;
  pageSizeOptions: number[] = [];

  private formatDate(date: any) {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
  constructor(private fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _financeService: FinanceService
  ) {
    this.frm = this.fb.group({
      StartDate: [''],
      EndDate: [''],
      Category: [''],
    })
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
  ngOnInit(): void {
    this._financeService.getInventoryCategoryList().subscribe({
      next: (data) => this.categoryList = data,
      error: (err) => console.error('Error fetching categories', err)
    });
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  seachCategory() {
    const categoryId = this.frm.get('Category')?.value;
    const startDate = this.formatDate(new Date(this.frm.get('StartDate')?.value));
    const endDate = this.formatDate(new Date(this.frm.get('EndDate')?.value));
    forkJoin([
      this._financeService.getPaymentListByCategory(categoryId, startDate, endDate),
      this._financeService.getBranchPaymentsTotalAmountByCategory(categoryId, startDate, endDate)
    ]).subscribe(
      ([paymentResponse, totalAmount]) => {
        // ✅ unwrap the response
        const paymentData = paymentResponse.data || [];
        this.dataSource = new MatTableDataSource(paymentData);
        
        // ✅ IMPORTANT: reset options before rebuilding
        this.pageSizeOptions = [];

        const totalRows = paymentData.length;

        // Build page sizes: 10,20,30... up to total rows (max 1000)
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptions.push(i);
        }

        // If total rows less than 10, still allow showing all
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptions.push(totalRows);
        }
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.totalBranchPaymentsAmount = (totalAmount || 0).toFixed(2);

        // Show message if no data
        if (!paymentData.length) {
        }

      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }
}


