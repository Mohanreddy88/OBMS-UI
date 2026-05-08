// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { twoDecimalPlacesValidator } from '../shared/validators/custom-validators';
import { ForceSelectBelowDirective } from './force-select-below.directive';

@NgModule({
  declarations: [
    ForceSelectBelowDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [
    // Export validator function if needed
    { provide: 'twoDecimalPlacesValidator', useValue: twoDecimalPlacesValidator }
  ]
})
export class SharedModule { }
