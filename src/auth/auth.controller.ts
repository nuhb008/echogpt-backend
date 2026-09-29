import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.name,
      dto.email,
      dto.password,
    );
  }

  @ApiOperation({ summary: 'Log in and receive an access token + refresh token' })
  @ApiResponse({ status: 200, description: 'Login succeeded' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(
      dto.email,
      dto.password,
    );
  }

  @ApiOperation({ summary: 'Exchange a refresh token for a new access token + refresh token (rotates the old one)' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 400, description: 'Refresh token is malformed' })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or already revoked' })
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: any, @Body() _dto: RefreshTokenDto) {
    return this.authService.refresh(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @ApiOperation({ summary: 'Revoke a single refresh token (sign out of one session)' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(
      req.user.id,
      dto.refreshToken,
    );
  }

  @ApiOperation({ summary: 'Revoke every refresh token for the current user (sign out everywhere)' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.id);
  }
}
