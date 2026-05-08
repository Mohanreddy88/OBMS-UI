export class KKDNExcelListView {
    EmpID: number;
    BranchCode: string;
    Name: string;
    IC: string;
    DOB: Date;
    Nationality: string;
    Citizen: string;
    Race: string;
    Gender: string;
    Address: string;
    DateJoin: Date;
    JobTitle: string;
    EPF: string;
    SOSCO: string;
    KDNVetting: boolean;
    HasTransfer: boolean;

    constructor(data: Partial<KKDNExcelListView> = {}) {
        this.EmpID = data.EmpID || 0;
        this.BranchCode = data.BranchCode || '';
        this.Name = data.Name || '';
        this.DOB = data.DOB || new Date();
        this.IC = data.IC || '';
        this.Nationality = data.Nationality || '';
        this.Citizen = data.Citizen || '';
        this.Race = data.Race || '';
        this.Gender = data.Gender || '';
        this.Address = data.Address || '';
        this.DateJoin = data.DateJoin || new Date();
        this.JobTitle = data.JobTitle || '';
        this.EPF = data.EPF || '';
        this.SOSCO = data.SOSCO || '';
        this.KDNVetting = data.KDNVetting || false;
        this.HasTransfer = data.HasTransfer || false;
      }
}
