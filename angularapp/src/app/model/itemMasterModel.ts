export class ItemMasterModel {
    ID!: number;
    CategoryID!: number;
    AdvanceID!: number;
    ItemID!: number;
    Name?: string; 
    Price?: number;
    LASTUPDATE?: Date;
    LastUpdatedBy?: string;
    SellPrice?: number;
    Remarks?: string;
    Quantity?: number;
  }