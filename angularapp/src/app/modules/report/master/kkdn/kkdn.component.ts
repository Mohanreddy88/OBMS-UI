import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KKDNExcelListView } from 'src/app/model/KKDNExcelListView';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import * as XLSX from 'xlsx';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-kkdn',
  templateUrl: './kkdn.component.html',
  styleUrls: ['./kkdn.component.css']
})
export class KKDNComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  //currentUrl: string = "ClientMasterReport.aspx?"
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  frm!: FormGroup;
  branchList: any = [];
  currentUser: string = "";
  kKDNExcelListView!: KKDNExcelListView[];
  dtDateJoinFrom: string = this.formatDate(new Date(1900, 0, 1)); // Months are 0-based in JavaScript
  dtDateJoinTo: string = this.formatDate(new Date(1900, 0, 1));
  displayedColumns: string[] = ['branch', 'name', 'icno', 'dob', 'nationality', 'citizen', 'race', 'gender', 'address', 'datejoin', 'jobtitle', 'socso', 'kdnvetting'];
  dataSource = new MatTableDataSource<KKDNExcelListView>([]);
  dynamicPageSizeOptions: number[] = [];
  defaultPageSize: number = 10;
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];

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

  constructor(private _liveAnnouncer: LiveAnnouncer, public sanitizer: DomSanitizer, private _masterService: MastermoduleService,
    private fb: FormBuilder, private _dataService: DatasharingService) {
    this.currentUser = sessionStorage.getItem('username')!;
    //this.url += this.currentUrl;
    //this.url += "LoginID="+this.currentUser;  

    this.frm = fb.group({
      branch: ["", Validators.required],
      KDNVetting: ['YES'],
      exportOption: ['0'],
    })
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngAfterViewInit() {
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    // Branch search debounce
    this.branchSearchSubject.pipe(debounceTime(3000)).subscribe(() => {
      this.branchSearchString = '';
      this.branchList = [...this.filteredBranchList];
    });
    // this._masterService.getKKDNListView('FWG-VALLI','true').subscribe((data) => {
    //   this.dataSource = new MatTableDataSource<KKDNExcelListView>(data);
    // });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Branch Master Report');
  }
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
              this.filteredBranchList = [...this.branchList];
            });
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onSubmit() {
    if (this.frm.invalid) {
      return;
    }
    let Employeetype = 'Guard';
    this._masterService.getKKDNList(this.frm.get("branch")?.value, Employeetype, this.dtDateJoinFrom, this.dtDateJoinTo, this.frm.get("KDNVetting")?.value).subscribe((data) => {
      this.handleDataBinding(data);
    });
  }
  handleDataBinding(data: any) {
    // Check if data is returned and is in an array format
    if (Array.isArray(data)) {
      // Map the response data to KKDNExcelListView instances
      const transformedData = data.map(item => new KKDNExcelListView(item));

      this.generatePageSizeOptions(data);
      // Initialize the MatTableDataSource with transformed data
      this.dataSource = new MatTableDataSource<KKDNExcelListView>(transformedData);
      this.paginator.pageSize = this.defaultPageSize;
    } else {
      console.error('Invalid data format', data);
    }
    this.ngAfterViewInit();
  }

  generatePageSizeOptions(data: any): void {
    const options: number[] = [];
    for (let i = 10; i <= data.length; i += 10) {
      options.push(i);
    }
    this.dynamicPageSizeOptions = options;

  }
  exportToExcel(): void {
    const selectedOption = this.frm.get('exportOption')?.value;
    let exportData: any[] = [];

    if (selectedOption === '0') {
      // Current Page
      exportData = this.dataSource.filteredData.slice(
        this.paginator.pageIndex * this.paginator.pageSize,
        (this.paginator.pageIndex + 1) * this.paginator.pageSize
      );
    } else if (selectedOption === '1') {
      // All Pages
      exportData = this.dataSource.filteredData;
    } else if (selectedOption === '2') {
      // Top 100 Rows
      exportData = this.dataSource.filteredData.slice(0, 100);
    }

    if (exportData.length > 0) {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      XLSX.writeFile(workbook, `KKD.xlsx`);
      console.log(`Data exported successfully with option ${selectedOption}`);
    } else {
      console.error('No data available for export.');
      alert('No data available for export.');
    }
  }

  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString',
    listProp: 'branchList',
    filteredListProp: 'filteredBranchList',
    keyName: string,
    subject: Subject<string>
  ) {
    const key = event.key;

    this[searchStringProp] = this[searchStringProp] || '';

    if (key.length === 1) {
      this[searchStringProp] += key.toLowerCase();
    } else if (key === 'Backspace') {
      this[searchStringProp] = this[searchStringProp].slice(0, -1);
    } else if (key === 'Escape') {
      this[searchStringProp] = '';
    }

    // Apply filter immediately
    this[listProp] = this.searchDropdown(this[searchStringProp], this[filteredListProp], keyName);

    // Trigger debounce to reset after 2s of inactivity
    subject.next(this[searchStringProp]);
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}

