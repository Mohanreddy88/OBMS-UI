export class ClientResponseModel {
    id!: number;
    code!: string;
    name!: string;
    address1!: string;
    address2!: string;
    postCode!: number;
    city!: string;
    state!: string;
    phone!: number;
    fax?: number;
    email?: string;
    personIncharge!: string;
    branch!: string;
    createdDate?: Date;
    lastUpdatedBy?: string;
    shortname?: string;
    status!: string;
    superClientCode?: string;
    isClientHeadQuarters?: boolean;   
    LastUpdatedDate?: Date;
    agreementStart?: Date;
    agreementEnd?: Date;
}