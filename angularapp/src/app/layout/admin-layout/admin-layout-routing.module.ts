import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'src/app/modules/dashboard/dashboard.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { BranchMasterComponent } from 'src/app/modules/master/branch-master/branch-master.component';
import { NewBranchComponent } from 'src/app/modules/master/branch-master/new-branch/new-branch.component';
import { ClientMasterComponent } from 'src/app/modules/master/client-master/client-master.component';
import { NewClientMasterComponent } from 'src/app/modules/master/client-master/new-client/new-client-master.component';
import { EmployeeMasterComponent } from 'src/app/modules/master/employee-master/employee-master.component';
import { NewEmployeeComponent } from 'src/app/modules/master/employee-master/new-employee/new-employee.component';
import { EmployeeTransferComponent } from 'src/app/modules/master/employee-transfer/employee-transfer.component';
import { ShiftTimingsComponent } from 'src/app/modules/master/shift-timings/shift-timings.component';
import { NewShiftTimingComponent } from 'src/app/modules/master/shift-timings/new-shift-timing/new-shift-timing.component';
import { EpfSlabComponent } from 'src/app/modules/master/epf-slab/epf-slab.component';
import { NewEpfSlabComponent } from 'src/app/modules/master/epf-slab/new-epf-slab/new-epf-slab.component';
import { SipSlabComponent } from 'src/app/modules/master/sip-slab/sip-slab.component';
import { NewSipSlabComponent } from 'src/app/modules/master/sip-slab/new-sip-slab/new-sip-slab.component';
import { NewIncomeTaxSlabComponent } from 'src/app/modules/master/income-tax-slab/new-income-tax-slab/new-income-tax-slab.component';
import { LeaveSlabComponent } from 'src/app/modules/master/leave-slab/leave-slab.component';
import { SocsoSlabComponent } from 'src/app/modules/master/socso-slab/socso-slab.component';
import { NewSocsoSlabComponent } from 'src/app/modules/master/socso-slab/new-socso-slab/new-socso-slab.component';
import { SalarySlabComponent } from 'src/app/modules/master/salary-slab/salary-slab.component';
import { NewSalarySlabComponent } from 'src/app/modules/master/salary-slab/new-salary-slab/new-salary-slab.component';
import { IncomeTaxSlabComponent } from '../../modules/master/income-tax-slab/income-tax-slab.component';
import { AgreementsComponent } from "../../modules/quotation-and-agreement/agreements/agreements.component";
import { AgreementsDiscountReportComponent } from "../../modules/quotation-and-agreement/agreements-discount-report/agreements-discount-report.component";
import { AgreementTerminationComponent } from "../../modules/quotation-and-agreement/agreement-termination/agreement-termination.component";
import { NewAgreementTerminationComponent } from "../../modules/quotation-and-agreement/agreement-termination/new-agreement-termination/new-agreement-termination.component";
import { NewAgreementComponent } from "../../modules/quotation-and-agreement/agreements/new-agreement/new-agreement.component";
import { AssetMasterComponent } from "../../modules/inventory/asset-master/asset-master.component";
import { NewAssetComponent } from "../../modules/inventory/asset-master/new-asset/new-asset.component";
import { CategoryMasterComponent } from "../../modules/inventory/category-master/category-master.component";
import { NewCatergoryComponent } from "../../modules/inventory/category-master/new-catergory/new-catergory.component";
import { ItemMasterComponent } from "../../modules/inventory/item-master/item-master.component";
import { NewItemComponent } from "../../modules/inventory/item-master/new-item/new-item.component";
import { SupplierMasterComponent } from "../../modules/inventory/supplier-master/supplier-master.component";
import { NewSupplierComponent } from "../../modules/inventory/supplier-master/new-supplier/new-supplier.component";
import { RecepientMasterComponent } from "../../modules/inventory/recepient-master/recepient-master.component";
import { NewRecepientComponent } from "../../modules/inventory/recepient-master/new-recepient/new-recepient.component";
import { PurchaseBillsComponent } from "../../modules/inventory/purchase-bills/purchase-bills.component";
import { MaterialIssueComponent } from "../../modules/inventory/material-issue/material-issue.component";
import { EmployeemonthlyadvanceComponent } from 'src/app/modules/payroll/employee-monthly-advance/employeemonthlyadvance.component';
import { NewEmployeeMonthlyAdvanceComponent } from 'src/app/modules/payroll/employee-monthly-advance/new-employee-monthly-advance/new-employee-monthly-advance.component';
import { NewEmployeeLoanComponent } from 'src/app/modules/payroll/employee-loan/new-employee-loan.component';
import { NewEmployeeDailyAdvanceComponent } from 'src/app/modules/payroll/new-employee-daily-advance/new-employee-daily-advance.component';
import { NewEmployeeUniformLoanComponent } from 'src/app/modules/payroll/employee-uniform-loan/new-employee-uniform-loan.component';
import { MiscTransctionsComponent } from 'src/app/modules/payroll/misc-transctions/misc-transctions.component';
import { NewMiscTransactionsComponent } from 'src/app/modules/payroll/misc-transctions/new-misc-transactions/new-misc-transactions.component';
import { UserRegistrationComponent } from 'src/app/modules/administration/user-registration/user-registration.component';
import { BankListComponent } from 'src/app/modules/administration/bank-list/bank-list.component';
import { NewBankListComponent } from 'src/app/modules/administration/bank-list/new-bank-list/new-bank-list.component';
import { BankMasterComponent } from 'src/app/modules/administration/bank-master/bank-master.component';
import { NewBankMasterComponent } from 'src/app/modules/administration/bank-master/new-bank-master/new-bank-master.component';
import { NewChequeMasterComponent } from 'src/app/modules/administration/cheque-master/new-cheque-master/new-cheque-master.component';
import { ChequeMasterComponent } from 'src/app/modules/administration/cheque-master/cheque-master.component';
import { UserAccessRightsComponent } from 'src/app/modules/administration/user-access-rights/user-access-rights.component';
import { NewUserAccessRightsComponent } from 'src/app/modules/administration/user-access-rights/new-user-access-rights/new-user-access-rights.component';
import { UserBranchAccessComponent } from 'src/app/modules/administration/user-branch-access/user-branch-access.component';
import { NewUserBranchAccessComponent } from 'src/app/modules/administration/user-branch-access/new-user-branch-access/new-user-branch-access.component';
import { UserBankAccessComponent } from 'src/app/modules/administration/user-bank-access/user-bank-access.component';
import { NewUserBankAccessComponent } from 'src/app/modules/administration/user-bank-access/new-user-bank-access/new-user-bank-access.component';
import { NewLegalDemandActionComponent } from "../../modules/finance/legal-demand-action/new-legal-demand-action/new-legal-demand-action.component";
import { LegalDemandActionComponent } from "../../modules/finance/legal-demand-action/legal-demand-action.component";
import { ChequeStatusComponent } from "../../modules/finance/cheque-status/cheque-status.component";
import { NewReceiptComponent } from "../../modules/finance/receipts/new-receipt/new-receipt.component";
import { ReceiptsComponent } from "../../modules/finance/receipts/receipts.component";
import { PaymentsRecycleBinComponent } from "../../modules/finance/payments-recycle-bin/payments-recycle-bin.component";
import { PaymentsComponent } from "../../modules/finance/payments/payments.component";
import { InvoiceRecycleBinComponent } from "../../modules/finance/invoice-recycle-bin/invoice-recycle-bin.component";
import { BatchInvoiceComponent } from "../../modules/finance/batch-invoice/batch-invoice.component";
import { InvoiceComponent } from "../../modules/finance/invoice/invoice.component";
import { NewAttendanceComponent } from 'src/app/modules/payroll/attendance/new-attendance/new-attendance.component';
import { UtilityBillsComponent } from "../../modules/inventory/utility-bills/utility-bills.component";
import { FinanceChequeMasterComponent } from "../../modules/finance/finance-cheque-master/finance-cheque-master.component";
import { SalaryProcessingComponent } from 'src/app/modules/payroll/salary-processing/salary-processing.component';
import { PrintInvoiceComponent } from "../../modules/finance/invoice/print-invoice/print-invoice.component";
import { ReportComponent } from "../../modules/report/report/report.component";
import { UserReportComponent } from "../../modules/report/user-report/user-report.component";
import { EmployeeListComponent } from "../../modules/report/master/employee-list/employee-list.component";
import { BranchReportComponent } from "../../modules/report/master/branch-report/branch-report.component";
import { ClientMasterReportComponent } from 'src/app/modules/report/master/client-master-report/client-master-report.component';
import { KKDNComponent } from 'src/app/modules/report/master/kkdn/kkdn.component';
import { MonthlyAdvanceReportComponent } from 'src/app/modules/report/payroll/monthly-advance-report/monthly-advance-report.component';
import { HQStockLedgerComponent } from "../../modules/report/inventory/hq-stock-ledger/hq-stock-ledger.component";
import { BranchStockLedgerComponent } from "../../modules/report/inventory/branch-stock-ledger/branch-stock-ledger.component";
import { PaySheetComponent } from "../../modules/report/payroll/pay-sheet/pay-sheet.component";
import { YearlyPaySheetComponent } from "../../modules/report/payroll/yearly-pay-sheet/yearly-pay-sheet.component";
import { PayHistoryComponent } from "../../modules/report/payroll/pay-history/pay-history.component";
import { PayslipReportComponent } from 'src/app/modules/report/payroll/payslip-report/payslip-report.component';
import { Payslip2ReportComponent } from 'src/app/modules/report/payroll/payslip2-report/payslip2-report.component';
import { Payslip3ReportComponent } from 'src/app/modules/report/payroll/payslip3-report/payslip3-report.component';
import { IncomeTaxFormComponent } from 'src/app/modules/report/payroll/income-tax-form/income-tax-form.component';
import { LeaveRegisterReportComponent } from 'src/app/modules/report/payroll/leave-register-report/leave-register-report.component';
import { LeaveApplicationFormComponent } from 'src/app/modules/report/payroll/leave-application-form/leave-application-form.component';
import { NetpayReportsComponent } from 'src/app/modules/report/payroll/netpay-reports/netpay-reports.component';
import { MiscTransactionReportComponent } from 'src/app/modules/report/payroll/misc-transaction-report/misc-transaction-report.component';
import { CheckroleReportComponent } from 'src/app/modules/report/payroll/checkrole-report/checkrole-report.component';
import { PaymentVoucherSummaryComponent } from "../../modules/report/finance/payment-voucher-summary/payment-voucher-summary.component";
import { ReceiptVoucherSummaryComponent } from "../../modules/report/finance/receipt-voucher-summary/receipt-voucher-summary.component";
import { BranchTransactionsComponent } from "../../modules/report/finance/branch-transactions/branch-transactions.component";
import { BranchCollectionsComponent } from "../../modules/report/finance/branch-collections/branch-collections.component";
import { ChequeStatusReportComponent } from "../../modules/report/finance/cheque-status-report/cheque-status-report.component";
import { CreditNoteSummaryComponent } from "../../modules/report/finance/credit-note-summary/credit-note-summary.component";
import { AuthGuard } from 'src/app/service/auth.guard';
import { LoanLedgerReportComponent } from 'src/app/modules/report/payroll/loan-ledger-report/loan-ledger-report.component';
import { EpfStatementReportComponent } from 'src/app/modules/report/payroll/epf-statement-report/epf-statement-report.component';
import { SocsoStatementReportComponent } from 'src/app/modules/report/payroll/socso-statement-report/socso-statement-report.component';
import { SipStatementReportComponent } from 'src/app/modules/report/payroll/sip-statement-report/sip-statement-report.component';
import { BankSalaryStatementReportComponent } from 'src/app/modules/report/payroll/bank-salary-statement-report/bank-salary-statement-report.component';
import { BankSalaryStatement2ReportComponent } from 'src/app/modules/report/payroll/bank-salary-statement2-report/bank-salary-statement2-report.component';
import { ListSummaryReportComponent } from 'src/app/modules/report/payroll/list-summary-report/list-summary-report.component';
import { InvoiceCollectionStatusReportComponent } from "../../modules/report/finance/invoice-collection-status-report/invoice-collection-status-report.component";
import { MonthlyInvoiceStatusComponent } from "../../modules/report/finance/monthly-invoice-status/monthly-invoice-status.component";
import { DeletedInvoiceDetailsComponent } from "../../modules/report/finance/deleted-invoice-details/deleted-invoice-details.component";
import { ClientStatementComponent } from "../../modules/report/finance/client-statement/client-statement.component";
import { SupplierStatementComponent } from "../../modules/report/finance/supplier-statement/supplier-statement.component";
import { InvoiceAgeingComponent } from "../../modules/report/finance/invoice-ageing/invoice-ageing.component";
import { ProfitAndLossComponent } from 'src/app/modules/report/finance/profit-and-loss/profit-and-loss.component';
import { InvoiceReportComponent } from 'src/app/modules/report/finance/invoice-report/invoice-report.component';
import { SearchReceiptsComponent } from 'src/app/modules/finance/receipts/search-receipts/search-receipts.component';
import { SearchPaymentsComponent } from 'src/app/modules/finance/payments/search-payments/search-payments.component';
import { UniformLoanReportComponent } from 'src/app/modules/payroll/employee-uniform-loan/uniform-loan-report/uniform-loan-report.component';
import { DailyAdvanceVoucherReportComponent } from 'src/app/modules/payroll/new-employee-daily-advance/daily-advance-voucher-report/daily-advance-voucher-report.component';
import { LoanVoucherReportComponent } from 'src/app/modules/payroll/employee-loan/loan-voucher-report/loan-voucher-report.component';
import { AccountingProfitAndLossComponent } from 'src/app/modules/report/accounting/accounting-profit-and-loss/accounting-profit-and-loss.component';
import { BalanceSheetReportComponent } from 'src/app/modules/report/accounting/balance-sheet-report/balance-sheet-report.component';
import { TrailBalanceReportComponent } from 'src/app/modules/report/accounting/trail-balance-report/trail-balance-report.component';
import { BankReconciliationReportComponent } from 'src/app/modules/report/accounting/bank-reconciliation-report/bank-reconciliation-report.component';
import { GeneralLedgerReportComponent } from 'src/app/modules/report/accounting/general-ledger-report/general-ledger-report.component';
import { AccGlDataListComponent } from 'src/app/modules/Accounting/acc-gl-data-list/acc-gl-data-list.component';
import { PrintInvoiceComputerGeneratedComponent } from 'src/app/modules/finance/invoice/print-invoice-computer-generated/print-invoice-computer-generated.component';
import { PrintVoucherReportComponent } from 'src/app/modules/finance/payments/print-voucher-report/print-voucher-report.component';
import { ReceiptVoucherReportComponent } from 'src/app/modules/finance/receipts/receipt-voucher-report/receipt-voucher-report.component';
import { EmployeeHistoryComponent } from 'src/app/modules/master/employee-history/employee-history.component';
import { SearchEmployeeLoanComponent } from 'src/app/modules/payroll/employee-loan/search-employee-loan/search-employee-loan.component';
import { SearchEmployeeUniformLoanComponent } from 'src/app/modules/payroll/employee-uniform-loan/search-employee-uniform-loan/search-employee-uniform-loan.component';
import { CategorySearchComponent } from 'src/app/modules/finance/payments/search-payments/category-search/category-search.component';
import { SearchUtilityBillsComponent } from 'src/app/modules/inventory/utility-bills/search-utility-bills/search-utility-bills.component';

const routes: Routes = [
  // { path: '', component: AdminLayoutComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

   //Master module
  { path: 'master/branch-master', component: BranchMasterComponent, canActivate: [AuthGuard] },
  { path: 'master/branch-master/new-branch', component: NewBranchComponent, canActivate: [AuthGuard] }, 
  { path: 'master/client-master', component: ClientMasterComponent, canActivate: [AuthGuard] },
  { path: 'master/client-master/new-client', component: NewClientMasterComponent, canActivate: [AuthGuard] },
  { path: 'master/employee-master', component: EmployeeMasterComponent, canActivate: [AuthGuard] },
  { path: 'master/employee-master/new-employee', component: NewEmployeeComponent, canActivate: [AuthGuard] },
  { path: 'master/employee-master/edit-employee/:EMP_ID', component: NewEmployeeComponent, canActivate: [AuthGuard] },
  { path: 'master/employee-transfer', component: EmployeeTransferComponent, canActivate: [AuthGuard] },
  { path: 'master/shift-timings', component: ShiftTimingsComponent, canActivate: [AuthGuard] },
  { path: 'master/shift-timings/new-shift-timing', component: NewShiftTimingComponent, canActivate: [AuthGuard] },
  { path: 'master/epf-slab', component: EpfSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/epf-slab/new-epf-slab', component: NewEpfSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/sip-slab', component: SipSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/sip-slab/new-sip-slab', component: NewSipSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/salary-slab', component: SalarySlabComponent, canActivate: [AuthGuard] },
  { path: 'master/salary-slab/new-salary-slab', component: NewSalarySlabComponent, canActivate: [AuthGuard] },
  { path: 'master/income-tax-slab/new-income-tax-slab', component: NewIncomeTaxSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/leave-slab', component: LeaveSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/socso-slab', component: SocsoSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/socso-slab/new-socso-slab', component: NewSocsoSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/income-tax-slab', component: IncomeTaxSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/income-tax-slab/new-income-tax-slab', component: NewIncomeTaxSlabComponent, canActivate: [AuthGuard] },
  { path: 'master/employee-history', component: EmployeeHistoryComponent, canActivate: [AuthGuard] },

  //Quotation and agreement module
  { path: 'quotation-and-agreement/agreements', component: AgreementsComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreements-discount-report', component: AgreementsDiscountReportComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreement-termination', component: AgreementTerminationComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreement-termination/new-agreement-termination', component: NewAgreementTerminationComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreement-termination/edit-agreement-termination/:ID', component: NewAgreementTerminationComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreements/new-agreement', component: NewAgreementComponent, canActivate: [AuthGuard] },
  { path: 'quotation-and-agreement/agreements/edit-agreement/:ID', component: NewAgreementComponent, canActivate: [AuthGuard] },

  //Inventory module
  { path: 'inventory/asset-master', component: AssetMasterComponent, canActivate: [AuthGuard] },
  { path: 'inventory/asset-master/new-asset', component: NewAssetComponent, canActivate: [AuthGuard] },
  { path: 'inventory/asset-master/new-asset/:ID', component: NewAssetComponent, canActivate: [AuthGuard] },
  { path: 'inventory/category-master', component: CategoryMasterComponent, canActivate: [AuthGuard] },
  { path: 'inventory/category-master/new-category', component: NewCatergoryComponent, canActivate: [AuthGuard] },
  { path: 'inventory/category-master/new-category/:ID', component: NewCatergoryComponent, canActivate: [AuthGuard] },
  { path: 'inventory/item-master', component: ItemMasterComponent, canActivate: [AuthGuard] },
  { path: 'inventory/item-master/new-item', component: NewItemComponent, canActivate: [AuthGuard] },
  { path: 'inventory/item-master/new-item/:ID', component: NewItemComponent, canActivate: [AuthGuard] },
  { path: 'inventory/supplier-master', component: SupplierMasterComponent, canActivate: [AuthGuard] },
  { path: 'inventory/supplier-master/new-supplier', component: NewSupplierComponent, canActivate: [AuthGuard] },
  { path: 'inventory/supplier-master/new-supplier/:ID', component: NewSupplierComponent, canActivate: [AuthGuard] },
  { path: 'inventory/recepient-master', component: RecepientMasterComponent, canActivate: [AuthGuard] },
  { path: 'inventory/recepient-master/new-recepient', component: NewRecepientComponent, canActivate: [AuthGuard] },
  { path: 'inventory/recepient-master/new-recepient/:ID', component: NewRecepientComponent, canActivate: [AuthGuard] },
  { path: 'inventory/utility-bills', component: UtilityBillsComponent, canActivate: [AuthGuard] },
  { path: 'inventory/purchase-bills', component: PurchaseBillsComponent, canActivate: [AuthGuard] },
  { path: 'inventory/material-issue', component: MaterialIssueComponent, canActivate: [AuthGuard] },

  //Payroll module
  { path: 'payroll/employee-monthly-advance', component: EmployeemonthlyadvanceComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-employee-monthly-advance', component: NewEmployeeMonthlyAdvanceComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-employee-daily-advance', component: NewEmployeeDailyAdvanceComponent, canActivate: [AuthGuard] },
  { path: 'payroll/daily-advance-voucher-report', component: DailyAdvanceVoucherReportComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-employee-loan', component: NewEmployeeLoanComponent, canActivate: [AuthGuard] },
  { path: 'payroll/loan-voucher-report', component: LoanVoucherReportComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-employee-uniform-loan', component: NewEmployeeUniformLoanComponent, canActivate: [AuthGuard] },
  { path: 'payroll/uniform-loan-report', component: UniformLoanReportComponent, canActivate: [AuthGuard] },
  { path: 'payroll/misc-transactions', component: MiscTransctionsComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-misc-transactions', component: NewMiscTransactionsComponent, canActivate: [AuthGuard] },
  { path: 'payroll/new-attendance', component: NewAttendanceComponent, canActivate: [AuthGuard] },
  { path: 'payroll/salary-processing', component: SalaryProcessingComponent, canActivate: [AuthGuard] },
  { path: 'payroll/search-employee-loan', component: SearchEmployeeLoanComponent, canActivate: [AuthGuard] },
  { path: 'payroll/search-employee-uniform-loan', component: SearchEmployeeUniformLoanComponent, canActivate: [AuthGuard] },

  //Administration module
  { path: 'administration/user-registration', component: UserRegistrationComponent, canActivate: [AuthGuard] },
  { path: 'administration/bank-list', component: BankListComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-bank-list', component: NewBankListComponent, canActivate: [AuthGuard] },
  { path: 'administration/bank-master', component: BankMasterComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-bank-master', component: NewBankMasterComponent, canActivate: [AuthGuard] },
  { path: 'administration/cheque-master', component: ChequeMasterComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-cheque-master', component: NewChequeMasterComponent, canActivate: [AuthGuard] },
  { path: 'administration/user-access-rights', component: UserAccessRightsComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-user-access-rights', component: NewUserAccessRightsComponent, canActivate: [AuthGuard] },
  { path: 'administration/user-branch-access', component: UserBranchAccessComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-user-branch-access', component: NewUserBranchAccessComponent, canActivate: [AuthGuard] },
  { path: 'administration/user-bank-access', component: UserBankAccessComponent, canActivate: [AuthGuard] },
  { path: 'administration/new-user-bank-access', component: NewUserBankAccessComponent, canActivate: [AuthGuard] },

  //Finance module
  { path: 'finance/invoice', component: InvoiceComponent, canActivate: [AuthGuard] },
  { path: 'finance/batch-invoice', component: BatchInvoiceComponent, canActivate: [AuthGuard] },
  { path: 'finance/invoice-recycle-bin', component: InvoiceRecycleBinComponent, canActivate: [AuthGuard] },
  { path: 'finance/payments', component: PaymentsComponent, canActivate: [AuthGuard] },
  { path: 'finance/search-payments', component: SearchPaymentsComponent, canActivate: [AuthGuard] },
  { path: 'finance/payments-recycle-bin', component: PaymentsRecycleBinComponent, canActivate: [AuthGuard] },
  { path: 'finance/receipts', component: ReceiptsComponent, canActivate: [AuthGuard] },
  { path: 'finance/receipts/new-receipt', component: NewReceiptComponent, canActivate: [AuthGuard] },
  { path: 'finance/receipts/search-receipt', component: SearchReceiptsComponent, canActivate: [AuthGuard] },
  { path: 'finance/cheque-status', component: ChequeStatusComponent, canActivate: [AuthGuard] },
  { path: 'finance/cheque-master', component: FinanceChequeMasterComponent, canActivate: [AuthGuard] },
  { path: 'finance/legal-demand-action', component: LegalDemandActionComponent, canActivate: [AuthGuard] },
  { path: 'finance/legal-demand-action/new-legal-demand-action', component: NewLegalDemandActionComponent, canActivate: [AuthGuard] },
  { path: 'finance/legal-demand-action/new-legal-demand-action/:ID', component: NewLegalDemandActionComponent, canActivate: [AuthGuard] },
  { path: 'finance/invoice/print-invoice', component: PrintInvoiceComponent, canActivate: [AuthGuard] },
  { path: 'finance/category-search', component: CategorySearchComponent, canActivate: [AuthGuard] },
  { path: 'finance/utility-search', component: SearchUtilityBillsComponent, canActivate: [AuthGuard] },


  //Master Report
  { path: 'report/:ReportName', component: ReportComponent, canActivate: [AuthGuard] },
  { path: 'master/report/branch-report', component: BranchReportComponent, canActivate: [AuthGuard] },
  { path: 'master/report/employee-list', component: EmployeeListComponent, canActivate: [AuthGuard] },
  { path: 'master/report/client-master-report', component: ClientMasterReportComponent, canActivate: [AuthGuard] },
  { path: 'master/report/kkdn', component: KKDNComponent, canActivate: [AuthGuard] },

  //Inventory report module
  { path: 'inventory/report/hq-stock-ledger', component: HQStockLedgerComponent, canActivate: [AuthGuard] },
  { path: 'inventory/report/branch-stock-ledger', component: BranchStockLedgerComponent, canActivate: [AuthGuard] },

  //payroll report module
  { path: 'report/payroll/monthly-advance-report', component: MonthlyAdvanceReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/pay-sheet-report', component: PaySheetComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/yearly-pay-sheet-report', component: YearlyPaySheetComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/pay-history-report', component: PayHistoryComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/payslip-report', component: PayslipReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/payslip2-report', component: Payslip2ReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/payslip3-report', component: Payslip3ReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/income-tax-report', component: IncomeTaxFormComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/leave-register-report', component: LeaveRegisterReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/leave-application-report', component: LeaveApplicationFormComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/netpay-report', component: NetpayReportsComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/misc-transaction-report', component: MiscTransactionReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/check-role-report', component: CheckroleReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/loan-ledger-report', component: LoanLedgerReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/epf-statement-report', component: EpfStatementReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/socso-statement-report', component: SocsoStatementReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/sip-statement-report', component: SipStatementReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/bank-salary-report', component: BankSalaryStatementReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/bank-salary2-report', component: BankSalaryStatement2ReportComponent, canActivate: [AuthGuard] },
  { path: 'report/payroll/list-summary-report', component: ListSummaryReportComponent, canActivate: [AuthGuard] },

  //finance report module
  { path: 'report/finance/invoice-report', component: InvoiceReportComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/payment-voucher-summary-report', component: PaymentVoucherSummaryComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/receipt-voucher-summary-report', component: ReceiptVoucherSummaryComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/branch-transactions-report', component: BranchTransactionsComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/branch-collections-report', component: BranchCollectionsComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/cheque-status-report', component: ChequeStatusReportComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/credit-note-summary-report', component: CreditNoteSummaryComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/profit-and-loss-report', component: ProfitAndLossComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/invoice-collection-status-report', component: InvoiceCollectionStatusReportComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/monthly-invoice-status', component: MonthlyInvoiceStatusComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/deleted-invoice-details', component: DeletedInvoiceDetailsComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/client-statement', component: ClientStatementComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/supplier-statement', component: SupplierStatementComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/invoice-ageing', component: InvoiceAgeingComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/print-invoice-computer-generated', component: PrintInvoiceComputerGeneratedComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/print-voucher-report', component: PrintVoucherReportComponent, canActivate: [AuthGuard] },
  { path: 'report/finance/receipt-voucher-report', component: ReceiptVoucherReportComponent, canActivate: [AuthGuard] },

  //Accounting report module
  { path: 'accounting/acc-gl-data-list', component: AccGlDataListComponent, canActivate: [AuthGuard] },
  { path: 'report/accounting/balance-sheet', component: BalanceSheetReportComponent, canActivate: [AuthGuard] },
  { path: 'report/accounting/trail-balance', component: TrailBalanceReportComponent, canActivate: [AuthGuard] },
  { path: 'report/accounting/accounting-profit-and-loss', component: AccountingProfitAndLossComponent, canActivate: [AuthGuard] },
  { path: 'report/accounting/bank-reconciliation', component: BankReconciliationReportComponent, canActivate: [AuthGuard] },
  { path: 'report/accounting/general-ledger', component: GeneralLedgerReportComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminLayoutRoutingModule {
}
