import { Request } from 'express';
import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface'; 
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
export interface AuthRequestDTO extends Request {
    keyStore: IKeyToken;
    account: IJWTdecode;
    refreshToken: string;
    apiKey: Iapikey;
    requestId: string;
}