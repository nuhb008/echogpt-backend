import type { RoleName } from '../enums/index.js';

// Shape returned by JwtStrategy.validate() (UsersService.findById) and attached as req.user.
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: { name: RoleName };
}
