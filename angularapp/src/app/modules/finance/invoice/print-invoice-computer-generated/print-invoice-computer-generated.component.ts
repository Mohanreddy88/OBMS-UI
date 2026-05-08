import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-print-invoice-computer-generated',
  templateUrl: './print-invoice-computer-generated.component.html',
  styleUrls: ['./print-invoice-computer-generated.component.css']
})
export class PrintInvoiceComputerGeneratedComponent implements OnInit {
  currentUser: string = '';
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  showLoadingSpinner: boolean = false;

  constructor(public sanitizer: DomSanitizer, private _activatedRoute: ActivatedRoute, private router: Router,
    private _dataService: DatasharingService) {
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
        this.printReportClick(params['invoiceId']);
      }
    });
  }

  ngOnInit(): void {

  }
  printReportClick(invoiceID: number) {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/TaxInvoiceReportComputerGenerated.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + invoiceID;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

}
