import { Component, OnInit, ViewChild } from '@angular/core';
import { BankMasterModel } from 'src/app/model/bankMasterModel';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from 'src/app/service/common.service';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import Swal from 'sweetalert2';
import { BankListModel } from 'src/app/model/bankListModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';

@Component({
  selector: 'app-bank-master',
  templateUrl: './bank-master.component.html',
  styleUrls: ['./bank-master.component.css']
})
export class BankMasterComponent implements OnInit {
  bankList!: BankListModel[];
  bankMaster!: BankMasterModel[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['BankCode', 'Accname', 'Accno', 'AccShortName', 'PREFIX', 'action'];
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

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngOnInit(): void {
    this.showLoadingSpinner = true;
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Bank Master');
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
            this.getBankMasterList();
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
              this.getUserBankMaster(this.currentUser);
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;
            }
          }
          this.hideLodingSpinner()
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getBankMasterList(): void {
    this.showLoadingSpinner = true;
    this._commonService.getBankMasterList().subscribe(bankMaster => {
      this.dataSource = new MatTableDataSource<BankMasterModel>(bankMaster);
      this.pageSizeOptions = [];
      const totalRows = bankMaster.length;      
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      // If total rows less than 10, still allow showing all
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.ngAfterViewInit();
      this.hideLodingSpinner()
    });
  }
  getUserBankMaster(currentUser: string) {
    this._commonService.getUserBankMaster(currentUser).subscribe(bankMaster => {
      this.dataSource = new MatTableDataSource<BankListModel>(bankMaster);
      this.pageSizeOptions = [];
      const totalRows = bankMaster.length;      
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      // If total rows less than 10, still allow showing all
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.ngAfterViewInit();
      this.hideLodingSpinner()
    });
  }
  onEditClick(data: any): void {
    this._router.navigate(['/administration/new-bank-master'], { queryParams: { id: data.BankId }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(bankId: number): void {
    this.showLoadingSpinner = true;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this bank master details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._commonService.deleteBankMaster(bankId).subscribe((response) => {
            if (response.Headers[0].Key == 'Success') {
              this.showLoadingSpinner = false;
              this.getBankMasterList();
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
              this.hideLodingSpinner()
            }
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.hideLodingSpinner()
        }
      });

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideLodingSpinner()
    }
  }
  hideLodingSpinner() {
    this.showLoadingSpinner = false
  }
}
