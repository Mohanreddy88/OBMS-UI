export interface SalaryDynamicStructure {
    dSalaryId: number;
    dBranchCode: string | null;
    dEmployeeType: string | null;
    dEmployeeNationality: string | null;
    dName: string | null;
    dGeneralDayRate: number;
    dGeneralDayHours: number;
    dGeneralDayOTRate: number;
    dOffDayRate: number;
    dOffDayOTRate: number;
    dHolidayRate: number;
    dHolidayOTRate: number;
    dWorkingDays: number;
    dWorkingHours: number;
    dSalaryBand: number;
    dTravelAllowance: number;
    dStatus: string | null;
    dEICC: boolean;
    dNonStructure: boolean;
    dActive: string | null;
}   