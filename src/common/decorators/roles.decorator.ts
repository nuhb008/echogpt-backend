import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '../enums/index.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
