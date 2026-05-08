import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirmation',
  templateUrl: './dialog-confirmation.component.html',
  styleUrls: ['./dialog-confirmation.component.css']
})
export class DialogConfirmationComponent implements OnInit {
  frm: FormGroup;
  showRemarks = false;
  message = 'Are you sure you want to delete this Item?';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogConfirmationComponent>
  ) {
    this.frm = this.fb.group({
      DeletionRemarks: ['', Validators.required]
    });

    if (data) {
      this.showRemarks = data.showRemarks ?? false;
      this.message = data.message ?? this.message;
    }
  }

  closeDialog(): void {
    this.dialogRef.close({
      confirmDialog: false,
      remarks: null
    });
  }
  confirmDialog(): void {
    const remarks = this.showRemarks ? this.frm.value.DeletionRemarks : null;
    this.dialogRef.close({
      confirmDialog: true,
      remarks: remarks
    });
  }

  ngOnInit(): void {
  }

}
