import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort, Sort} from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';

export interface PeriodicElement {
  s_no: number;
  shift_name: string;
  start_time: string;
  end_time: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {s_no: 1, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'},
  {s_no: 2, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'},
  {s_no: 3, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'},
  {s_no: 4, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'},
  {s_no: 5, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'},
  {s_no: 6, shift_name: '8hrs-morning	', start_time: '8 AM', end_time: '4 AM'}
];
@Component({
  selector: 'app-shift-timings',
  templateUrl: './shift-timings.component.html',
  styleUrls: ['./shift-timings.component.css']
})
export class ShiftTimingsComponent implements AfterViewInit {



  displayedColumns: string[] = ['s_no', 'shift_name', 'start_time', 'end_time', 'action'];
  //dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog) {}



  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
}