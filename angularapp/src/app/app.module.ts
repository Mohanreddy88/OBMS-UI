import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { CommonService } from './service/common.service';
import { MastermoduleService } from './service/mastermodule.service';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { PayrollModuleService } from './service/payrollmodule.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HashLocationStrategy, LocationStrategy,PathLocationStrategy } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { CustomLocationStrategy } from './service/CustomLocationStrategy';
import { AuthInterceptor } from './service/auth.interceptor';
import { MatSelectScrollDirective } from './shared/mat-select-scroll.directive';

@NgModule({
  declarations: [
    AppComponent,        
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [CommonService,MastermoduleService,PayrollModuleService,
    {provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
