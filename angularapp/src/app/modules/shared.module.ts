import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatListModule } from '@angular/material/list';
import { DateAdapter, MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LoginComponent } from './user/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { UserComponent } from './user/user.component';
import { MatTreeModule } from '@angular/material/tree';
import { BranchMasterComponent } from './master/branch-master/branch-master.component';
import { NewBranchComponent } from './master/branch-master/new-branch/new-branch.component';
import { ClientMasterComponent } from './master/client-master/client-master.component';
import { NewClientMasterComponent } from './master/client-master/new-client/new-client-master.component';
import { EmployeeMasterComponent } from './master/employee-master/employee-master.component';
import { NewEmployeeComponent } from './master/employee-master/new-employee/new-employee.component';
import { EmployeeTransferComponent } from './master/employee-transfer/employee-transfer.component';
import { ShiftTimingsComponent } from './master/shift-timings/shift-timings.component';
import { NewShiftTimingComponent } from './master/shift-timings/new-shift-timing/new-shift-timing.component';
import { EpfSlabComponent } from './master/epf-slab/epf-slab.component';
import { NewEpfSlabComponent } from './master/epf-slab/new-epf-slab/new-epf-slab.component';
import { SipSlabComponent } from './master/sip-slab/sip-slab.component';
import { NewSipSlabComponent } from './master/sip-slab/new-sip-slab/new-sip-slab.component';
import { IncomeTaxSlabComponent } from './master/income-tax-slab/income-tax-slab.component';
import { NewIncomeTaxSlabComponent } from './master/income-tax-slab/new-income-tax-slab/new-income-tax-slab.component';
import { LeaveSlabComponent } from './master/leave-slab/leave-slab.component';
import { SocsoSlabComponent } from './master/socso-slab/socso-slab.component';
import { NewSocsoSlabComponent } from './master/socso-slab/new-socso-slab/new-socso-slab.component';
import { SalarySlabComponent } from './master/salary-slab/salary-slab.component';
import { NewSalarySlabComponent } from './master/salary-slab/new-salary-slab/new-salary-slab.component';
import {SearchEmployeeComponent} from "./master/employee-master/search-employee/search-employee.component";
import { EmployeemonthlyadvanceComponent } from 'src/app/modules/payroll/employee-monthly-advance/employeemonthlyadvance.component';
import {BoldReportViewerModule } from  '@boldreports/angular-reporting-components';
import { NewEmployeeMonthlyAdvanceComponent } from './payroll/employee-monthly-advance/new-employee-monthly-advance/new-employee-monthly-advance.component';
import { PrintInvoiceComponent } from './finance/invoice/print-invoice/print-invoice.component';
// Report viewer
import '@boldreports/javascript-reporting-controls/Scripts/bold.report-viewer.min';

// data-visualization
import '@boldreports/javascript-reporting-controls/Scripts/data-visualization/ej.bulletgraph.min';
import '@boldreports/javascript-reporting-controls/Scripts/data-visualization/ej.chart.min';
import { NewEmployeeLoanComponent } from './payroll/employee-loan/new-employee-loan.component';
import { RegistrationComponent } from './user/rigistration/registration.component';
import { NewEmployeeUniformLoanComponent } from './payroll/employee-uniform-loan/new-employee-uniform-loan.component';
import { MiscTransctionsComponent } from './payroll/misc-transctions/misc-transctions.component';
import { NewMiscTransactionsComponent } from './payroll/misc-transctions/new-misc-transactions/new-misc-transactions.component';
import { UserRegistrationComponent } from './administration/user-registration/user-registration.component';
import { BankListComponent } from './administration/bank-list/bank-list.component';
import { NewBankListComponent } from './administration/bank-list/new-bank-list/new-bank-list.component';


import {NewAgreementTerminationComponent} from "./quotation-and-agreement/agreement-termination/new-agreement-termination/new-agreement-termination.component";
import {AgreementTerminationComponent} from "./quotation-and-agreement/agreement-termination/agreement-termination.component";
import {AgreementsDiscountReportComponent} from "./quotation-and-agreement/agreements-discount-report/agreements-discount-report.component";
import {AgreementsComponent} from "./quotation-and-agreement/agreements/agreements.component";
import {NewAgreementComponent} from "./quotation-and-agreement/agreements/new-agreement/new-agreement.component";
import { CategoryMasterComponent } from './inventory/category-master/category-master.component';
import {NewCatergoryComponent} from "./inventory/category-master/new-catergory/new-catergory.component";
import {ItemMasterComponent} from "./inventory/item-master/item-master.component";
import {NewItemComponent} from "./inventory/item-master/new-item/new-item.component";
import {AssetMasterComponent} from "./inventory/asset-master/asset-master.component";
import {NewAssetComponent} from "./inventory/asset-master/new-asset/new-asset.component";
import {SupplierMasterComponent} from "./inventory/supplier-master/supplier-master.component";
import {NewSupplierComponent} from "./inventory/supplier-master/new-supplier/new-supplier.component";
import {RecepientMasterComponent} from "./inventory/recepient-master/recepient-master.component";
import {NewRecepientComponent} from "./inventory/recepient-master/new-recepient/new-recepient.component";
import {UtilityBillsComponent} from "./inventory/utility-bills/utility-bills.component";
import {PurchaseBillsComponent} from "./inventory/purchase-bills/purchase-bills.component";
import {MaterialIssueComponent} from "./inventory/material-issue/material-issue.component";
import { BankMasterComponent } from './administration/bank-master/bank-master.component';
import { NewBankMasterComponent } from './administration/bank-master/new-bank-master/new-bank-master.component';
import { ChequeMasterComponent } from './administration/cheque-master/cheque-master.component';
import { NewChequeMasterComponent } from './administration/cheque-master/new-cheque-master/new-cheque-master.component';
import { NewEmployeeDailyAdvanceComponent } from './payroll/new-employee-daily-advance/new-employee-daily-advance.component';
import { UserAccessRightsComponent } from './administration/user-access-rights/user-access-rights.component';
import { NewUserAccessRightsComponent } from './administration/user-access-rights/new-user-access-rights/new-user-access-rights.component';
import { UserBranchAccessComponent } from './administration/user-branch-access/user-branch-access.component';
import { NewUserBranchAccessComponent } from './administration/user-branch-access/new-user-branch-access/new-user-branch-access.component';
import { UserBankAccessComponent } from './administration/user-bank-access/user-bank-access.component';
import { NewUserBankAccessComponent } from './administration/user-bank-access/new-user-bank-access/new-user-bank-access.component';
import { NewAttendanceComponent } from './payroll/attendance/new-attendance/new-attendance.component';

import { InvoiceComponent } from './finance/invoice/invoice.component';
import { BatchInvoiceComponent } from './finance/batch-invoice/batch-invoice.component';
import { InvoiceRecycleBinComponent } from './finance/invoice-recycle-bin/invoice-recycle-bin.component';
import { PaymentsComponent } from './finance/payments/payments.component';
import { PaymentsRecycleBinComponent } from './finance/payments-recycle-bin/payments-recycle-bin.component';
import { ReceiptsComponent } from './finance/receipts/receipts.component';
import { ChequeStatusComponent } from './finance/cheque-status/cheque-status.component';
// import { ChequeMasterComponent } from './finance/cheque-master/cheque-master.component';
import { LegalDemandActionComponent } from './finance/legal-demand-action/legal-demand-action.component';
import { NewLegalDemandActionComponent } from './finance/legal-demand-action/new-legal-demand-action/new-legal-demand-action.component';
import { NewReceiptComponent } from './finance/receipts/new-receipt/new-receipt.component';
import { SearchInvoiceComponent } from './finance/invoice/search-invoice/search-invoice.component';
import { EditInvoiceComponent } from './finance/invoice/edit-invoice/edit-invoice.component';
import { SearchPaymentsComponent } from './finance/payments/search-payments/search-payments.component';
import { CategorySearchComponent } from './finance/payments/search-payments/category-search/category-search.component';
import { SearchReceiptsComponent } from './finance/receipts/search-receipts/search-receipts.component';
import { FinanceChequeMasterComponent } from './finance/finance-cheque-master/finance-cheque-master.component';
import { SearchUtilityBillsComponent } from './inventory/utility-bills/search-utility-bills/search-utility-bills.component';
import { SearchPurchaseBillsComponent } from './inventory/purchase-bills/search-purchase-bills/search-purchase-bills.component';
import { SalaryProcessingComponent } from './payroll/salary-processing/salary-processing.component';
import { CustomDateAdapter } from '../service/CustomDateAdapter';
import { SearchMaterialIssueComponent } from './inventory/material-issue/search-material-issue/search-material-issue.component';
import { ReportComponent } from './report/report/report.component';
import { UserReportComponent } from './report/user-report/user-report.component';
import { EmployeeListComponent } from './report/master/employee-list/employee-list.component';
import { BranchReportComponent } from './report/master/branch-report/branch-report.component';
import { ClientMasterReportComponent } from './report/master/client-master-report/client-master-report.component';
import { KKDNComponent } from './report/master/kkdn/kkdn.component';
import { MonthlyAdvanceReportComponent } from './report/payroll/monthly-advance-report/monthly-advance-report.component';
import { HQStockLedgerComponent } from './report/inventory/hq-stock-ledger/hq-stock-ledger.component';
import { BranchStockLedgerComponent } from './report/inventory/branch-stock-ledger/branch-stock-ledger.component';
import { PaySheetComponent } from './report/payroll/pay-sheet/pay-sheet.component';
import { YearlyPaySheetComponent } from './report/payroll/yearly-pay-sheet/yearly-pay-sheet.component';
import { PayHistoryComponent } from './report/payroll/pay-history/pay-history.component';
import { PayslipReportComponent } from './report/payroll/payslip-report/payslip-report.component';
import { Payslip2ReportComponent } from './report/payroll/payslip2-report/payslip2-report.component';
import { Payslip3ReportComponent } from './report/payroll/payslip3-report/payslip3-report.component';
import { IncomeTaxFormComponent } from './report/payroll/income-tax-form/income-tax-form.component';
import { LeaveRegisterReportComponent } from './report/payroll/leave-register-report/leave-register-report.component';
import { LeaveApplicationFormComponent } from './report/payroll/leave-application-form/leave-application-form.component';
import { NetpayReportsComponent } from './report/payroll/netpay-reports/netpay-reports.component';
import { MiscTransactionReportComponent } from './report/payroll/misc-transaction-report/misc-transaction-report.component';
import { CheckroleReportComponent } from './report/payroll/checkrole-report/checkrole-report.component';
import { PaymentVoucherSummaryComponent } from './report/finance/payment-voucher-summary/payment-voucher-summary.component';
import { ReceiptVoucherSummaryComponent } from './report/finance/receipt-voucher-summary/receipt-voucher-summary.component';
import { BranchTransactionsComponent } from './report/finance/branch-transactions/branch-transactions.component';
import { BranchCollectionsComponent } from './report/finance/branch-collections/branch-collections.component';
import { ChequeStatusReportComponent } from './report/finance/cheque-status-report/cheque-status-report.component';
import { CreditNoteSummaryComponent } from './report/finance/credit-note-summary/credit-note-summary.component';
import { PasswordChangeComponent } from './user/password-change/password-change.component';
import { InvoiceCollectionStatusReportComponent } from './report/finance/invoice-collection-status-report/invoice-collection-status-report.component';
import { LoanLedgerReportComponent } from './report/payroll/loan-ledger-report/loan-ledger-report.component';
import { EpfStatementReportComponent } from './report/payroll/epf-statement-report/epf-statement-report.component';
import { SocsoStatementReportComponent } from './report/payroll/socso-statement-report/socso-statement-report.component';
import { SipStatementReportComponent } from './report/payroll/sip-statement-report/sip-statement-report.component';
import { BankSalaryStatementReportComponent } from './report/payroll/bank-salary-statement-report/bank-salary-statement-report.component';
import { BankSalaryStatement2ReportComponent } from './report/payroll/bank-salary-statement2-report/bank-salary-statement2-report.component';
import { ListSummaryReportComponent } from './report/payroll/list-summary-report/list-summary-report.component';
import { MonthlyInvoiceStatusComponent } from './report/finance/monthly-invoice-status/monthly-invoice-status.component';
import { DeletedInvoiceDetailsComponent } from './report/finance/deleted-invoice-details/deleted-invoice-details.component';
import { ClientStatementComponent } from './report/finance/client-statement/client-statement.component';
import { SupplierStatementComponent } from './report/finance/supplier-statement/supplier-statement.component';
import { InvoiceAgeingComponent } from './report/finance/invoice-ageing/invoice-ageing.component';
import { ProfitAndLossComponent } from './report/finance/profit-and-loss/profit-and-loss.component';
import { InvoiceReportComponent } from './report/finance/invoice-report/invoice-report.component';
import { UniformLoanReportComponent } from './payroll/employee-uniform-loan/uniform-loan-report/uniform-loan-report.component';
import { DailyAdvanceVoucherReportComponent } from './payroll/new-employee-daily-advance/daily-advance-voucher-report/daily-advance-voucher-report.component';
import { LoanVoucherReportComponent } from './payroll/employee-loan/loan-voucher-report/loan-voucher-report.component';
import { AccountingProfitAndLossComponent } from './report/accounting/accounting-profit-and-loss/accounting-profit-and-loss.component';
import { BalanceSheetReportComponent } from './report/accounting/balance-sheet-report/balance-sheet-report.component';
import { TrailBalanceReportComponent } from './report/accounting/trail-balance-report/trail-balance-report.component';
import { BankReconciliationReportComponent } from './report/accounting/bank-reconciliation-report/bank-reconciliation-report.component';
import { GeneralLedgerReportComponent } from './report/accounting/general-ledger-report/general-ledger-report.component';
import { AccGlDataListComponent } from './Accounting/acc-gl-data-list/acc-gl-data-list.component';
import { PrintInvoiceComputerGeneratedComponent } from './finance/invoice/print-invoice-computer-generated/print-invoice-computer-generated.component';
import { PrintVoucherReportComponent } from './finance/payments/print-voucher-report/print-voucher-report.component';
import { ReceiptVoucherReportComponent } from './finance/receipts/receipt-voucher-report/receipt-voucher-report.component';
import { EmployeeHistoryComponent } from './master/employee-history/employee-history.component';
import { SearchEmployeeLoanComponent } from './payroll/employee-loan/search-employee-loan/search-employee-loan.component';
import { SearchEmployeeUniformLoanComponent } from './payroll/employee-uniform-loan/search-employee-uniform-loan/search-employee-uniform-loan.component';
import { MatSelectScrollDirective } from '../shared/mat-select-scroll.directive';



@NgModule({
  declarations: [
    PasswordChangeComponent,
    LoginComponent,
    DashboardComponent,
    SpinnerComponent,
    UserComponent,
    BranchMasterComponent,
    NewBranchComponent,
    ClientMasterComponent,
    NewClientMasterComponent,
    EmployeeMasterComponent,
    NewEmployeeComponent,
    EmployeeTransferComponent,
    ShiftTimingsComponent,
    NewShiftTimingComponent,
    EpfSlabComponent,
    NewEpfSlabComponent,
    SipSlabComponent,
    NewSipSlabComponent,
    IncomeTaxSlabComponent,
    NewClientMasterComponent,
    IncomeTaxSlabComponent,
    NewIncomeTaxSlabComponent,
    LeaveSlabComponent,
    SocsoSlabComponent,
    NewSocsoSlabComponent,
    SalarySlabComponent,
    NewSalarySlabComponent,
    SearchEmployeeComponent,
    EmployeemonthlyadvanceComponent,
    NewEmployeeMonthlyAdvanceComponent,
    NewEmployeeLoanComponent,
    RegistrationComponent,
    NewEmployeeUniformLoanComponent,
    MiscTransctionsComponent,
    NewMiscTransactionsComponent,

    SearchEmployeeComponent,
    AgreementsComponent,
    NewAgreementComponent,
    AgreementsDiscountReportComponent,
    AgreementTerminationComponent,
    NewAgreementTerminationComponent,
    CategoryMasterComponent,
    NewCatergoryComponent,
    ItemMasterComponent,
    NewItemComponent,
    AssetMasterComponent,
    NewAssetComponent,
    SupplierMasterComponent,
    NewSupplierComponent,
    RecepientMasterComponent,
    NewRecepientComponent,
    UtilityBillsComponent,
    PurchaseBillsComponent,
    MaterialIssueComponent,
    NewMiscTransactionsComponent,
    UserRegistrationComponent,
    BankListComponent,
    NewBankListComponent,
    BankMasterComponent,
    NewBankMasterComponent,
    ChequeMasterComponent,
    NewChequeMasterComponent,
    NewEmployeeDailyAdvanceComponent,
    UserAccessRightsComponent,
    NewUserAccessRightsComponent,
    UserBranchAccessComponent,
    NewUserBranchAccessComponent,
    UserBankAccessComponent,
    NewUserBankAccessComponent,

    InvoiceComponent,
    BatchInvoiceComponent,
    InvoiceRecycleBinComponent,
    PaymentsComponent,
    PaymentsRecycleBinComponent,
    ReceiptsComponent,
    ChequeStatusComponent,
    LegalDemandActionComponent,
    NewLegalDemandActionComponent,
    NewReceiptComponent,
    SearchInvoiceComponent,
    EditInvoiceComponent,
    SearchPaymentsComponent,
    CategorySearchComponent,
    SearchReceiptsComponent,
    NewUserBankAccessComponent,
    NewAttendanceComponent,
    FinanceChequeMasterComponent,
    SearchUtilityBillsComponent,
    SearchPurchaseBillsComponent,
    SalaryProcessingComponent,
    SearchMaterialIssueComponent,
    PrintInvoiceComponent,
    ReportComponent,
    UserReportComponent,
    EmployeeListComponent,
    BranchReportComponent,
    ClientMasterReportComponent,
    KKDNComponent,
    MonthlyAdvanceReportComponent,
    HQStockLedgerComponent,
    BranchStockLedgerComponent,
    PaySheetComponent,
    YearlyPaySheetComponent,
    PayHistoryComponent,
    PayslipReportComponent,
    Payslip2ReportComponent,
    Payslip3ReportComponent,
    IncomeTaxFormComponent,
    LeaveRegisterReportComponent,
    LeaveApplicationFormComponent,
    NetpayReportsComponent,
    MiscTransactionReportComponent,
    CheckroleReportComponent,
    PaymentVoucherSummaryComponent,
    ReceiptVoucherSummaryComponent,
    BranchTransactionsComponent,
    BranchCollectionsComponent,
    ChequeStatusReportComponent,
    CreditNoteSummaryComponent,
    InvoiceCollectionStatusReportComponent,
    CreditNoteSummaryComponent,
    LoanLedgerReportComponent,
    EpfStatementReportComponent,
    SocsoStatementReportComponent,
    SipStatementReportComponent,
    BankSalaryStatementReportComponent,
    BankSalaryStatement2ReportComponent,
    ListSummaryReportComponent,
    MonthlyInvoiceStatusComponent,
    DeletedInvoiceDetailsComponent,
    ClientStatementComponent,
    SupplierStatementComponent,
    InvoiceAgeingComponent,
    ProfitAndLossComponent,
    InvoiceReportComponent,
    UniformLoanReportComponent,
    DailyAdvanceVoucherReportComponent,
    LoanVoucherReportComponent,
    AccountingProfitAndLossComponent,
    BalanceSheetReportComponent,
    TrailBalanceReportComponent,
    BankReconciliationReportComponent,
    GeneralLedgerReportComponent,
    AccGlDataListComponent,
    PrintInvoiceComputerGeneratedComponent,
    PrintVoucherReportComponent,
    ReceiptVoucherReportComponent,
    EmployeeHistoryComponent,    
    SearchEmployeeLoanComponent, 
    SearchEmployeeUniformLoanComponent,
    MatSelectScrollDirective

  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterModule,
    MatSortModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    NgApexchartsModule,
    MatTreeModule,
    BoldReportViewerModule,
  ],
  exports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterModule,
    MatSortModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    NgApexchartsModule,
    MatTreeModule,
    MatSelectScrollDirective
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
    // ,
    // { provide: DateAdapter, useClass: CustomDateAdapter },
    // { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FORMATS }
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule
    };
  }
}
