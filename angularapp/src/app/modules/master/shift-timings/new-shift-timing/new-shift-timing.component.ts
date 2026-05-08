import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-new-shift-timing',
  templateUrl: './new-shift-timing.component.html',
  styleUrls: ['./new-shift-timing.component.css']
})
export class NewShiftTimingComponent implements OnInit {

  frm!: FormGroup;
  shiftTitleStatus: string = 'new';
  constructor( private fb: FormBuilder,public dialog: MatDialog) {
    this.frm = this.fb.group({
      shift_name: [''],
      timing_from: [''],
      timing_to: [''],
    });
  }

  ngOnInit(): void {
  }

}
