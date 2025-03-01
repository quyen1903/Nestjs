import { User } from "@prisma/client";

export type LoginUserDTO = Pick<User, 'email' | 'password'>;