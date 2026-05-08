import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SharedModule } from '../modules/shared.module';
import { AlertComponent } from './alert/alert.component';
import { MessageComponent } from './message/message.component';
import { DialogConfirmationComponent } from './dialog-confirmation/dialog-confirmation.component';


// import {
//   MAT_SNACK_BAR_DATA
// } from "@angular/material/snack-bar";

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AlertComponent,
    MessageComponent,
    DialogConfirmationComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent
  ],
  // entryComponents: [
  //   MessageComponent
  // ],
  //providers: [ { provide: MAT_SNACK_BAR_DATA, useValue: {} }],

})
export class ComponentsModule { }
