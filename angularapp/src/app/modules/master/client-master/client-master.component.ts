import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ClientModel } from 'src/app/model/clientModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { BranchModel } from 'src/app/model/branchModel';
import { debounceTime, Subject } from 'rxjs';


@Component({
  selector: 'app-client-master',
  templateUrl: './client-master.component.html',
  styleUrls: ['./client-master.component.css']
})
export class ClientMasterComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  clientModel!: ClientModel[];
  showLoadingSpinner: boolean = false;
  clientCode: string = 'null';
  displayedColumns: string[] = ['client_code', 'branch_code', 'ubs_code', 'client_name', 'address', 'person_incharge', 'Status', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  branchModel!: BranchModel[];
  pageSizeOptions: number[] = [];
  branchSearchSubject = new Subject<string>();
  branchSearchString: string = '';
  filteredBranchList: any[] = [];

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    private _masterService: MastermoduleService, private _router: Router,
    public dialogo: MatDialog, private _dataService: DatasharingService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
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
      this.branchModel = [...this.filteredBranchList];
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Client Master');

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
            this.getClientMasterList('null', 'Active');
            this.getBranchMasterListByUser(this.currentUser);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.showLoadingSpinner = false;
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getClientMasterList(code: string, status: string): void {
    this.showLoadingSpinner = true;
    this._masterService.getClienthMaster(code, status, this.currentUser).subscribe(
      (data) => {
        if (data.length > 0) {
          this.dataSource = new MatTableDataSource<ClientModel>(data);
          this.pageSizeOptions = [];
          const totalRows = data.length;
          for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
            this.pageSizeOptions.push(i);
          }
          if (totalRows > 0 && totalRows < 10) {
            this.pageSizeOptions.push(totalRows);
          }
          this.ngAfterViewInit();
        } else {
          this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
        }
        this.hideSpinner();
      },
      (error) => {
        console.log(error);
      }
    );
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.filteredBranchList = [...this.branchModel];
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onBranchSelectionChange(event: any) {
    this._masterService.getClientMsterListByBranch(event.value).subscribe(
      (data) => {
        if (data.length > 0) {
          this.errorMessage = '';
          this.dataSource = new MatTableDataSource<ClientModel>(data);
          this.ngAfterViewInit();
        } else {
          this.errorMessage = `No data available for 
              <strong style="color:#000000">${this.currentUser}</strong> 
              for this 
              <strong style="color:#000000">${event.value}</strong>. 
              Please try again later.`;
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  statusSelectionChanged(event: MatRadioChange) {
    this._masterService.getClientMsterListByStatus(event.value).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource<ClientModel>(data);
        this.ngAfterViewInit();
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/master/client-master/new-client'], { queryParams: { code: data.Code, status: data.Status }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(code: string, status: string): void {
    this.showLoadingSpinner = true;
    this.clientCode = code;

    this.dialogo
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this client details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._masterService.deleteClientMasterByCode(this.clientCode).subscribe((response) => {
            this.clientCode = 'null';
            this.getClientMasterList('null', status);
            Swal.fire({
              toast: true,
              position: 'top',
              showConfirmButton: false,
              title: 'Success',
              text: response.Headers[0].Value,
              icon: 'success',
              showCloseButton: false,
              timer: 3000,
              width: '600px',
              customClass: {
                popup: 'swal-top-offset'
              }
            });
            this.showLoadingSpinner = false;
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.showLoadingSpinner = false;
        }
      });
  }
  searchDropdown(searchString: string, list: any[], key: string): any[] {
    if (!searchString) return [...list]; // if empty, return full list
    return list.filter(item => item[key].toLowerCase().includes(searchString.toLowerCase()));
  }

  onKeyDropdown(
    event: KeyboardEvent,
    searchStringProp: 'branchSearchString',
    listProp: 'branchModel',
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
  hideSpinner() {
    this.showLoadingSpinner = false;
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

}
