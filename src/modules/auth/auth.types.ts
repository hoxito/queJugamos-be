import { UserRole } from "../users/domain/user-role.enum";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type JwtUserPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};
