import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, Prisma, Role } from '@prisma/client';
import { QueryProfileDto } from './dto/query-profile.dto'
import * as fs from 'fs';
import { join } from 'path';

export interface PaginatedProfileResult {
  data: Profile[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

async findAll(
    query: QueryProfileDto,
  ): Promise<PaginatedProfileResult> {
    const { page = 1, limit = 10, search, department } = query;

    // 1. Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // 2. Build the dynamic 'where' clause
    const where: Prisma.ProfileWhereInput = {
      // CRITICAL: Explicitly filter soft-deleted records
      deletedAt: null,
    };

    if (department) {
      where.department = {
        equals: department,
        mode: 'insensitive', // 'Engineering' == 'engineering'
      };
    }

    if (search) {
      where.OR = [
        // Search by full name on the Profile model
        { fullName: { contains: search, mode: 'insensitive' } },
        // Search by email on the related User model
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 3. Run queries in a transaction for efficiency
    const [profiles, total] = await this.prisma.$transaction([
      // Query for the data
      this.prisma.profile.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { email: true, role: true, isActive: true },
          },
        },
        orderBy: {
          fullName: 'asc', // Default sorting
        },
      }),
      // Query for the total count
      this.prisma.profile.count({ where }),
    ]);

    // 4. Calculate pagination metadata
    const lastPage = Math.ceil(total / limit);

    // 5. Return the paginated response
    return {
      data: profiles,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
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

  /**
   * Updates the avatar for a profile
   */

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
  

  /*
  * Gets all manager profiles.
  */

  async getAllManagers(): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: {
        user: {
          role: Role.MANAGER,
        },
        deletedAt: null, // Only return active managers
      }, 
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });
  }


  /**
   * Gets all profiles that report to a specific manager.
   * @param managerProfileId The *Profile ID* of the manager
   */
  async getTeamByManagerId(managerProfileId: number): Promise<Profile[]> {
    // 1. Verify the manager profile exists
    await this.findOne(managerProfileId);

    // 2. Find all profiles where managerId matches
    return this.prisma.profile.findMany({
      where: {
        managerId: managerProfileId,
        deletedAt: null, // Only return active employees
      },
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });
  }

  /**
   * Assigns a list of employees to a manager.
   * @param managerProfileId The *Profile ID* of the manager
   * @param employeeProfileIds An array of *Profile IDs* of employees
   */
  async addTeamMembers(
    managerProfileId: number,
    employeeProfileIds: number[],
  ): Promise<{ count: number }> {
    // 1. Verify the manager profile exists
    await this.findOne(managerProfileId);

    // 2. Update the managerId for all specified employees
    const result = await this.prisma.profile.updateMany({
      where: {
        id: { in: employeeProfileIds },
      },
      data: {
        managerId: managerProfileId,
      },
    });

    return { count: result.count };
  }

  /**
   * Removes a list of employees from a manager's team.
   * This sets their managerId to null.
   * @param managerProfileId The *Profile ID* of the manager
   * @param employeeProfileIds An array of *Profile IDs* of employees
   */
  async removeTeamMembers(
    managerProfileId: number,
    employeeProfileIds: number[],
  ): Promise<{ count: number }> {
    // 1. Verify the manager profile exists (already done by findOne)
    await this.findOne(managerProfileId);

    // 2. Update the managerId to null *only* for employees who
    //    are in the list AND currently report to this manager.
    const result = await this.prisma.profile.updateMany({
      where: {
        id: { in: employeeProfileIds },
        managerId: managerProfileId, // Safety check
      },
      data: {
        managerId: null, // Un-assign the manager
      },
    });

    return { count: result.count };
  }
}