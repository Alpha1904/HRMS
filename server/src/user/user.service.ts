import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assumes prisma.service.ts exists
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password, role, tenantId, profile } = createUserDto;

    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User and Profile in a single transaction
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role,
          tenantId,
          profile: {
            create: {
              fullName: profile.fullName,
              department: profile.department,
              position: profile.position,
              contractType: profile.contractType,
            },
          },
        },
        include: {
          profile: true, // Return the user with their new profile
        },
      });

      const { password, ...result } = user;
      return result;

    } catch (error) {
      // Handle potential race conditions or other DB errors
      throw new ConflictException('Could not create user', error.message);
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    // Note: We assume the Prisma Middleware for soft-delete is active
    const users = await this.prisma.user.findMany({
      include: {
        profile: {
          select: { fullName: true, position: true, department: true },
        },
      },
    });
    // Strip all password hashes
    return users.map(({ password, ...user }) => user);
  }

  async findByemail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${email} not found`);
    }

    const { password, ...result } = user;
    return  result as User;
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // This updates *only* the User model
    // Profile updates are a separate concern
    await this.findOne(id); // Ensure user exists

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const { password, ...result } = user;
    return result as User;
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id); // Ensure user exists

    // We must soft-delete *both* the User and the Profile
    // Use a transaction to ensure both operations succeed or fail together
    await this.prisma.$transaction([
      this.prisma.profile.updateMany({
        where: { userId: id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: `User with ID ${id} has been soft-deleted.` };
  }
}