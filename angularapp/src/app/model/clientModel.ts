export class ClientModel {
    Id: number;
    Code: string;
    Name: string;
    Address1: string;
    Address2: string;
    PostCode: number;
    City: string;
    State: string;
    Phone: number;
    Fax: number;
    Email: string;
    PersonIncharge: string;
    Branch: string;
    CreatedDate: Date | null = null;
    LastUpdatedBy: string;
    Shortname: string;
    Status: string;
    SuperClientCode: string;
    IsClientHeadQuarters: boolean;   
    LastUpdatedDate: Date | null = null;
    AgreementStart: Date | null = null;
    AgreementEnd: Date | null = null;
    constructor(data: Partial<ClientModel> = {}) {
        this.Id = data.Id || 0;
        this.Code = data.Code || '';
        this.Name = data.Name || '';
        this.Address1 = data.Address1 || '';
        this.Address2 = data.Address2 || '';
        this.PostCode = data.PostCode || 0;
        this.City = data.City || '';
        this.State = data.State || '';
        this.Phone = data.Phone || 0;
        this.Fax = data.Fax || 0;
        this.Email = data.Email || '';
        this.PersonIncharge = data.PersonIncharge || '';
        this.Branch = data.Branch || '';
        this.CreatedDate = data.CreatedDate || null;
        this.LastUpdatedBy = data.LastUpdatedBy || '';
        this.Shortname = data.Shortname || '';
        this.Status = data.Status || '';
        this.SuperClientCode = data.SuperClientCode || '';
        this.IsClientHeadQuarters = data.IsClientHeadQuarters || false;
        this.LastUpdatedDate = data.LastUpdatedDate || null;
        this.AgreementStart = data.AgreementStart || null;
        this.AgreementEnd = data.AgreementEnd || null;
    }
}