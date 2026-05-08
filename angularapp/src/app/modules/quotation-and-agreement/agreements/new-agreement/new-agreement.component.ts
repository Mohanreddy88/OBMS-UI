import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AgreementService } from "../../agreement.service";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { DatasharingService } from "../../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { firstValueFrom, forkJoin, map, Observable, tap } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

export interface IItemDetails {
  ID: number,
  AgreementID: number,
  Description: string,
  ClientInvoiceID?: string,
  NoOfGuards: number,
  Rate: number,
  NoOfHours: number,
  NoOfDays: number,
  FollowCalender: boolean,
  HasDiscount: boolean,
  DiscountAmount: number,
  IsTaxable: boolean,
  TaxAmount: number,
  MonthTotal: number,
  DiscountHour: number,
  Category: string,
  Reason: string,
  total?: number,
  index?: string,
}

export interface IAgreement {
  ID: number,
  WorkPlace: string;
  BranchName: string;
  ClientName: string;
  AgreementDate: string;
}

@Component({
  selector: 'app-new-agreement',
  templateUrl: './new-agreement.component.html',
  styleUrls: ['./new-agreement.component.css']
})
export class NewAgreementComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('paginator2') paginator2!: MatPaginator;
  @ViewChild('sort2') sort2!: MatSort;
  displayedColumns: string[] = ['Description', 'NoOfGuards', 'Rate', 'NoOfHours', 'NoOfDays', 'FollowCalender', 'MonthTotal', 'YearTotal', 'HasDiscount', 'DiscountAmount', 'DiscountHour', 'IsTaxable', 'TaxAmount', 'total', 'Category', 'Reason', 'action'];
  dataSource!: MatTableDataSource<IItemDetails>;

  agreementDisplayedColumns: string[] = ['BranchName', 'ClientName', 'WorkPlace', 'AgreementDate', 'action'];
  agreementDataSource!: MatTableDataSource<IAgreement>;

  frm!: FormGroup
  details: IItemDetails[] = [];
  data: any;
  branchList: any;
  clientList: any;
  isEdit: boolean = false;
  detailEdit: boolean = false;
  ID: any;
  today: any;
  sixMonthsAgo: any;
  errorDescription: string = "";
  type: string = "";
  currentUser: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  invoiceButton: boolean = false;
  branchAgrrements: any[] = [];
  pageSizeOptionsAgreement: number[] = [];
  pageSizeOptions: number[] = [];
  existingAgreementDate: Date = new Date();
  editedType: string = '';

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, public service: AgreementService,
    private activatedRoute: ActivatedRoute, private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptions.push(i);
    }
    for (let i = 10; i <= 50; i += 10) {
      this.pageSizeOptionsAgreement.push(i);
    }
    this.today = new Date();
    this.sixMonthsAgo = new Date();
    this.sixMonthsAgo.setMonth(this.today.getMonth() - 6);


    this.frm = this.fb.group({
      ID: [0],
      AgreementDate: [new Date(), Validators.required],
      Branch: ['', Validators.required],
      Client: ['', Validators.required],
      WorkPlace: ['', Validators.required],
      IsValid: [true],
      details: this.fb.group({
        ID: [0],
        AgreementID: [0],
        Description: [''],
        NoOfGuards: [0],
        Rate: [0],
        NoOfHours: [0],
        NoOfDays: [0],
        FollowCalender: [false],
        MonthTotal: [0],
        YearTotal: [0],
        HasDiscount: [false],
        DiscountAmount: [0],
        DiscountHour: [0],
        IsTaxable: [true],
        TaxAmount: [0],
        total: [0],
        Category: [''],
        Reason: [''],
        index: [-1]
      }),
      Note: ['-'],
    });

  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<IItemDetails>([]);
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Agreement');
    this.service.getAgreementMaster(this.currentUser).subscribe((data: any) => {
      this.data = data;
      this.branchList = data['branchList'];
      this.clientList = data['clientList'];
    });
    this.ID = this.activatedRoute.snapshot.params['ID'];
    if (this.ID != 0 && this.ID != undefined) {
      this.isEdit = true;
      this.bindEditedValues(this.ID);
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

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    if (this.agreementDataSource) {
      this.agreementDataSource.paginator = this.paginator2;
      this.agreementDataSource.sort = this.sort2;
    }
  }
  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  getClientsByBranchID(value: any) {
    this.loadAgreementData(value);
  }

  loadAgreementData(branchID: string) {
    if (!branchID) return;

    this.service.getClientsByBranchID(branchID, this.currentUser).subscribe({
      next: (clientData: any) => {
        // Assign clients
        this.clientList = clientData['clients'];

        // Assign agreements safely
        const agreements = clientData['agreements'];
        this.branchAgrrements = agreements?.Result || agreements || [];

        // Reset details if needed
        //this.details = [];

        // Initialize Material table
        this.agreementDataSource = new MatTableDataSource(this.branchAgrrements);
        this.pageSizeOptionsAgreement = [];
        const totalRows = this.branchAgrrements.length;
        for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
          this.pageSizeOptionsAgreement.push(i);
        }
        if (totalRows > 0 && totalRows < 10) {
          this.pageSizeOptionsAgreement.push(totalRows);
        }
        this.ngAfterViewInit();
      },
      error: (err) => {
        console.error('Error loading data:', err);
      }
    });
  }

  checkInvoiceAndSetButtons(agreementId: number) {
    this.service.isInvoiceAvailable(agreementId).subscribe({
      next: (isAvailable: boolean) => {
        if (isAvailable) {
          // If invoice available, then get final invoice date
          forkJoin({
            finalInvoiceDate: this.service.getInvoiceDate(this.ID)
          }).subscribe({
            next: (results) => {
              const finalInvoiceDate = new Date(results.finalInvoiceDate);
              const date = new Date(finalInvoiceDate);
              const formattedDate = date.toLocaleString('default', { month: 'long', year: 'numeric' });
              this.showMessage(`New Agreement Period can not be less than ${formattedDate}`, 'warning', 'Warning Message');
              this.invoiceButton = true
            },
            error: (err) => {
              console.error('Error getting final invoice date', err);
            }
          });
        } else {
          // No invoice → both buttons enabled
          this.invoiceButton = false
        }
      },
      error: (err) => {
        console.error('Error checking invoice availability', err);
      }
    });
  }

  async bindEditedValues(id: number) {
    this.details = [];

    const d: any = await firstValueFrom(this.service.getAgreementById(id));
    const result = d['Result'];
    const agreement = result['agreement'];
    const agreementDetails = result['agreementDetails'];

    // Wait for getClientsByBranchID to complete
    if (agreement.Branch) {
      this.loadAgreementData(agreement.Branch);
    }
    this.existingAgreementDate = agreement.AgreementDate;
    this.frm.patchValue(agreement);

    agreementDetails.forEach((d: any) => {
      d['YearTotal'] = parseFloat(d['MonthTotal']) * 12;
      let vDiscount = parseFloat(d['Discount']);
      if (!d['details.HasDiscount']) {
        vDiscount = 0;
      }

      let t = parseFloat(d['MonthTotal']) - vDiscount;
      if (d['IsTaxable']) {
        d['total'] = this.formatCurrency(t * (108 / 100));
      } else {
        d['total'] = this.formatCurrency(t);
      }

      this.details.push(d);
    });

    this.detailDataSource();
    this.frm.patchValue({ WorkPlace: agreement.WorkPlace });

    this.checkInvoiceAndSetButtons(id);
  }

  // addItemDetails(action: string) {
  //   this.DetailRowChange();
  //   let frmData = this.frm.getRawValue();
  //   let details = frmData['details'];

  //   if (details['Description'] == "") {
  //     this.errorDescription = "Enter the type";
  //     return;
  //   }

  //   if (details['Category'] == "") {
  //     details['Category'] = "-";
  //   }
  //   // if (details['index'] == -1 && action == 'add') {
  //   if (action == 'add') {
  //     details['ID'] = 0;
  //     details['LastUpdatedBy'] = this.currentUser;
  //     this.details.push(details);
  //   } else if (details['index'] >= 0 && action == 'update') {
  //     this.details[details['index']] = details;
  //   }
  //   this.detailDataSource();
  //   this.chkNormal("N");
  //   this.detailEdit = false;
  // }

  addItemDetails(action: string) {
    this.DetailRowChange();

    const frmData = this.frm.getRawValue();
    const detailFromForm = frmData['details'];

    if (!detailFromForm.Description || detailFromForm.Description.trim() === '') {
      this.errorDescription = "Enter the type";
      return;
    }

    if (!detailFromForm.Category) {
      detailFromForm.Category = "-";
    }

    // Ensure datasource exists
    if (!this.dataSource) {
      this.dataSource = new MatTableDataSource<IItemDetails>([]);
    }

    const currentDetails = this.dataSource.data || [];

    if (action === 'add') {
      const newDetail: IItemDetails = {
        ...detailFromForm,
        ID: 0,
        AgreementID: this.ID ?? 0,
        LastUpdatedBy: this.currentUser,

        // Default values
        HasDiscount: detailFromForm.HasDiscount ?? false,
        FollowCalender: detailFromForm.FollowCalender ?? false,
        DiscountAmount: detailFromForm.DiscountAmount ?? 0,
        DiscountHour: detailFromForm.DiscountHour ?? 0,
        IsTaxable: detailFromForm.IsTaxable ?? true,
        TaxAmount: detailFromForm.TaxAmount ?? 0,
        MonthTotal: detailFromForm.MonthTotal ?? 0,
        YearTotal: detailFromForm.YearTotal ?? 0
      };

      currentDetails.push(newDetail);
    }

    else if (action === 'update') {
      const idx = detailFromForm.index;

      if (idx >= 0 && idx < currentDetails.length) {
        currentDetails[idx] = {
          ...currentDetails[idx],
          ...detailFromForm
        };
      } else {
        return;
      }
    }

    // Refresh table
    this.dataSource.data = [...currentDetails];

    // Sync main array
    this.details = [...this.dataSource.data];

    // Reset form
    this.detailEdit = false;
    this.frm.get('details')?.reset({ index: -1 });
    this.frm.get('details.IsTaxable')?.setValue(true);
  }


  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.pageSizeOptions = [];
    const totalRows = this.details.length;
    for (let i = 10; i <= totalRows && i <= 1000; i += 10) {
      this.pageSizeOptions.push(i);
    }
    if (totalRows > 0 && totalRows < 10) {
      this.pageSizeOptions.push(totalRows);
    }
    this.ngAfterViewInit();
  }

  emptyDetailData() {
    let emptyData = {
      ID: 0,
      AgreementID: 0,
      Description: '',
      NoOfGuards: 0,
      Rate: 0,
      NoOfHours: 0,
      NoOfDays: 0,
      FollowCalender: false,
      MonthTotal: 0,
      YearTotal: 0,
      HasDiscount: false,
      DiscountAmount: 0,
      DiscountHour: 0,
      IsTaxable: true,
      TaxAmount: 0,
      total: 0,
      Category: '',
      Reason: '',
      index: -1
    }


    this.frm.get('details')?.setValue(emptyData);
  }

  // editRow(row: IItemDetails, index: any) {
  //   this.detailEdit = true;
  //   row['index'] = index;
  //   this.frm.get('details')?.patchValue(row);
  // }

  editRow(row: IItemDetails) {
    this.detailEdit = true;

    const actualIndex = this.dataSource.data.findIndex(x => x === row);

    // get first character from Description
    const type = row.Description ? row.Description.substring(0, 3) : '';

    this.frm.get('details')?.patchValue({
      ...row,
      index: actualIndex
    });
    // Apply previous enable/disable state
    this.applyTypeSettings(type);
  }

  applyTypeSettings(type: string) {
    if (type != 'LUM' && type != 'DOG' && type != 'TRI' && type != 'HOU' && type != 'BAG') {
      type = 'N'
    }
    this.editedType = type;
    switch (type) {

      case 'N': // Normal
        this.frm.get('details.NoOfGuards')?.enable();
        this.frm.get('details.Rate')?.enable();
        this.frm.get('details.NoOfHours')?.enable();
        this.frm.get('details.NoOfDays')?.enable();
        break;

      case 'LUM': // Lump Sum
        this.frm.get('details.Rate')?.disable();
        this.frm.get('details.NoOfHours')?.enable();
        this.frm.get('details.NoOfGuards')?.enable();
        this.frm.get('details.NoOfDays')?.enable();
        break;

      case 'DOG':
      case 'TRI':
      case 'BAG':
        this.frm.get('details.NoOfGuards')?.enable();
        this.frm.get('details.Rate')?.enable();
        this.frm.get('details.NoOfHours')?.disable();
        this.frm.get('details.NoOfDays')?.disable();
        break;

      case 'HOU':
        this.frm.get('details.NoOfGuards')?.disable();
        this.frm.get('details.Rate')?.enable();
        this.frm.get('details.NoOfHours')?.enable();
        this.frm.get('details.NoOfDays')?.disable();
        break;
    }
  }
  // deleteRow(row: IItemDetails, index: any) {
  //   this.dialog
  //     .open(DialogConfirmationComponent, {
  //       data: `Are you sure want to delete this agreement details?`
  //     })
  //     .afterClosed()
  //     .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
  //       if (result.confirmDialog) {
  //         // 🔹 Existing record in DB
  //         if (row.ID && row.ID !== 0) {
  //           this.service.deleteAgreementDetailById(row.ID.toString()).subscribe(() => {
  //             this.bindEditedValues(this.ID);   // reload from server
  //           });
  //         }
  //         // 🔹 New unsaved row
  //         else {
  //           this.details.splice(index, 1);
  //           this.detailDataSource();
  //         }
  //       } else {
  //         this.hideSpinner();
  //       }
  //     });
  // }

  deleteRow(row: IItemDetails) {

    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this agreement details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {

        if (result?.confirmDialog) {

          // 🔹 Existing record in DB
          if (row.ID && row.ID !== 0) {

            this.service.deleteAgreementDetailById(row.ID)
              .subscribe(() => {
                this.bindEditedValues(this.ID);   // reload from server
              });

          }
          // 🔹 New unsaved row
          else {

            // ✅ Find actual index from master array
            const actualIndex = this.details.findIndex(x => x === row);

            if (actualIndex !== -1) {
              this.details.splice(actualIndex, 1);
              this.detailDataSource();   // rebind datasource
            }
          }

        } else {
          this.hideSpinner();
        }

      });
  }

  checkClientStatus() {
    if (this.frm.get("Branch")?.value != null && this.frm.get("Client")?.value != null) {

      this.service.checkClientStatus(this.frm.get("Branch")?.value, this.frm.get("Client")?.value).subscribe((d: any) => {
        if (d['Result'] == 1) {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Error',
            text: "Client Already Inactive!!!",
            icon: 'error',
            showCloseButton: false,
            timer: 3000,
          });
          this.frm.get("Branch")?.setValue("");
          this.frm.get("Client")?.setValue("");
        }
      })
    }
  }

  chkNormal(type: string) {
    this.type = type;
    this.editedType == 'N'
    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });
  }

  chkLumpSum(type: string) {
    this.type = type;
    this.editedType == 'LUM'
    this.emptyDetailData();
    // Rate

    // NoOfHours
    // NoOfDays


    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("LUM::");
    // Follow Calander
    // this.frm.get('details.NoOfDays')?.setValue("");
    // this.frm.get('details.NoOfDays')?.disable({onlySelf: true});

  }

  chkDogService(type: string) {
    this.type = type;
    this.editedType == 'DOG'
    this.emptyDetailData();
    // NoOfGuards

    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("DOG::");
  }

  chkTrip(type: string) {
    this.type = type;
    this.editedType == 'TRI'
    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("TRIP::");
  }

  chkBag(type: string) {
    this.type = type;
    this.editedType == 'BAG'
    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("BAG::");
  }

  chkHour(type: string) {
    this.type = type;
    this.editedType == 'HOU'
    this.emptyDetailData();
    this.frm.get('details.NoOfGuards')?.setValue(0);
    this.frm.get('details.NoOfGuards')?.disable({ onlySelf: true });

    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.setValue(0);
    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });

    this.frm.get('details.Description')?.setValue("HOUR::");
  }

  changeFollowCalender(event: any) {

    let dt = this.frm.get('AgreementDate')?.value;

    const currentDate = new Date(dt);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (event.checked) {
      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);
      this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });
    } else {
      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);
      this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });
    }

    this.DetailRowChange();
  }

  // DetailRowChange(): void {

  //   const _description = this.frm.get('details.Description')?.value;

  //   if (_description != "") {
  //     this.errorDescription = "";
  //   } else {
  //     this.errorDescription = "Enter the type";
  //   }

  //   let dt = this.frm.get('AgreementDate')?.value;

  //   const currentDate = new Date(dt);

  //   const currentYear = currentDate.getFullYear();
  //   const currentMonth = currentDate.getMonth();

  //   let vMonthTotal = 0;
  //   //
  //   const tNoOfGuards = this.frm.get('details.NoOfGuards')?.value;
  //   const tRate = this.frm.get('details.Rate')?.value;
  //   const tNoOfHours = this.frm.get('details.NoOfHours')?.value;
  //   const tNoOfDays = this.frm.get('details.NoOfDays')?.value;

  //   if (parseInt("0" + tNoOfGuards, 10) === 0) {
  //     vMonthTotal = parseFloat(tRate) * parseFloat(tNoOfDays);
  //   } else {
  //     vMonthTotal = (
  //       parseFloat(tNoOfGuards) *
  //       parseFloat(tRate) *
  //       parseFloat(tNoOfHours) *
  //       parseFloat(tNoOfDays)
  //     );
  //   }

  //   if (!(parseInt("0" + tNoOfGuards, 10) === 0 ||
  //     parseInt("0" + tRate, 10) === 0 ||
  //     parseInt("0" + tNoOfHours, 10) === 0 ||
  //     parseInt("0" + tNoOfDays, 10) === 0)) {
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else if (this.type == 'S') {
  //     vMonthTotal = tNoOfGuards * tRate;
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else if (this.type == 'H') {
  //     vMonthTotal = tNoOfHours * tRate;
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else {
  //     vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value);
  //   }

  //   this.frm.get('details.YearTotal')?.setValue(this.formatCurrency(vMonthTotal * 12));

  //   if (this.frm.get('details.IsTaxable')?.value) {
  //     // const FiveOrSix = currentYear <= 2010 ? 5 : 6;
  //     const FiveOrSix = 8;//(currentYear <= 2024 && currentMonth < 3) ? 6 : 8;
  //     this.frm.get('details.TaxAmount')?.setValue(
  //       this.formatCurrency((vMonthTotal - parseFloat(this.frm.get('details.DiscountAmount')?.value)) * (FiveOrSix / 100))
  //     );
  //   } else {
  //     this.frm.get('details.TaxAmount')?.setValue(0);
  //   }

  //   let vDiscount = parseFloat(this.frm.get('details.DiscountAmount')?.value);
  //   if (!this.frm.get('details.HasDiscount')?.value) {
  //     vDiscount = 0;
  //   }

  //   if (this.frm.get('details.IsTaxable')?.value) {
  //     this.frm.get('details.total')?.setValue(this.formatCurrency((vMonthTotal - vDiscount) * (108 / 100)));
  //     // this.frm.get('details.total')?.setValue(this.formatCurrency((vMonthTotal - vDiscount) * (106 / 100)));
  //   } else {
  //     this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount));
  //   }
  // }

  // DetailRowChange(): void {

  //   const _description = this.frm.get('details.Description')?.value;

  //   if (_description != "") {
  //     this.errorDescription = "";
  //   } else {
  //     this.errorDescription = "Enter the type";
  //   }

  //   let dt = this.frm.get('AgreementDate')?.value;
  //   const currentDate = new Date(dt);
  //   const currentYear = currentDate.getFullYear();
  //   const currentMonth = currentDate.getMonth();

  //   // Helper function to safely parse numbers
  //   const toNumber = (value: any) => {
  //     const num = parseFloat(value);
  //     return isNaN(num) ? 0 : num;
  //   };

  //   let vMonthTotal = 0;

  //   const tNoOfGuards = toNumber(this.frm.get('details.NoOfGuards')?.value);
  //   const tRate = toNumber(this.frm.get('details.Rate')?.value);
  //   const tNoOfHours = toNumber(this.frm.get('details.NoOfHours')?.value);
  //   const tNoOfDays = toNumber(this.frm.get('details.NoOfDays')?.value);
  //   const tDiscountAmount = toNumber(this.frm.get('details.DiscountAmount')?.value);

  //   if (tNoOfGuards === 0) {
  //     vMonthTotal = tRate * tNoOfDays;
  //   } else {
  //     vMonthTotal = tNoOfGuards * tRate * tNoOfHours * tNoOfDays;
  //   }

  //   if (!(tNoOfGuards === 0 || tRate === 0 || tNoOfHours === 0 || tNoOfDays === 0)) {
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else if (this.type == 'S') {
  //     vMonthTotal = tNoOfGuards * tRate;
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else if (this.type == 'H') {
  //     vMonthTotal = tNoOfHours * tRate;
  //     this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
  //   } else {
  //     vMonthTotal = toNumber(this.frm.get('details.MonthTotal')?.value);
  //   }

  //   this.frm.get('details.YearTotal')?.setValue(this.formatCurrency(vMonthTotal * 12));

  //   if (this.frm.get('details.IsTaxable')?.value) {
  //     const FiveOrSix = 8; // simplified from your existing logic
  //     this.frm.get('details.TaxAmount')?.setValue(
  //       this.formatCurrency((vMonthTotal - tDiscountAmount) * (FiveOrSix / 100))
  //     );
  //   } else {
  //     this.frm.get('details.TaxAmount')?.setValue(this.formatCurrency(0));
  //   }

  //   let vDiscount = this.frm.get('details.HasDiscount')?.value ? tDiscountAmount : 0;

  //   if (this.frm.get('details.IsTaxable')?.value) {
  //     this.frm.get('details.total')?.setValue(this.formatCurrency((vMonthTotal - vDiscount) * (108 / 100)));
  //   } else {
  //     this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount));
  //   }
  // }


  DetailRowChange(): void {

    const _description = this.frm.get('details.Description')?.value;
    if (_description != "") {
      // get first character from Description
      const type = _description.Description ? _description.Description.substring(0, 3) : '';
      if (type != 'LUM' && type != 'DOG' && type != 'TRI' && type != 'HOU' && type != 'BAG') {
        this.editedType = 'N'
      } else {
        this.editedType = type;
      }
      this.errorDescription = "";
    } else {
      this.errorDescription = "Enter the type";
    }

    let dt = this.frm.get('AgreementDate')?.value;
    const currentDate = new Date(dt);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const toNumber = (value: any) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    let vMonthTotal = 0;

    const tNoOfGuards = toNumber(this.frm.get('details.NoOfGuards')?.value);
    const tRate = toNumber(this.frm.get('details.Rate')?.value);
    const tNoOfHours = toNumber(this.frm.get('details.NoOfHours')?.value);
    const tNoOfDays = toNumber(this.frm.get('details.NoOfDays')?.value);
    const tDiscountAmount = toNumber(this.frm.get('details.DiscountAmount')?.value);


    // Normal logic
    if (parseInt("0" + tNoOfGuards, 10) !== 0 && parseInt("0" + tRate, 10) !== 0 &&
      parseInt("0" + tNoOfHours, 10) !== 0 &&
      parseInt("0" + tNoOfDays, 10) !== 0 && this.editedType == 'N') {
      vMonthTotal = tNoOfGuards * tRate * tNoOfHours * tNoOfDays;
    } else if (parseInt("0" + tNoOfGuards, 10) === 0 && parseInt("0" + tRate, 10) !== 0 &&
      parseInt("0" + tNoOfHours, 10) !== 0 &&
      parseInt("0" + tNoOfDays, 10) !== 0 && this.editedType == 'N') {
      vMonthTotal = tRate * tNoOfHours * tNoOfDays;
    }
    else if (parseInt("0" + tNoOfGuards, 10) !== 0 && parseInt("0" + tRate, 10) === 0 &&
      parseInt("0" + tNoOfHours, 10) !== 0 &&
      parseInt("0" + tNoOfDays, 10) !== 0 && this.editedType == 'N') {
      vMonthTotal = tNoOfGuards * tNoOfHours * tNoOfDays;
    }
    else if (parseInt("0" + tNoOfGuards, 10) === 0 && parseInt("0" + tRate, 10) == 0 &&
      parseInt("0" + tNoOfHours, 10) !== 0 &&
      parseInt("0" + tNoOfDays, 10) !== 0 && this.editedType == 'N') {
      vMonthTotal = tNoOfHours * tNoOfDays;
    } else if (parseInt("0" + tNoOfGuards, 10) !== 0 && parseInt("0" + tRate, 10) !== 0 &&
      parseInt("0" + tNoOfHours, 10) === 0 &&
      parseInt("0" + tNoOfDays, 10) !== 0 && this.editedType == 'N') {
      vMonthTotal = tNoOfGuards * tRate * tNoOfDays;
    } else if (parseInt("0" + tNoOfGuards, 10) !== 0 && parseInt("0" + tRate, 10) !== 0 &&
      parseInt("0" + tNoOfHours, 10) !== 0 &&
      parseInt("0" + tNoOfDays, 10) == 0 && this.editedType == 'N') {
      vMonthTotal = tNoOfGuards * tRate * tNoOfHours;
    } else {
      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(0));
      this.frm.get('details.YearTotal')?.setValue(this.formatCurrency(vMonthTotal * 12));
    }

    if (this.type == 'L' || this.editedType == 'LUM') {
      vMonthTotal = tNoOfGuards * tNoOfHours;
      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));

    } else if (this.type == 'S' || this.editedType == 'DOG' || this.editedType == 'BAG' || this.editedType == 'TRI') {
      vMonthTotal = tNoOfGuards * tRate;
      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));

    } else if (this.type == 'H' || this.editedType == 'HOU') {
      vMonthTotal = tNoOfHours * tRate;
      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
    }

    this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
    this.frm.get('details.YearTotal')?.setValue(this.formatCurrency(vMonthTotal * 12));

    if (this.frm.get('details.IsTaxable')?.value) {
      const FiveOrSix = 8;
      this.frm.get('details.TaxAmount')?.setValue(
        this.formatCurrency((vMonthTotal - tDiscountAmount) * (FiveOrSix / 100))
      );

    } else {
      this.frm.get('details.TaxAmount')?.setValue(this.formatCurrency(0));
    }

    let vDiscount = tDiscountAmount;

    if (!this.frm.get('details.HasDiscount')?.value) {
      vDiscount = 0;
    }

    if (this.frm.get('details.IsTaxable')?.value) {

      this.frm.get('details.total')?.setValue(
        this.formatCurrency((vMonthTotal - vDiscount) * (108 / 100))
      );

    } else {

      this.frm.get('details.total')?.setValue(
        this.formatCurrency(vMonthTotal - vDiscount)
      );

    }
  }

  SetNoOfDays(): void {
    let i = 31;

    for (i = 31; i >= 1; i--) {
      const vNewDate = new Date(this.frm.get('AgreementDate')?.value);
      vNewDate.setDate(i);

      if (vNewDate.getDate() === i) {
        break;
      }
    }

    this.frm.get('details.NoOfDays')?.setValue(i.toString());
    this.DetailRowChange();
  }

  onEditClick(data: any): void {
    this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.route.navigate(['/quotation-and-agreement/agreements/edit-agreement', data.ID]);
    });
  }

  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    const newAgreementDate = new Date(this.frm.value.AgreementDate).toDateString();
    const existingDate = new Date(this.existingAgreementDate).toDateString();

    if (newAgreementDate !== existingDate) {
      if (this.details && this.details.length > 0) {
        this.details.forEach((item: any) => {
          item.ID = 0; // reset all detail IDs
        });
      }
    }
  }


  onSubmit() {
    let data = this.frm.getRawValue();
    data['LastUpdatedBy'] = this.currentUser;
    data['details'] = this.details;

    //console.log('save:', data, '===> existing date:', this.existingAgreementDate);

    if (this.frm.invalid) {
      return;
    }

    data['AgreementDate'] = this.returnDate(this.frm.get('AgreementDate')?.value);

    const newAgreementDate = new Date(data['AgreementDate']).toDateString();
    const existingDate = new Date(this.existingAgreementDate).toDateString();

    if (this.ID > 0 && newAgreementDate === existingDate) {

      // Existing logic (update case)
      forkJoin({
        finalInvoiceDate: this.service.getInvoiceDate(this.ID)
      }).subscribe({
        next: (results) => {
          const finalInvoiceDate = new Date(results.finalInvoiceDate);
          const newAgreementDateObj = new Date(data['AgreementDate']);

          if (newAgreementDateObj <= finalInvoiceDate) {
            const formattedDate = finalInvoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            this.showMessage(`New Agreement Period must be greater than ${formattedDate}`, 'warning', 'Warning Message');
            return;
          }

          this.saveAgreement(data);
        },
        error: () => {
          this.showMessage(`Failed to save agreement details.`, 'error', 'Error Message');
        }
      });

    } else {
      data.ID = 0;   // force insert instead of update
      if (data.details && data.details.length > 0) {
        data.details.forEach((item: any) => {
          item.ID = 0; // reset all detail IDs
        });
      }
      this.saveAgreement(data);
    }
  }

  returnDate(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    // const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}-${month}-01`;
  }
  private saveAgreement(data: any): void {
    let msg = this.isEdit
      ? 'Successfully Updated Agreement Details'
      : 'Successfully Saved Agreement Details';

    this.service.save(data).subscribe({
      next: (d: any) => {
        this.showMessage(`${msg}`, 'success', 'Success Message');
        this.route.navigate(['/quotation-and-agreement/agreements']);
      },
      error: (err) => {
        this.showMessage(`Failed to save agreement details.`, 'error', 'Error Message');
      }
    });
  }
  private formatCurrency(value: number): string {
    // Implement your currency formatting logic here
    return value.toFixed(2);
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
      this.errorMessage = error;
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }

}

