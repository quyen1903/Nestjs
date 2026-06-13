export enum RoleShop{
    SHOP = 'SHOP',
    WRITER = 'WRITER',
    EDITOR = 'EDITOR',
    ADMIN = 'ADMIN'
}

enum Sex{
    MALE = 'MALE',
    FEMALE = 'FEMALE'
}

export interface IAccountBase {
    name: string;
    email: string;
    password: string;
}

export interface IUserAccount extends IAccountBase {
    phone: string;
    sex: Sex;
    avatar?: string;
    dateOfBirth?: string;
}

export interface IShopAccount extends IAccountBase {}
  