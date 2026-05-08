import { Component, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-receipt-voucher-report',
  templateUrl: './receipt-voucher-report.component.html',
  styleUrls: ['./receipt-voucher-report.component.css']
})
export class ReceiptVoucherReportComponent implements OnInit {
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
      const id = params['id'];
      const asn = params['ASN'];

      if (id && asn) {
        this.printReportClick(id, asn);
      }
    });
  }
  ngOnInit(): void {
  }

  printReportClick(receiptID: number, asn: string) {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/BranchReceiptReport.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + receiptID;
    this.url += "&ASN=" + asn;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

}
