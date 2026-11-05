import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartureDocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(departureId: number, data: { name: string; type?: string; url: string }, currentUser: { id: number }) {
    const departure = await this.prisma.departure.findUnique({ where: { id: departureId }, select: { id: true } });
    if (!departure) throw new NotFoundException('Departure not found');

    const created = await this.prisma.departureDocument.create({
      data: {
        departure: { connect: { id: departureId } },
        name: data.name,
        type: data.type,
        url: data.url,
        uploadedBy: { connect: { id: currentUser.id } },
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'DOCUMENT_UPLOADED',
        details: { documentId: created.id, name: created.name, type: created.type },
        performedById: currentUser.id,
      },
    });

    return created;
  }

  async list(departureId: number) {
    return this.prisma.departureDocument.findMany({ where: { departureId }, orderBy: { uploadedAt: 'desc' } });
  }

  async remove(documentId: number, currentUser: { id: number }) {
    const doc = await this.prisma.departureDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.departureDocument.delete({ where: { id: documentId } });

    await this.prisma.departureHistory.create({
      data: {
        departureId: doc.departureId,
        eventType: 'DOCUMENT_DELETED',
        details: { documentId },
        performedById: currentUser.id,
      },
    });

    return { message: 'Document deleted' };
  }
}
