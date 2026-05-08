import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { EPFModel } from 'src/app/model/epfModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';

@Component({
  selector: 'app-epf-slab',
  templateUrl: './epf-slab.component.html',
  styleUrls: ['./epf-slab.component.css']
})
export class EpfSlabComponent implements AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  epfModel!: EPFModel[];
  showLoadingSpinner: boolean = false;
  displayedColumns: string[] = ['start', 'end', 'employee', 'employee_8', 'employer', 'employee_55', 'employer_55', 'action'];
  dataSource: any;
  errorMessage: string = '';
  currentUser: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  pageSizeOptions: number[] = [];

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _dataService: DatasharingService) {
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
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
      this.getEPFMasterList(0);
    } else {
      this.getUserAccessRights(this.currentUser, 'EPF Slab');
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

          if (this.currentUser == 'superadmin') {
            this.getEPFMasterList(0);
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
              this.getEPFMasterList(0);
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
  getEPFMasterList(id: number): void {
    this._masterService.getEPFMaster(id).subscribe(
      (data) => {
        console.log(data);
        if (data.length > 0) {
          this.dataSource = new MatTableDataSource(data);
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

  onEditClick(data: any): void {
    this._router.navigate(['/master/epf-slab/new-epf-slab'], { queryParams: { id: data.epf_id }, queryParamsHandling: 'merge' });
  }
  onDeleteClick(id: number): void {
    this.showLoadingSpinner = true;

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this EPF details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {

          this._masterService.deleteEPFMasterById(id).subscribe((response) => {
            if (response.Headers[0].Key == 'Success') {
              this.getEPFMasterList(0);
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
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideSpinner();
    }
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }

}