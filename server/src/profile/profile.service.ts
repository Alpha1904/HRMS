import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, Leave, Prisma, Role } from '@prisma/client';
import { QueryProfileDto } from './dto/query-profile.dto'
import * as fs from 'fs';
import { join } from 'path';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

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
    const { page = 1, limit = 10, search, department, sortBy, sortOrder } = query;

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

    // Build orderBy dynamically but restrict to allowed fields to avoid injections
    let orderBy: any = { fullName: 'asc' };
    if (sortBy) {
      const dir = sortOrder && String(sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc';
      // Allow simple fields on Profile and a few nested user fields
      const simpleFields = ['id', 'fullName', 'phone', 'department', 'hireDate'];
      const userFields = ['email', 'isActive'];

      if (simpleFields.includes(sortBy)) {
        orderBy = { [sortBy]: dir };
      } else if (sortBy.startsWith('user.') ) {
        const [, ufield] = sortBy.split('.');
        if (userFields.includes(ufield)) {
          orderBy = { user: { [ufield]: dir } };
        }
      }
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
        orderBy,
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
       include: { user: { select: { email: true, role: true } } 
    }});

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
       include: { user: { select: { email: true, role: true } }
    }});

    if (!profile) {
      throw new NotFoundException(`Profile for User ID ${userId} not found`);
    }
    return profile;
  }

  async update(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    // Ensure profile exists first and get current profile (includes userId)
    const existing = await this.findOne(id);

    const incoming: any = updateProfileDto || {};
    const { user: userPayload, ...profilePayload } = incoming;

    const ops: Prisma.PrismaPromise<any>[] = [];

    if (Object.keys(profilePayload).length > 0) {
      ops.push(
        this.prisma.profile.update({
          where: { id },
          data: profilePayload,
        }),
      );
    }

    if (userPayload && Object.keys(userPayload).length > 0) {
      ops.push(
        this.prisma.user.update({
          where: { id: existing.userId },
          data: userPayload as any,
        }),
      );
    }

    // If nothing to update, simply return the existing profile
    if (ops.length === 0) {
      return existing;
    }

    try {
      await this.prisma.$transaction(ops);
      return this.findOne(id);
    } catch (err: any) {
      // Surface validation errors as BadRequest for clearer API responses.
      if (err && err.message) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }


  async remove(id: number): Promise<{ message: string }> {
    // This is the "Profile ID", not the "User ID"
    const profile = await this.findOne(id);
    const userId = profile.userId;

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
    const serverUrl = 'http://localhost:3000';
    const newAvatarUrl = `${serverUrl}/public/uploads/avatars/${file.filename}`;

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



  /**
   * ###  Real-Time Availability
   * Finds all approved leave for a manager's team that overlaps
   * with a given date range.
   */
  async getTeamAvailability(
    managerProfileId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Leave[]> {
    
    // 1. Verify the manager exists (findOne handles this)
    await this.findOne(managerProfileId);

    // 2. Find all leave records where:
    //    - The profile's manager is the one we're asking about
    //    - The status is APPROVED
    //    - The leave period *overlaps* with the query range
    
    return this.prisma.leave.findMany({
      where: {
        profile: {
          managerId: managerProfileId, // Filter by the manager's team
        },
        status: 'APPROVED', // Only show confirmed leave
        AND: [
          // Leave starts *before* or *on* the query's end date
          { startDate: { lte: endDate } },
          // Leave ends *after* or *on* the query's start date
          { endDate: { gte: startDate } },
        ],
      },
      include: {
        // Include who is on leave for the frontend calendar
        profile: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
}