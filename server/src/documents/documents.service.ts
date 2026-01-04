import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Document } from '@prisma/client';
import { unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private prisma: PrismaService) {}

  async upload(
    file: Express.Multer.File,
    entityType: 'profile' | 'candidate' | 'application',
    entityId: number,
    docType: string,
  ): Promise<Document> {
    this.logger.log(`Uploading document for ${entityType} ${entityId}`);

    const uploadUrl = `/uploads/${file.filename}`;
    
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

    return this.prisma.document.create({ data });
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