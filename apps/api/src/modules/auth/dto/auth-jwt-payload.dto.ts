import jwt from 'jsonwebtoken';
export type AuthJwtPayloadDTO = Pick<jwt.JwtPayload, 'sub'>;
