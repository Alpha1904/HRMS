import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Announcement, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService,
              private eventEmitter: EventEmitter2
  ) {}

  /**
   * Creates a new announcement. Requires the poster to be an HR/Admin.
   */
  async create(dto: CreateAnnouncementDto): Promise<Announcement> {
    // 1. Authorization: Check the poster's role
    const poster = await this.prisma.profile.findUnique({
      where: { id: dto.postedById },
      include: { user: true },
    });

    if (!poster || (poster.user.role !== Role.HR_ADMIN)) {
      throw new ForbiddenException('Only HR and System Administrators can create announcements.');
    }

    // 2. Create the announcement
    const newAnnouncement = await this.prisma.announcement.create({
      data: {
        ...dto,
      },
    });
    this.eventEmitter.emit('announcement.created', { announcement: newAnnouncement });
    return newAnnouncement;
  }

  /**
   * Retrieves all announcements visible to a given user/profile.
   */
  async findVisible(profileId: number): Promise<Announcement[]> {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    
    if (!profile) {
        throw new NotFoundException('Profile not found.');
    }
    
    // An announcement is visible if:
    // 1. It is global (isGlobal: true)
    // OR
    // 2. Its targetSites array contains the user's site OR department
    const targetConditions = [profile.site, profile.department].filter(Boolean) as string[];

    return this.prisma.announcement.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { 
            targetSites: {
                hasSome: targetConditions,
            }
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // NOTE: Update/Delete methods would also enforce HR/Admin role checks.

}