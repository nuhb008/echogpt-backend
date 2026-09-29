import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { RoleName } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: { select: { name: true } },
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /** Admin-triggered removal: no password required, but the last admin is still protected. */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.ensureNotLastAdmin(user.role.name);

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async setRole(id: string, roleName: RoleName) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name === 'ADMIN' && roleName !== 'ADMIN') {
      await this.ensureNotLastAdmin('ADMIN');
    }

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' does not exist`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      select: { id: true, email: true, name: true, role: { select: { name: true } } },
    });
  }

  async updateProfile(userId: string, data: { name?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    await this.verifyPassword(userId, currentPassword);

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Changing the password signs the user out everywhere.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    return { success: true };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.verifyPassword(userId, password);

    await this.ensureNotLastAdmin(user.role.name);

    // Sessions, subscription, conversations, searches and usage logs cascade.
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  private async ensureNotLastAdmin(roleName: string) {
    if (roleName !== 'ADMIN') {
      return;
    }

    const adminCount = await this.prisma.user.count({
      where: { role: { name: 'ADMIN' } },
    });

    if (adminCount <= 1) {
      throw new ForbiddenException('The last admin account cannot be changed or deleted');
    }
  }

  private async verifyPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Password is incorrect');
    }

    return user;
  }
}
