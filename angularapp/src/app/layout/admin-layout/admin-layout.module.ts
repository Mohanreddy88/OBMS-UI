import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminLayoutRoutingModule } from './admin-layout-routing.module';
import { AdminLayoutComponent } from './admin-layout.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonService } from 'src/app/service/common.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    AdminLayoutRoutingModule,
    ComponentsModule,
    SharedModule,
    HttpClientModule
  ], 
  providers: [CommonService,MastermoduleService],
})
export class AdminLayoutModule { }
