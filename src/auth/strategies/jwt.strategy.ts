import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    const secretOrKey = process.env.JWT_ACCESS_SECRET;

    if (!secretOrKey) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      secretOrKey,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    // A valid token for a deleted account must be a 401, not findById's 404.
    return this.usersService.findById(payload.sub).catch(() => {
      throw new UnauthorizedException();
    });
  }
}