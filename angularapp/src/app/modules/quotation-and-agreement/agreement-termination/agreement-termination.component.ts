import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AgreementService } from "../agreement.service";
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

export interface PeriodicElement {
  ClientName: string;
  TerminationDate: string;
}


@Component({
  selector: 'app-agreement-termination',
  templateUrl: './agreement-termination.component.html',
  styleUrls: ['./agreement-termination.component.css']
})
export class AgreementTerminationComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  displayedColumns: string[] = ['ClientName', 'TerminationDate', 'action'];
  branchList: any;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource<PeriodicElement>();
  currentUser: string = '';
  pageSizeOptions: number[] = [];

  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, public service: AgreementService, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Agreement Termination');
    //this.getAgreements("0");
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
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getAgreements("0");
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }

  }

  changeBranch(value: any) {
    this.getAgreements(value);
  }

  getAgreements(branchId: string) {
    this.service.getAgreementsTermination(branchId, this.currentUser).subscribe((d: any) => {
      this.branchList = d['branches']
      this.dataSource = new MatTableDataSource(d['agreementTermination']);
      this.pageSizeOptions = [];
      const totalRows = this.dataSource.data.length;
      for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
        this.pageSizeOptions.push(i);
      }
      if (totalRows > 0 && totalRows < 10) {
        this.pageSizeOptions.push(totalRows);
      }
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.hideLoadingSpinner();
    })
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner();
    }
  }
  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }
}
