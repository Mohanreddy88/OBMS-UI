export class ScreenListModel {
    ScreenName: string;
    Category: string;
    LastUpdate: Date;
    LastUpdatedBy: string | null;

    constructor(data: Partial<ScreenListModel> = {}) {
       
        this.ScreenName = data.ScreenName || '';
        this.Category = data.Category || '';
        this.LastUpdate = data.LastUpdate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
  }