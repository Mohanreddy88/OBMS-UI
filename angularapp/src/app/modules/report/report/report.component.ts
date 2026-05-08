import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ActivatedRoute} from "@angular/router";
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  url: string =environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  reportName = "";

  @ViewChild('myFrame') iframe: ElementRef | undefined;

  constructor(public sanitizer: DomSanitizer, private activatedRoute: ActivatedRoute) {
    this.reportName = this.activatedRoute.snapshot.params['ReportName'];
    if (this.reportName == "User"){
      //this.url = "http://localhost:58008"
    }else if(this.reportName == "Branch"){
      this.url = this.url + 'BranchReport.aspx';
    }
    else if(this.reportName == "Client"){
      this.url = this.url + 'BranchReport.aspx';
    }
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    // this.reloadIframe();
  }

  reloadIframe() {
    // Access the native iframe element
    // @ts-ignore
    const iframeElement: HTMLIFrameElement = this.iframe.nativeElement;

    // Reload the iframe
    iframeElement.src = this.url;
  }
  ngOnInit() {

  }

}
