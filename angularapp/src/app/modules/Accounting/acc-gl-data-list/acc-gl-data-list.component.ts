import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { forkJoin, Observable } from 'rxjs';
import { AccountingService } from 'src/app/service/accounting.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-acc-gl-data-list',
  templateUrl: './acc-gl-data-list.component.html',
  styleUrls: ['./acc-gl-data-list.component.css']
})
export class AccGlDataListComponent implements OnInit {

  frm!: FormGroup;
  branchList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  lblMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  selectedYear!: number;
  taxYears: number[] = [];
  listData: any[] = [];
  listWithTypeData: any[] = [];
  displayedColumns: string[] = ['IssueDate', 'RefNo', 'ChequeNo', 'Description', 'Type', 'TotalAmount'];
  dataSource: any;
  dropdownOptions: string[] = ['Option1', 'Option2', 'Option3'];
  selectedOptions: string[] = [];

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private _accountingService: AccountingService,
    private fb: FormBuilder, private router: Router, private _dataService: DatasharingService, private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog) {
    this.frm = this.fb.group({
      Type: ['Credit'],
      Branchcode: ['', Validators.required],
      selectedOptions: this.fb.array(
        this.dropdownOptions.map(() => new FormControl(null))
      )
    });

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Account GLDataList');
    const currentYear = new Date().getFullYear();
    this.taxYears = [];

    for (let i = currentYear; i >= 2000; i--) {
      this.taxYears.push(i);
    }
    this.selectedYear = currentYear;

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
      });
  }
  onYearChange(event: any) {
    this.selectedYear = event.value;
  }

  btnSearchClick() {
    this.loadReports(this.selectedYear, this.frm.value.Branchcode, this.frm.value.Type);
  }
  btnSaveandUpdateClick() {
    this.checkRecords(this.selectedYear, this.frm.value.Branchcode, this.frm.value.Type);
  }
  loadReports(processYear: number, branch: string, type: string): void {
    // Initialize an observable object to hold the requests
    let requests: { [key: string]: Observable<any> } = {};

    // Conditionally add requests based on type
    if (type === 'Both') {
      requests = {
        list: this._accountingService.getList(processYear, branch)
      };
    } else {
      requests = {
        listWithType: this._accountingService.getListWithType(processYear, branch, type)
      };
    }

    // Use forkJoin to execute all requests
    forkJoin(requests).subscribe({
      next: (results: { list?: any; listWithType?: any }) => {

        // Check the length of both lists and display a message if both are empty
        if ((!results.list || results.list.length === 0) &&
          (!results.listWithType || results.listWithType.length === 0)) {
          this.lblMessage = 'No data available for the selected criteria.';
        } else {
          this.lblMessage = '';  // Clear message if data is available
        }

        // Set the dataSource for the table
        if (results.list) {
          this.dataSource = new MatTableDataSource(results.list);
          this.selectedOptions = new Array(this.dataSource.data.length).fill(null);
        } else if (results.listWithType) {
          this.dataSource = new MatTableDataSource(results.listWithType);
          this.selectedOptions = new Array(this.dataSource.data.length).fill(null);
        } else {
          this.dataSource = new MatTableDataSource([]);
        }
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }

  checkRecords(processYear: number, branch: string, type: string): void {    
    // Initialize an observable object to hold the requests
    let requests: { [key: string]: Observable<any> } = {};

    // Conditionally add requests based on type
    if (type === 'Both') {
      requests = {
        list: this._accountingService.checkRecordExists(processYear, branch)
      };
    } else {
      requests = {
        listWithType: this._accountingService.checkRecordExistsWithType(processYear, branch, type)
      };
    }

    // Use forkJoin to execute all requests
    forkJoin(requests).subscribe({
      next: (results: { list?: boolean; listWithType?: boolean }) => {
        const existsList = results.list ?? false;
        const existsListWithType = results.listWithType ?? false;
        this.showLoadingSpinner = true;
        if (!existsList && !existsListWithType) {        
          const updatedData = this.dataSource.data.map((item: any, index: number) => {
            return {
              ...item,
              ProcessYear: this.selectedYear, // coming from form or variable
              Category: this.selectedOptions[index],
              CreatedBy: this.currentUser, // value from dropdown
            };
          });
          this._accountingService.addGLRecord(this.currentUser, updatedData).subscribe({
            next: res => {
              //console.log('Add success:', res);
              //alert('Records added successfully.');
              this.showMessage(`GL added successfully.`, 'success', 'Success Message');
            },
            error: err => {              
              this.showMessage(`Failed to add records due to ${err}.`, 'error', 'Error Message');
            }
          });

        } else {
          this.showMessage(`Please Delete Previous Record Before Inserted Again!.`, 'warning', 'Warning Message');
        }
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }

  deleteClickButton(): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this GL details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {       
        if (result.confirmDialog) {

            forkJoin({
              list: this._accountingService.checkRecordExists(this.selectedYear, this.frm.value.Branchcode)
              }).subscribe(({ list }) => {
                if (list) {
                  this._accountingService.deleteGLRecord(this.selectedYear, this.frm.value.Branchcode, this.currentUser).subscribe({
                    next: res => {                     
                      this.showMessage(`GL deleted successfully.`, 'success', 'Success Message');
                    },
                    error: err => {                     
                      this.showMessage(`GL Failed to delete records due to ${err}`, 'error', 'Error Message');
                    }
                  });
                } else {
                  this.showMessage(`No records found `, 'warning', 'Warning Message');
                }
              })
        } else {
          this.hideSpinner();
        }
      });

  }

  clearClickButton(): void {
    // Reset the form
    this.frm.reset({
      Type: 'Credit',
      Branchcode: ''
    });

    // Clear the selected year (optional - set to current year if needed)
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;

    // Clear the dataSource and selectedOptions
    this.dataSource = new MatTableDataSource([]);
    this.selectedOptions = [];

    // Clear labels/messages
    this.lblMessage = '';
  }

  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px', 
      customClass: {
        popup: 'swal-top-offset'
      }
    });
    this.hideSpinner();
    return;
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
