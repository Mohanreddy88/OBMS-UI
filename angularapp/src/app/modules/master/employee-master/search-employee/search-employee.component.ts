import {AfterViewInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort, Sort} from '@angular/material/sort';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {EmployeeService} from "../../../../service/employee.service";

@Component({
  selector: 'app-search-employee',
  templateUrl: './search-employee.component.html',
  styleUrls: ['./search-employee.component.css']
})
export class SearchEmployeeComponent implements OnInit {
  frm!: FormGroup;
  employees: any = [];
  dataSource!: MatTableDataSource<IEmployee>;
  displayedColumns: string[] = ['EMP_CODE', 'EMP_NAME', 'EMP_SEX', 'EMP_IC_NEW', 'EMP_IC_OLD', 'EMP_PASSPORT_NO', 'EMP_TOWN', 'action'];
  branchList: any = [];  
  constructor(private fb: FormBuilder, private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog, public service: EmployeeService, @Inject(MAT_DIALOG_DATA) public info: any, public dialogRef: MatDialogRef<SearchEmployeeComponent>) {
    console.log(info);

    this.frm = fb.group({
      BRANCH_ID: []
    });
    service.getEmployees(sessionStorage.getItem('username')!).subscribe((d: any) => {       
      // this.dataSource = new MatTableDataSource(d['employees']);
      // this.dataSource.sort = this.sort;
      // this.dataSource.paginator = this.paginator;
      this.branchList = d['branchList'];
    });

    // if (info) {
    this.frm.get("BRANCH_ID")?.setValue(info);
    this.branchChange(info);
    // }
  }

  ngOnInit(): void {

  }


  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

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

  selectEmp(element: any) {
    this.dialogRef.close(element);
  }

  branchChange(value: any) {

    this.service.getEmployeesByBranchId(value).subscribe((d: any) => {
      //this.employees = d;
      this.employees = d.map((e: any) => {
        return {
          ...e.Employee, // spread all employee fields
          EMPPAY_DATE_JOINED: e.EMPPAY_DATE_JOINED,
          EMPPAY_CATEGORY: e.EMPPAY_CATEGORY
        };
      });
      this.dataSource = new MatTableDataSource(d);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    })
    console.log(value);
  }
}

export interface IEmployee {
  EMP_CODE: string;
  EMP_NAME: string;
  EMP_SEX: string;
  EMP_IC_NEW: string;
  EMP_IC_OLD: string;
  EMP_PASSPORT_NO: string;
  EMP_TOWN: string;
  EMPPAY_DATE_JOINED: Date;
  EMPPAY_CATEGORY: string;
  EMP_ROLE:string;
}
