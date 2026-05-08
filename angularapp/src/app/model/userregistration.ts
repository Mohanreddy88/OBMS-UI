export class UserRegistration {
  UserId?: number;
  Password!: string;
  Name!: string;
  Designation?: string;
  Description?: string; 
  LastUpdatedBy?: string;
  isView?: boolean;
  IsAdmin?: string;
  Email?: string;
  ContactNo?: string;
  CreatedBy?: string;
  CreatedDate?:Date;
  LastUpdatedDate?:Date;
  IsDeleted?:boolean;
} 
