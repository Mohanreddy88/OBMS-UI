// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  //FWG Server
  CompanyCode: 'FWG',
  CompanyName: 'FREIGHTWATCH G PATOMOTOH SECURITY SERVICES SDN.BHD.',
  Registration: '(357119-K)',
  CompanyEPF: '015117931',
  CompanyPIC: 'Madam Saras',
  CompanyPICContact: '0102000000',

  // Bank configuration
  CIMB: 'CIMB',
  CIMB_OrganizationCode: '69778',
  CIMB_OrganizationName: 'FREIGHTWATCH G PATOMOTOH SECURITY SERVIC',
  CIMB_SecurityCode: '0000000000000000',
  CIMB_BNMCode: '3500000',

  CompanyRegNumber: '357119-K',
  SocsoCompanyCode: 'D4100019020Z',

  PayTypeEPF: "EPF",
  PayTypeSOCSO: "Socso",
  PayTypeSIP: "SIP",


  BSN: 'BSN',
  BSN_OrganizationCode: 'F5069800',
  BSN_OrganizationName: 'FREIGHTWATCH G PATOMOTOH',
  BSN_SecurityCode: '0000000000000000',
  BSN_BNMCode: '3500000',

  //Local IIS Serverconfiguration
  //IIS Server configuration
  baseUrl: 'http://localhost:16787/api/',
  baseReportUrl: 'http://localhost:58008/',
};

export const TAX = {
  GSTStart6: "2011/01/01",
  GSTEnd6: "2018/05/31",
  GSTStart0: "2018/06/01",
  GSTEnd0: "2018/08/31",
  SSTStart6: "2018/09/01",
  SSTEnd6: "9999/12/31",
  SSTStart8: "2024/03/01",
  SSTEnd8: "9999/12/31",
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
