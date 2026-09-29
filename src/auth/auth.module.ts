import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

import { RolesGuard } from '../common/guards/roles.guard.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    UsersModule,

    SubscriptionsModule,

    PassportModule,

    // registerAsync so the secret is read after ConfigModule has loaded .env
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],

  exports: [AuthService],
})
export class AuthModule {}
