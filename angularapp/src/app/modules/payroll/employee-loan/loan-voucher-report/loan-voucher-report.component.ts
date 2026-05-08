import { Component, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-loan-voucher-report',
  templateUrl: './loan-voucher-report.component.html',
  styleUrls: ['./loan-voucher-report.component.css']
})
export class LoanVoucherReportComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUser: string = "";
  ID!: number;
  currentUrl: string = "PayRoll/LoanVoucherReport.aspx?"
  showLoadingSpinner: boolean = false;

  constructor(private _dataService: DatasharingService, public sanitizer: DomSanitizer, private _activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    let localURL = "";
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.ID = params['id'];
      }
    });
    this.url += this.currentUrl;
    localURL += "LoginID=" + this.currentUser
    localURL += "&ID=" + this.ID
    this.showLoadingSpinner = true;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + localURL);
  }

  onReportLoad() {
    setTimeout(() => {
      this.showLoadingSpinner = false;
    }, 2000); // small delay for smooth UX
  }

}
