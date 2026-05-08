export interface SalaryStructure {
    SalaryId: number;
    BranchCode: string | null;
    EmployeeType: string | null;
    EmployeeNationality: string | null;
    Name: string | null;
    GeneralDayRate: number;
    GeneralDayHours: number;
    GeneralDayOTRate: number;
    OffDayRate: number;
    OffDayOTRate: number;
    HolidayRate: number;
    HolidayOTRate: number;
    WorkingDays: number;
    WorkingHours: number;
    SalaryBand: number;
    TravelAllowance: number;
    Status: string | null;
    EICC: boolean;
    NonStructure: boolean;
    Active: string | null;
    ActualDays: number;
    LastUpdatedBy: string | null;
}   