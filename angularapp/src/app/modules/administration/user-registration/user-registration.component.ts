import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/service/common.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UserRegistration } from 'src/app/model/userregistration';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.css']
})
export class UserRegistrationComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  userRole!: string;
  userList!: UserRegistration[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['Name', 'Designation', 'IsAdmin', 'action'];
  dataSource: any;
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';


  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _commonService: CommonService, private _router: Router, private _masterService: MastermoduleService,
    private _dataService: DatasharingService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
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
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == '1') {
      this.userRole = 'admin'
    } else if (this.userRole == '2') {
      this.userRole = 'superadmin'
    } else {
      this.userRole = 'user'
    }
    this.showLoadingSpinner = true;
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'User Administration');
    if (this.userRole == 'superadmin') {
      this.getUserRegisterList();
    } else {
      this.getUserRegisterbyName(this.currentUser);
    }
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

          if (this.userRole == 'superadmin') {
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
  getUserRegisterList(): void {
    this._commonService.getUsers().subscribe(users => {
      this.dataSource = new MatTableDataSource<UserRegistration>(users);
      this.ngAfterViewInit();
      this.showLoadingSpinner = false;
    });
  }
  getUserRegisterbyName(userName: string): void {
    this._commonService.getUserByName(userName.toString()).subscribe(users => {
      this.dataSource = new MatTableDataSource<UserRegistration>([users]);
      this.ngAfterViewInit();
      this.showLoadingSpinner = false;
    });
  }
  onEditClick(data: any): void {
    this._router.navigate(['/register'], { queryParams: { id: data.UserId }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(userId: number): void {
    this.showLoadingSpinner = true;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this user?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._commonService.deleteUser(userId).subscribe((response) => {
            if (response.Headers[0].Key == 'Success') {
              this.showLoadingSpinner = false;
              // this.getUserRegisterList();
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

              this._router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
                this._router.navigate(['/administration/user-registration']);
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
