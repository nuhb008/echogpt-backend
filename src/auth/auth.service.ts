import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
  };

  const accessToken =
    await this.jwtService.signAsync(payload);

  return {
    accessToken,
  };
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
}