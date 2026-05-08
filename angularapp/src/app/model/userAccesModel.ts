export class UserAccessModel{
    readAccess?: boolean = false || undefined;
    deleteAccess?: boolean = false || undefined;
    updateAccess?: boolean = false || undefined;
    createAccess?: boolean = false || undefined;

    constructor(data: Partial<UserAccessModel> = {}) {
        this.readAccess = data.readAccess || false;
        this.deleteAccess = data.deleteAccess || false;
        this.updateAccess = data.updateAccess || false;
        this.createAccess = data.createAccess || false;
      }
}