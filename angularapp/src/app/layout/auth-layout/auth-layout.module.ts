import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthLayoutRoutingModule } from './auth-layout-routing.module';
import { AuthLayoutComponent } from './auth-layout.component';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonService } from 'src/app/service/common.service';
import { HttpClientModule } from '@angular/common/http';



@NgModule({
  declarations: [
    AuthLayoutComponent
  ],
  imports: [
    CommonModule,
    AuthLayoutRoutingModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [CommonService]
})
export class AuthLayoutModule { }
