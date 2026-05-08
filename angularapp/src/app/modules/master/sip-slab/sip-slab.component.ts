import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { SIPModel } from 'src/app/model/SIPModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

@Component({
  selector: 'app-sip-slab',
  templateUrl: './sip-slab.component.html',
  styleUrls: ['./sip-slab.component.css']
})
export class SipSlabComponent implements AfterViewInit {
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['siP_from', 'siP_to', 'siP_worker', 'siP_boss', 'action'];
  dynamicPageSizeOptions: number[] = [];
  defaultPageSize: number = 10;
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  sipListObj: any = {
    id: 0
  }
  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _dataService: DatasharingService) {
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

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

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
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'SIP Slab');
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
            this.getSIPMasterList(0);
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
  getSIPMasterList(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getSIPhMaster(id).subscribe(
      (data) => {
        this.generatePageSizeOptions(data);
        this.dataSource = new MatTableDataSource<SIPModel>(data);
        this.paginator.pageSize = this.defaultPageSize;
        this.ngAfterViewInit();
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }
  onEditClick(data: any): void {
    this._router.navigate(['/master/sip-slab/new-sip-slab'], { queryParams: { id: data.SIP_id }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(id: number): void {
    this.showLoadingSpinner = true;
    this.sipListObj.id = id;
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this SIP details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._masterService.deleteSIPMasterById(this.sipListObj.id).subscribe((response) => {
            if (response.Headers[0].Key == 'Success') {
              this.getSIPMasterList(0);
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
            }
          },
            (error) => this.handleErrors(error)
          );
        } else {
          this.showLoadingSpinner = false;
        }
      });
  }
  // Generate page size options dynamically up to 2000
  generatePageSizeOptions(data: any): void {
    const options: number[] = [];
    for (let i = 10; i <= data.length; i += 10) {
      options.push(i);
    }
    this.dynamicPageSizeOptions = options;

  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      // this.errorMessage = error;
      this.showLoadingSpinner = false;
    }
  }

}
