import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user =
      await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    return this.issueTokens(user.id, user.email, user.role.name);
  }

  async register(
    name: string,
    email: string,
    password: string,
  ) {
    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const userRole =
      await this.prisma.role.findUnique({
        where: {
          name: 'USER',
        },
      });

    if (!userRole) {
      throw new Error('USER role does not exist');
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId: userRole.id,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  // The refresh token's signature and expiry were already checked by JwtRefreshStrategy;
  // here we check it hasn't been revoked, then rotate it.
  async refresh(userId: string, refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { role: true } },
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has been revoked',
      );
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    return this.issueTokens(
      session.user.id,
      session.user.email,
      session.user.role.name,
    );
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
      },
    });

    return { success: true };
  }

  async logoutAll(userId: string) {
    const { count } = await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { success: true, revokedSessions: count };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };

    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessToken =
      await this.jwtService.signAsync(payload);

    // jti makes every refresh token unique, even when two are issued in the same second
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
      },
    );

    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
