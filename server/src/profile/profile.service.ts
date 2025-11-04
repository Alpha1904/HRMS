import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Profile[]> {
    // We assume soft-delete middleware is active for Profiles as well
    // If not, you must add: where: { deletedAt: null }
    return this.prisma.profile.findMany({
      // You would add { where: { deletedAt: null } } if you
      // haven't added 'Profile' to your soft-delete middleware
    });
  }

  /**
   * Finds a profile by its own unique Profile ID
   */
  async findOne(id: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      // include: { user: true } // Optionally include user data
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  /**
   * Finds a profile using the User ID (a common use case)
   */
  async findOneByUserId(userId: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      // include: { user: true }
    });

    if (!profile) {
      throw new NotFoundException(`Profile for User ID ${userId} not found`);
    }
    return profile;
  }

  async update(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    // Ensure profile exists first
    await this.findOne(id);

    return this.prisma.profile.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    // This is the "Profile ID", not the "User ID"
    const profile = await this.findOne(id);
    const userId = profile.userId;

    // To maintain data integrity, we soft-delete BOTH the Profile and
    // its associated User in a transaction.
    // This logic is identical to the one in UserService.
    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: `Profile with ID ${id} and associated user have been soft-deleted.` };
  }

async updateAvatar(
    id: number,
    file: Express.Multer.File,
  ): Promise<Profile> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    // 1. Find the profile to get the old avatar URL
    const profile = await this.findOne(id);
    const oldAvatarUrl = profile.avatarUrl;

    // 2. Define the new web-accessible URL
    // This matches the static path we set up
    const newAvatarUrl = `/uploads/avatars/${file.filename}`;

    // 3. Update the database
    const updatedProfile = await this.prisma.profile.update({
      where: { id },
      data: { avatarUrl: newAvatarUrl },
    });

    // 4. Delete the old avatar file (if it exists)
    if (oldAvatarUrl) {
      const oldAvatarPath = join(
        __dirname,
        '..',
        '..',
        'public',
        oldAvatarUrl,
      );
      // Use fs.unlink to delete the file, catching errors
      fs.unlink(oldAvatarPath, (err) => {
        if (err) {
          console.error('Failed to delete old avatar:', oldAvatarPath, err);
        }
      });
    }

    return updatedProfile;
  }
  
}