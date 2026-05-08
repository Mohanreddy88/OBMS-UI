export class AttendanceDetails {
    ID: number;
    AttendanceID: number;
    AttendanceDate: Date;
    Client?: string | null;
    TimeStart?: Date | null;
    TimeEnd?: Date | null;
    OTClient?: string | null;
    OTTimeStart?: Date | null;
    OTTimeEnd?: Date | null;
    Type: number;
    LastUpdate: Date;
    LastUpdatedBy?: string | null;
  
    constructor(data: Partial<AttendanceDetails> = {}) {
      this.ID = data.ID || 0;
      this.AttendanceID = data.AttendanceID || 0;
      this.AttendanceDate = data.AttendanceDate || new Date();
      this.Client = data.Client || null;
      this.TimeStart = data.TimeStart ? new Date(data.TimeStart) : null;
      this.TimeEnd = data.TimeEnd ? new Date(data.TimeEnd) : null;
      this.OTClient = data.OTClient || null;
      this.OTTimeStart = data.OTTimeStart ? new Date(data.OTTimeStart) : null;
      this.OTTimeEnd = data.OTTimeEnd ? new Date(data.OTTimeEnd) : null;
      this.Type = data.Type || 0;
      this.LastUpdate = data.LastUpdate || new Date();
      this.LastUpdatedBy = data.LastUpdatedBy || null;
    }
  }
  