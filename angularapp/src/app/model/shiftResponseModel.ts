export class ShiftResponseModel {
    id!:number;
    shiftType!: string;
    shiftFrom!:string;
    shiftTo!:string;
    lastUpdate?:Date;
    lastUpdatedBy?:string;
}