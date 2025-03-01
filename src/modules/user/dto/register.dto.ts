import { User } from "@prisma/client";

export type RegisterUserDTO = Pick<User, 'name' | 'email' | 'password' | 'avatar' |'dateOfBirth' | 'phone' | 'sex' >;