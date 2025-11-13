import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { Forum, Topic, Reply } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService,
                private eventEmitter: EventEmitter2
  ) {}

  // --- FORUM (Category) CRUD ---

  async findAllForums(): Promise<Forum[]> {
    return this.prisma.forum.findMany({
      include: { topics: { select: { id: true } } } // Count topics in controller
    });
  }

  // --- TOPIC (Thread) CRUD ---

  async createTopic(dto: CreateTopicDto): Promise<Topic> {
    // Basic validation to ensure the forum and author exist
    const [forum, author] = await Promise.all([
        this.prisma.forum.findUnique({ where: { id: dto.forumId } }),
        this.prisma.profile.findUnique({ where: { id: dto.authorId } }),
    ]);
    if (!forum) throw new NotFoundException('Forum not found.');
    if (!author) throw new NotFoundException('Author profile not found.');

    return this.prisma.topic.create({
      data: dto,
    });
  }

  async findTopicsInForum(forumId: number): Promise<Topic[]> {
    return this.prisma.topic.findMany({
      where: { forumId },
      include: { 
        author: { select: { fullName: true } }, 
        _count: { select: { replies: true } } 
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findOneTopic(topicId: number): Promise<Topic & { replies: Reply[] }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { 
        author: { select: { fullName: true } },
        replies: {
            include: { author: { select: { fullName: true } } },
            orderBy: { createdAt: 'asc' },
        }
      },
    });
    if (!topic) throw new NotFoundException('Topic not found.');
    return topic as Topic & { replies: Reply[] };
  }

  // --- REPLY (Comment) CRUD ---

  async createReply(dto: CreateReplyDto): Promise<Reply> {
    // Basic validation to ensure the topic and author exist
    const [topic, author] = await Promise.all([
        this.prisma.topic.findUnique({ where: { id: dto.topicId } }),
        this.prisma.profile.findUnique({ where: { id: dto.authorId } }),
    ]);
    if (!topic) throw new NotFoundException('Topic not found.');
    if (!author) throw new NotFoundException('Author profile not found.');

    const newReply = await this.prisma.reply.create({
      data: dto,
    });
    
    // Update the parent topic's 'updatedAt' timestamp to bring it to the top of the forum list
    await this.prisma.topic.update({
        where: { id: dto.topicId },
        data: { updatedAt: new Date() }
    });

    // EMIT THE EVENT
    this.eventEmitter.emit('reply.created', { reply: newReply });

    
    return newReply;
  }
}