export class OBMSBranchesModel {
    ID: number;
    Name: string;
    BranchCode: string;
    IsAllowed: boolean | null;
    LastUpdatedDate: Date;
    LastUpdatedBy: string;
    constructor(data: Partial<OBMSBranchesModel> = {}) {
        this.ID = data.ID || 0;
        this.Name = data.Name || '';
        this.BranchCode = data.BranchCode || '';
        this.IsAllowed = data.IsAllowed || false;
        this.LastUpdatedDate = data.LastUpdatedDate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
}