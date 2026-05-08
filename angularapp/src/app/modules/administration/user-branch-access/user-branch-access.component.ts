import { Component, OnInit, ViewChild } from '@angular/core';
import { UserRegistration } from 'src/app/model/userregistration';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from 'src/app/service/common.service';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import Swal from 'sweetalert2';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-user-branch-access',
  templateUrl: './user-branch-access.component.html',
  styleUrls: ['./user-branch-access.component.css']
})
export class UserBranchAccessComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  userList!: UserRegistration[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['Name', 'Designation', 'IsAdmin', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _commonService: CommonService, private _router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {
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

  ngAfterViewInit() {
    if (this.dataSource != null && this.dataSource != undefined) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'User Branch Access');
  }
  getUserRegisterList(): void {
    this.showLoadingSpinner = true;
    this._commonService.getUsers().subscribe(users => {
      this.dataSource = new MatTableDataSource<UserRegistration>(users);
      this.pageSizeOptions = [];
      const totalRows = users.length;
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.ngAfterViewInit();
      this.showLoadingSpinner = false;
    });
  }

  getUserRegisterbyName(userName: string): void {
    this._commonService.getUserByName(userName.toString()).subscribe(users => {
      this.dataSource = new MatTableDataSource<UserRegistration>([users]);
      this.pageSizeOptions = [];
      const totalRows = this.dataSource.data.length;
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.ngAfterViewInit();
      this.showLoadingSpinner = false;
    });
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
          if (this.currentUser == 'superadmin') {
            this.getUserRegisterList();
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
              this.getUserRegisterbyName(this.currentUser);
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
              this.showLoadingSpinner = false;
            }
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/administration/new-user-branch-access'], { queryParams: { name: data.Name }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(userId: number): void {
    this.showLoadingSpinner = true;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this user details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._commonService.deleteUser(userId).subscribe((response) => {
            if (response.Headers[0].Key == 'Success') {
              this.showLoadingSpinner = false;
              this.getUserRegisterList();
              Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                title: 'Success',
                text: response.Headers[0].value,
                icon: 'success',
                showCloseButton: false,
                timer: 3000,
                width: '600px',
                customClass: {
                  popup: 'swal-top-offset'
                }
              });
            }
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.showLoadingSpinner = false;
        }
      });

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      // this.errorMessage = error;
      this.showLoadingSpinner = false
    }
  }
}
