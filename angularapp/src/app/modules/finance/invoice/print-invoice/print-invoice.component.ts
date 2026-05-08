import { Component, OnInit } from '@angular/core';
import { FinanceService } from "../../../../service/finance.service";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { DatasharingService } from 'src/app/service/datasharing.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-print-invoice',
  templateUrl: './print-invoice.component.html',
  styleUrls: ['./print-invoice.component.css']
})
export class PrintInvoiceComponent implements OnInit {
  currentUser: string = '';
  invoiceData: any;
  client: any;
  details: any;
  invoice: any;
  showLoadingSpinner: boolean = false;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;

  constructor(private service: FinanceService, private _activatedRoute: ActivatedRoute, private router: Router,
    private _dataService: DatasharingService, public sanitizer: DomSanitizer
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['invoiceId'] != undefined) {
        const id = params['invoiceId'];
        service.GetPrintInvoice(params['invoiceId']).subscribe((d: any) => {
          console.log(d);
          this.invoiceData = d;
          this.client = d['client'];
          this.details = d['details'];
          this.invoice = d['invoice'];
        })

        if (id) {
          this.printTaxInvoiceClick(id);
        }
      }
    });


  }

  print() {
    window.print();
  }

  ngOnInit(): void {
  }

  printTaxInvoiceClick(id: number) {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/TaxInvoiceReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + id;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  public formatDisplayDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  returnMonthAndYear(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;


    const monthString = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
    return `${monthString} ${year}`;
  }
}

