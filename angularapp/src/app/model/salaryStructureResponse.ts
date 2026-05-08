export interface SalaryStructureResponse {
    salaryId: number;
    branchCode: string | null;
    employeeType: string | null;
    employeeNationality: string | null;
    name: string | null;
    generalDayRate: number;
    generalDayHours: number;
    generalDayOTRate: number;
    offDayRate: number;
    offDayOTRate: number;
    holidayRate: number;
    holidayOTRate: number;
    workingDays: number;
    workingHours: number;
    salaryBand: number;
    travelAllowance: number;
    status: string | null;
    eICC: boolean;
    nonStructure: boolean;
    active: string | null;
}   