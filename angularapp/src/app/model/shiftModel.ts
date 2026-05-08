export class ShiftModel {
    Id!:number;
    ShiftType!: string;
    ShiftFrom!:string;
    ShiftTo!:string;
    LastUpdate?:Date;
    LastUpdatedBy?:string;
}