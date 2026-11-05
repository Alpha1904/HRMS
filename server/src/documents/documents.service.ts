import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Document } from '@prisma/client';
import { unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private prisma: PrismaService) {}

  // GET ALL DOCS
  async docs(): Promise<any[]> {
    const documents = await this.prisma.document.findMany({
      include: {
        profile: {
          select: { fullName: true }
        },
        candidate: {
          select: { fullName: true }
        },
        application: {
          include: {
            candidate: {
              select: { fullName: true }
            },
            profile: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    return documents.map(doc => {
      let entityType: 'profile' | 'candidate' | 'application' | null = null;
      let fullName: string | null = null;

      if (doc.profileId) {
        entityType = 'profile';
        fullName = doc.profile?.fullName || 'Unknown Profile';
      } else if (doc.candidateId) {
        entityType = 'candidate';
        fullName = doc.candidate?.fullName || 'Unknown Candidate';
      } else if (doc.applicationId) {
        entityType = 'application';
        fullName = doc.application?.candidate?.fullName || 
                   doc.application?.profile?.fullName || 
                   'Unknown Application';
      }

      // Remove the nested relations and add computed fields
      const { profile, candidate, application, ...docData } = doc;
      
      return {
        ...docData,
        entityType,
        fullName
      };
    });
  }

  async upload(
    file: Express.Multer.File,
    entityType: 'profile' | 'candidate' | 'application',
    sentityId: string,
    docType: string,
    prisma?: any,
  ): Promise<Document> {

    const entityId = Number(sentityId)
    this.logger.log(`Uploading document for ${entityType} ${entityId}`);
    const serverUrl = 'http://localhost:3000';
    const uploadUrl = `${serverUrl}/public/uploads/docs/${file.filename}`;
    
    const data: any = {
      fileName: file.originalname,
      type: docType,
      mimeType: file.mimetype,
      size: file.size,
      uploadUrl,
    };

    if (entityType === 'profile') {
      data.profileId = entityId;
    } else if (entityType === 'candidate') {
      data.candidateId = entityId;
    } else if (entityType === 'application') {
      data.applicationId = entityId;
    }

    const prismaClient = prisma || this.prisma;
    return prismaClient.document.create({ data });
  }

  async findById(id: number): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async delete(id: number): Promise<void> {
    const document = await this.findById(id);

    // Soft delete
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Optionally delete physical file
    if (document.uploadUrl) {
      try {
        const filePath = join(process.cwd(), document.uploadUrl.replace(/^\//, ''));
        unlinkSync(filePath);
      } catch (error) {
        this.logger.warn(`Failed to delete file: ${error.message}`);
      }
    }

    this.logger.log(`Document ${id} deleted`);
  }
}