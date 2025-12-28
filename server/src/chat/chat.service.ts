import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Helper: find Profile.id by User.id (throws if not found)
  private async resolveProfileIdByUserId(userId: number | string) {
    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) throw new Error('Invalid or missing user id');

    const profile = await this.prisma.profile.findUnique({ where: { userId: uid } });
    if (!profile) throw new Error(`Profile not found for user ${uid}`);
    return profile.id;
  }

  async getUserRooms(userId: number) {
    const profileId = await this.resolveProfileIdByUserId(userId);
    return this.prisma.chatMember.findMany({
      where: { userId: profileId },
      select: { roomId: true },
    });
  }

  async saveMessage(userId: number, roomId: string, content: string) {
    // Resolve profile id for the sender
    const profileId = await this.resolveProfileIdByUserId(userId);

    // Perform safety check: Is user actually in this room?
    const isMember = await this.prisma.chatMember.findUnique({
      where: { userId_roomId: { userId: profileId, roomId } },
    });

    if (!isMember) throw new Error('Not authorized to post in this room');

    // Create message and bump the room's updatedAt in a single transaction
    const [newMessage] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          content,
          senderId: profileId,
          roomId: roomId,
        },
        include: {
          sender: { select: { fullName: true, avatarUrl: true } }, // Include sender info for frontend
        },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return newMessage;
  }

  async getOrCreateDirectChat(currentUserId: number, targetUserId: number) {
    // Resolve profile ids for both users
    const currentProfileId = await this.resolveProfileIdByUserId(currentUserId);
    const targetProfileId = await this.resolveProfileIdByUserId(targetUserId);

    // 1. Try to find an existing 1:1 chat
    // This query looks for a room that has BOTH users as members
    const existingChat = await this.prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: currentProfileId } } },
          { members: { some: { userId: targetProfileId } } },
        ],
      },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } }, // Return user details so frontend knows who is who
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // 2. If no chat exists, create one
    const newChat = await this.prisma.chatRoom.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId: currentProfileId, role: 'MEMBER' },
            { userId: targetProfileId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return newChat;
  }

  async addMembersToRoom(roomId: string, memberUserIds: number[]) {
    // Resolve all member profile ids
    const memberProfileIds = await Promise.all(
      memberUserIds.map(uid => this.resolveProfileIdByUserId(uid))
    );

    const updatedRoom = await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        members: {
          create: memberProfileIds.map(pid => ({
            userId: pid,
            role: 'MEMBER'
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
    return updatedRoom;
  }

  async removeMembersFromRoom(roomId: string, memberUserIds: number[]) {
    // Resolve all member profile ids
    const memberProfileIds = await Promise.all(
      memberUserIds.map(uid => this.resolveProfileIdByUserId(uid))
    );

    // Delete the chat members
    await this.prisma.chatMember.deleteMany({
      where: {
        roomId: roomId,
        userId: {
          in: memberProfileIds
        }
      }
    });

    // Return the updated room
    const updatedRoom = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
    
    return updatedRoom;
  }

  async getMyRooms(userId: number) {
    try {
      const profileId = await this.resolveProfileIdByUserId(userId);
      // Fetch rooms where the user is a member
      return await this.prisma.chatRoom.findMany({
        where: {
          members: {
            some: { userId: profileId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
          // Fetch the last message for the "Preview" text (e.g., "See you tomorrow...")
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { fullName: true } }
            }
          },
        },
        // Use createdAt to avoid relying on an unapplied migration for updatedAt
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (err) {
      console.error('Error fetching chat rooms for user', userId, err);
      return [];
    }
  }

  async getRoomMessages(userId: number, roomId: string, limit = 50, cursor?: string) {
    // Resolve profile id and security: Check if user belongs to this room
    const profileId = await this.resolveProfileIdByUserId(userId);

    const membership = await this.prisma.chatMember.findUnique({
      where: {
        userId_roomId: { userId: profileId, roomId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat room');
    }

    // 2. Fetch Messages with Pagination
    return this.prisma.chatMessage.findMany({
      where: { roomId },
      take: limit,
      skip: cursor ? 1 : 0, // Skip the cursor itself if provided
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc', // Get newest first (Frontend will reverse this list)
      },
      include: {
        sender: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  async searchUsers(query: string, currentUserId: number) {
    const q = (query || '').trim();
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId }, 
        isActive: true,
        profile: {
          fullName: { contains: q, mode: 'insensitive' }, // Search by full name
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { fullName: true, avatarUrl: true } },
      },
      take: 20, // limit results
    });
  }

  async createGroupRoom(name: string, memberUserIds: number[]) {
    // Resolve creator's profile id (first member will be treated as creator)
    const creatorProfileId = await this.resolveProfileIdByUserId(memberUserIds[0]);
    // Resolve all member profile ids
    const memberProfileIds = await Promise.all(
      memberUserIds.map(uid => this.resolveProfileIdByUserId(uid))
    );

    const newRoom = await this.prisma.chatRoom.create({
      data: {
        name,
        type: 'GROUP',
        members: {
          create: memberProfileIds.map(pid => ({
            userId: pid,
            role: pid === creatorProfileId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });

    return newRoom;
  }

  async createAnnouncementRoom(name: string, memberUserIds: number[]) {
    // Resolve creator's profile id (first member will be treated as creator)
    const creatorProfileId = await this.resolveProfileIdByUserId(memberUserIds[0]);
    // Resolve all member profile ids
    const memberProfileIds = await Promise.all(
      memberUserIds.map(uid => this.resolveProfileIdByUserId(uid))
    );

    const newRoom = await this.prisma.chatRoom.create({
      data: {
        name,
        type: 'ANNOUNCEMENT',
        members: {
          create: memberProfileIds.map(pid => ({
            userId: pid,
            role: pid === creatorProfileId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });

    return newRoom;
  }
}